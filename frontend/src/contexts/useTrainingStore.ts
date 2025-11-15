import { create } from "zustand";

type ContentType = "video" | "pdf" | "powerpoint";

export interface TrainingQuizQuestion {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
}

export interface TrainingAssignment {
  id: string;
  courseId: string;
  title: string;
  contentType: ContentType;
  durationMinutes: number;
  passPercentage: number;
  assignedDate: string;
  dueDate: string;
  quiz: TrainingQuizQuestion[];
}

export interface TrainingRecord {
  id: string;
  assignmentId: string;
  courseId: string;
  courseTitle: string;
  completionDate: string;
  quizScore: number;
  passPercentage: number;
  employeeId: string;
  employeeName: string;
  employeeSignature: string;
  supervisorName?: string;
  supervisorSignature?: string;
  supervisorSignatureDate?: string;
  status: "pending_approval" | "approved";
  contentType: ContentType;
  durationMinutes: number;
}

interface TrainingStoreState {
  pendingTrainings: TrainingAssignment[];
  approvalsQueue: TrainingRecord[];
  completedTrainings: TrainingRecord[];
  completeTraining: (
    assignmentId: string,
    record: Omit<TrainingRecord, "id" | "status">
  ) => void;
  approveTraining: (
    recordId: string,
    supervisor: { name: string; signature: string }
  ) => void;
}

const defaultAssignments: TrainingAssignment[] = [
  {
    id: "training-1",
    courseId: "SOP-101",
    title: "SOP-101 Animal Handling",
    contentType: "video",
    durationMinutes: 35,
    passPercentage: 80,
    assignedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    quiz: [
      {
        question: "What is the first step before handling any animal?",
        answers: [
          "Inspect equipment",
          "Review SOP",
          "Call supervisor",
          "Sanitize workspace",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "Minimum pass percentage for this course?",
        answers: ["50%", "60%", "70%", "80%"],
        correctAnswerIndex: 3,
      },
      {
        question: "Which PPE item is mandatory?",
        answers: ["Gloves", "Safety glasses", "Lab coat", "All of the above"],
        correctAnswerIndex: 3,
      },
    ],
  },
  {
    id: "training-2",
    courseId: "SOP-102",
    title: "SOP-102 Safety Orientation",
    contentType: "pdf",
    durationMinutes: 20,
    passPercentage: 80,
    assignedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    quiz: [
      {
        question: "Who do you contact in case of emergency?",
        answers: ["HR", "Operations", "Safety lead", "IT"],
        correctAnswerIndex: 2,
      },
      {
        question: "Where is the evacuation map located?",
        answers: ["Break room", "Intranet", "Reception", "All exits"],
        correctAnswerIndex: 3,
      },
      {
        question: "How often are safety drills executed?",
        answers: ["Monthly", "Quarterly", "Yearly", "Never"],
        correctAnswerIndex: 1,
      },
    ],
  },
];

function generateId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const useTrainingStore = create<TrainingStoreState>((set) => ({
  pendingTrainings: defaultAssignments,
  approvalsQueue: [],
  completedTrainings: [],
  completeTraining: (assignmentId, record) =>
    set((state) => {
      const assignment = state.pendingTrainings.find(
        (item) => item.id === assignmentId
      );
      if (!assignment) {
        return state;
      }

      const newRecord: TrainingRecord = {
        ...record,
        id: generateId("record"),
        status: "pending_approval",
      };

      return {
        pendingTrainings: state.pendingTrainings.filter(
          (item) => item.id !== assignmentId
        ),
        approvalsQueue: [...state.approvalsQueue, newRecord],
        completedTrainings: state.completedTrainings,
      };
    }),
  approveTraining: (recordId, supervisor) =>
    set((state) => {
      const record = state.approvalsQueue.find((item) => item.id === recordId);
      if (!record) {
        return state;
      }

      const approvedRecord: TrainingRecord = {
        ...record,
        status: "approved",
        supervisorName: supervisor.name,
        supervisorSignature: supervisor.signature,
        supervisorSignatureDate: new Date().toISOString(),
      };

      return {
        pendingTrainings: state.pendingTrainings,
        approvalsQueue: state.approvalsQueue.filter(
          (item) => item.id !== recordId
        ),
        completedTrainings: [...state.completedTrainings, approvedRecord],
      };
    }),
}));
