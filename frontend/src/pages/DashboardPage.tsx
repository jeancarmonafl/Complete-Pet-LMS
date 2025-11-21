import {
  AcademicCapIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { SupervisorApprovalModal } from "../components/SupervisorApprovalModal";
import { TrainingFlowModal } from "../components/TrainingFlowModal";
import { useAuthStore } from "../contexts/useAuthStore";
import {
  useTrainingStore,
  TrainingRecord,
  TrainingAssignment,
} from "../contexts/useTrainingStore";
import api from "../services/apiClient";

interface ActivityRecord {
  id: string;
  course_id?: string;
  course_title: string;
  content_type: string;
  content_url?: string | null;
  content_url_en?: string | null;
  content_url_es?: string | null;
  content_url_ne?: string | null;
  duration_minutes?: number | null;
  pass_percentage?: number | null;
  status?: string | null;
  progress_percentage: number | null;
  deadline: string | null;
  started_date: string | null;
  completed_date: string | null;
  quiz_score: number | null;
  approval_status: string | null;
  supervisor_signature_date: string | null;
  quiz_questions?: any;
}

interface UserActivityResponse {
  activity: ActivityRecord[];
}

const DEFAULT_TRAINING_DURATION_MINUTES = 30;
const DEFAULT_TRAINING_PASS_PERCENTAGE = 80;

const mapContentType = (
  type?: string | null
): TrainingAssignment["contentType"] => {
  const normalized = (type || "").trim().toLowerCase();
  switch (normalized) {
    case "video":
      return "video";
    case "pdf":
      return "pdf";
    case "powerpoint":
    case "ppt":
      return "powerpoint";
    default:
      console.warn(`Unknown content type: ${type}, defaulting to video`);
      return "video";
  }
};

// Fallback quiz generator if no quiz exists in database
const generateDefaultQuiz = (title: string) => {
  const safeTitle = title || "this training";
  return [
    {
      question: `What is the primary goal of ${safeTitle}?`,
      answers: [
        `Understand the requirements of ${safeTitle}`,
        "Memorize every policy verbatim",
        "Skip all safety steps",
        "Only complete the quiz portion",
      ],
      correctAnswerIndex: 0,
    },
    {
      question: `Which action best demonstrates completion of ${safeTitle}?`,
      answers: [
        "Apply the guidance in daily work",
        "Share credentials with teammates",
        "Ignore the course instructions",
        "Delay reviewing the material",
      ],
      correctAnswerIndex: 0,
    },
    {
      question: "When should you ask for supervisor support?",
      answers: [
        "Whenever a procedure is unclear",
        "Only after an incident happens",
        "Never, rely on memory",
        "Only during annual reviews",
      ],
      correctAnswerIndex: 0,
    },
  ];
};

const convertActivityToTrainingAssignment = (
  record: ActivityRecord
): TrainingAssignment => {
  const nowIso = new Date().toISOString();
  const defaultDueDate = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  // Debug logging
  console.log("Converting activity record:", {
    record,
    content_type: record.content_type,
    content_url: record.content_url,
    quiz_questions: record.quiz_questions,
    mapped_type: mapContentType(record.content_type)
  });

  // Use quiz questions from database if available, otherwise use default
  let quizQuestions = generateDefaultQuiz(record.course_title);
  if (record.quiz_questions) {
    try {
      // quiz_questions is already parsed as an object (JSONB from postgres)
      const parsedQuestions = Array.isArray(record.quiz_questions) 
        ? record.quiz_questions 
        : JSON.parse(record.quiz_questions);
      if (Array.isArray(parsedQuestions) && parsedQuestions.length > 0) {
        quizQuestions = parsedQuestions;
      }
    } catch (error) {
      console.error("Error parsing quiz questions:", error);
    }
  }

  return {
    id: record.id,
    courseId: record.course_id ?? record.id,
    title: record.course_title,
    contentType: mapContentType(record.content_type),
    contentUrl: record.content_url ?? null,
    contentUrlEn: record.content_url_en ?? null,
    contentUrlEs: record.content_url_es ?? null,
    contentUrlNe: record.content_url_ne ?? null,
    durationMinutes:
      record.duration_minutes ?? DEFAULT_TRAINING_DURATION_MINUTES,
    passPercentage:
      record.pass_percentage ?? DEFAULT_TRAINING_PASS_PERCENTAGE,
    assignedDate: record.started_date ?? nowIso,
    dueDate: record.deadline ?? defaultDueDate,
    quiz: quizQuestions,
  };
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userId = user?.id;
  const [selectedApproval, setSelectedApproval] =
    useState<TrainingRecord | null>(null);
  const [isApprovalModalOpen, setApprovalModalOpen] = useState(false);
  const [activeTraining, setActiveTraining] =
    useState<TrainingAssignment | null>(null);

  // Fetch pending approvals for admins
  const { data: pendingApprovals = [] } = useQuery({
    queryKey: ['pendingApprovals'],
    queryFn: async () => {
      const response = await api.get('/training-records/pending-approvals');
      return response.data;
    },
    enabled: user?.appRole === 'global_admin' || user?.appRole === 'admin',
    staleTime: 30 * 1000 // 30 seconds
  });

  const {
    data: userAssignments,
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
  } = useQuery<UserActivityResponse>({
    queryKey: ["dashboardAssignments", userId],
    queryFn: async ({ queryKey }) => {
      const [, requestedUserId] = queryKey;
      if (!requestedUserId) {
        throw new Error("Missing user identifier");
      }
      const response = await api.get(`/users/${requestedUserId}/activity`);
      return response.data;
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000,
  });

  const normalizeStatus = (status?: string | null) =>
    status?.trim().toLowerCase() ?? "";

  const pendingAssignments = useMemo(
    () =>
      (userAssignments?.activity ?? []).filter(
        (record) => normalizeStatus(record.status) !== "completed"
      ),
    [userAssignments]
  );

  const formatStatusLabel = (status?: string | null) => {
    if (!status) {
      return t("unknownStatus") || "Unknown";
    }
    return status
      .trim()
      .split("_")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  };

  const cards = [
    {
      title: t("totalUsers"),
      value: "1",
      change: "+5% " + t("thisMonth"),
      accent:
        "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200",
      icon: UsersIcon,
    },
    {
      title: t("activeCourses"),
      value: "0",
      change: "2 " + t("newCourses"),
      accent:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200",
      icon: BookOpenIcon,
    },
    {
      title: t("activeEnrollments"),
      value: "0",
      change: "85% " + t("engagement"),
      accent:
        "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200",
      icon: AcademicCapIcon,
    },
    {
      title: t("completionRate"),
      value: "0%",
      change: t("aboveTarget"),
      accent:
        "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200",
      icon: ChartBarIcon,
    },
    {
      title: t("pendingApprovals"),
      value: "0",
      accent:
        "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-200",
      icon: ClockIcon,
    },
  ];

  const handleOpenApproval = (record: TrainingRecord) => {
    setSelectedApproval(record);
    setApprovalModalOpen(true);
  };

  const handleApproveRecord = async (signature: string) => {
    if (!selectedApproval) return;

    try {
      await api.patch(`/training-records/${selectedApproval.id}/approve`, {
        supervisorSignature: signature
      });

      // Refresh approvals list
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      
      alert('Training approved successfully!');
    } catch (error: any) {
      console.error('Error approving training:', error);
      alert(`Error approving training: ${error.response?.data?.message || error.message}`);
    }

    setSelectedApproval(null);
    setApprovalModalOpen(false);
  };

  const handleDenyRecord = async (reason: string) => {
    if (!selectedApproval) return;

    try {
      await api.patch(`/training-records/${selectedApproval.id}/deny`, {
        reason
      });

      // Refresh approvals list and dashboard assignments
      queryClient.invalidateQueries({ queryKey: ['pendingApprovals'] });
      queryClient.invalidateQueries({ queryKey: ["dashboardAssignments", userId] });
      
      alert('Training denied. The employee will need to retake the training.');
    } catch (error: any) {
      console.error('Error denying training:', error);
      alert(`Error denying training: ${error.response?.data?.message || error.message}`);
    }

    setSelectedApproval(null);
    setApprovalModalOpen(false);
  };

  const handleStartTraining = (record: ActivityRecord) => {
    const training = convertActivityToTrainingAssignment(record);
    setActiveTraining(training);
  };

  const handleTrainingModalClose = () => {
    setActiveTraining(null);
  };

  const handleTrainingComplete = async (result: {
    quizScore: number;
    signature: string;
  }) => {
    if (!activeTraining) return;
    
    try {
      // Persist training completion to database
      await api.post('/training-records', {
        courseId: activeTraining.courseId,
        enrollmentId: activeTraining.id,
        quizScore: result.quizScore,
        passPercentage: activeTraining.passPercentage,
        employeeSignature: result.signature,
        durationMinutes: activeTraining.durationMinutes
      });

      console.info("Training completed and saved", {
        trainingId: activeTraining.id,
        quizScore: result.quizScore,
      });

      // Refresh the assignments list
      queryClient.invalidateQueries({ queryKey: ["dashboardAssignments", userId] });
      
      alert('Training completed successfully! Your submission is pending approval.');
    } catch (error: any) {
      console.error("Error saving training completion:", error);
      alert(`Error saving training completion: ${error.response?.data?.message || error.message}`);
    }
    
    setActiveTraining(null);
  };

  const quickActions = [
    {
      name: t("manageCourses"),
      desc: t("createEditCourses"),
      icon: BookOpenIcon,
      href: "/app/courses",
    },
    {
      name: t("manageUsers"),
      desc: t("manageUserAccounts"),
      icon: UserGroupIcon,
      href: "/app/users",
    },
    {
      name: t("viewMatrix"),
      desc: t("viewCompletionRecords"),
      icon: AcademicCapIcon,
      href: "/app/matrix",
    },
    {
      name: t("viewReports"),
      desc: t("trainingAnalytics"),
      icon: ChartBarIcon,
      href: "/app/reports",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t("dashboardWelcome", { name: user?.fullName || "Team Member" })}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {user?.locationCode} - Complete-Pet LMS ·{" "}
            {t("systemAdministratorDashboard")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {card.title}
              </p>
              <card.icon className={`h-5 w-5 ${card.accent.split(" ")[1]}`} />
            </div>
            <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
              {card.value}
            </p>
            {card.change && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {card.change}
              </p>
            )}
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("pendingTrainings") || "Pending Trainings"}
              </h2>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {isAssignmentsLoading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                {t("loading") || "Loading..."}
              </div>
            ) : isAssignmentsError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {t("unableToLoadTrainings") ||
                  "Unable to load trainings right now."}
              </div>
            ) : pendingAssignments.length === 0 ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">
                {t("allTrainingsCurrent") || "All trainings are up to date."}
              </div>
            ) : (
              pendingAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {assignment.course_title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {assignment.deadline
                        ? `${t("due") || "Due"} ${new Date(
                            assignment.deadline
                          ).toLocaleDateString()}`
                        : t("noDeadline") || "No deadline"}
                      {" · "}
                      {(assignment.content_type || "—").toUpperCase()}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 text-xs sm:items-end">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {formatStatusLabel(assignment.status)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-300">
                        {Math.round(assignment.progress_percentage ?? 0)}%{" "}
                        {t("complete") || "complete"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleStartTraining(assignment)}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-200"
                    >
                      {t("startTraining") || "Start Training"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("pendingApprovals") || "Approvals pending"}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("pendingApprovalsSubtitle") ||
                  "Review completed trainings awaiting supervisor sign-off."}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
                {t("noApprovalsPending") || "No Approvals Pending ✅"}
              </div>
            ) : (
              pendingApprovals.map((record: any) => (
                <div
                  key={record.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {record.course_title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {record.employee_name} ·{" "}
                      {new Date(record.completion_date).toLocaleString()} ·{" "}
                      {record.quiz_score}%
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenApproval({
                      id: record.id,
                      courseTitle: record.course_title,
                      employeeName: record.employee_name,
                      employeeId: record.employee_id,
                      completionDate: record.completion_date,
                      quizScore: record.quiz_score,
                      passPercentage: record.pass_percentage,
                      employeeSignature: record.employee_signature_data,
                      durationMinutes: record.duration_minutes
                    } as TrainingRecord)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
                  >
                    {t("reviewAndApprove") || "Review & approve"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <section className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("quickActions")}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  to={action.href}
                  className="flex items-start gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary dark:hover:bg-slate-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {action.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {action.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Pending Actions */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("pendingActions")}
            </h2>
            <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/10">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                {t("allUpToDate")}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
                {t("noPendingActions")}
              </p>
            </div>
          </section>

          {/* System Status */}
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("systemStatus")}
            </h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("security")}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
                  {t("active")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("compliance")}
                </span>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  0%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t("lastBackup")}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  2 {t("hoursAgo")}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <SupervisorApprovalModal
        open={isApprovalModalOpen}
        record={selectedApproval}
        onClose={() => {
          setApprovalModalOpen(false);
          setSelectedApproval(null);
        }}
        onApprove={handleApproveRecord}
        onDeny={handleDenyRecord}
      />
      <TrainingFlowModal
        open={Boolean(activeTraining)}
        training={activeTraining}
        onClose={handleTrainingModalClose}
        onComplete={handleTrainingComplete}
      />
    </div>
  );
}
