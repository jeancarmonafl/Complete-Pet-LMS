import { ArrowUpTrayIcon, EllipsisVerticalIcon, PlusIcon, TrashIcon, PencilIcon, PowerIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Modal } from '../../components/Modal';
import { StatsCard } from '../../components/StatsCard';
import api from '../../services/apiClient';

interface QuizQuestion {
  question: string;
  answers: string[];
  correctAnswerIndex: number;
}

interface CourseForm {
  title: string;
  description?: string;
  contentType: string;
  durationMinutes?: number;
  passPercentage: number;
  contentFile?: FileList;
  isMandatory: boolean;
  isPublished: boolean;
  // Assignment Rules
  departmentScope: 'all' | 'specific';
  selectedDepartments: string[];
  positionScope: 'all' | 'specific';
  selectedPositions: string[];
  exceptionPositions: string[];
  // Quiz
  questions: QuizQuestion[];
  isActive?: boolean;
}

const createEmptyQuiz = (): QuizQuestion[] =>
  Array.from({ length: 4 }, () => ({
    question: '',
    answers: ['', '', '', ''],
    correctAnswerIndex: 0
  }));

const parseQuestionsPayload = (payload: unknown): QuizQuestion[] => {
  let normalized = payload;

  if (typeof normalized === 'string') {
    try {
      normalized = JSON.parse(normalized);
    } catch {
      return createEmptyQuiz();
    }
  }

  if (!Array.isArray(normalized)) {
    return createEmptyQuiz();
  }

  const parsed = (normalized as any[]).map((item) => {
    const answersSource = Array.isArray(item?.answers) ? item.answers : [];
    const answers = [0, 1, 2, 3].map((index) =>
      typeof answersSource[index] === 'string' ? answersSource[index] : ''
    );
    const rawIndex = typeof item?.correctAnswerIndex === 'number' ? item.correctAnswerIndex : 0;
    const sanitizedIndex = rawIndex >= 0 && rawIndex < answers.length ? rawIndex : 0;

    return {
      question: typeof item?.question === 'string' ? item.question : '',
      answers,
      correctAnswerIndex: sanitizedIndex
    };
  });

  return parsed.length > 0 ? parsed : createEmptyQuiz();
};

export default function CourseManagementPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deletingCourse, setDeletingCourse] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string>('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'rules' | 'quiz'>('details');
  const [fileName, setFileName] = useState<string>('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  const { register, handleSubmit, reset, watch, setValue } = useForm<CourseForm>({
    defaultValues: {
      contentType: 'video',
      passPercentage: 80,
      isMandatory: false,
      isPublished: false,
      departmentScope: 'all',
      selectedDepartments: [],
      positionScope: 'all',
      selectedPositions: [],
      exceptionPositions: [],
      questions: createEmptyQuiz()
    }
  });

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const response = await api.get('/courses');
      return response.data;
    }
  });

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await api.post('/courses', courseData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      reset();
      setCreateOpen(false);
      setActiveTab('details');
      setFileName('');
      alert('Course created successfully!');
    },
    onError: (error: any) => {
      alert(`Error creating course: ${error.response?.data?.message || error.message}`);
    }
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/courses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      reset();
      setEditOpen(false);
      setEditingCourse(null);
      setActiveTab('details');
      setFileName('');
      alert('Course updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error updating course: ${error.response?.data?.message || error.message}`);
    }
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const response = await api.delete(`/courses/${courseId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setDeleteOpen(false);
      setDeletingCourse(null);
      setDeleteConfirmId('');
      alert('Course deleted successfully!');
    },
    onError: (error: any) => {
      alert(`Error deleting course: ${error.response?.data?.message || error.message}`);
    }
  });

  const toggleCourseStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await api.patch(`/courses/${id}/status`, { isActive });
      return response.data;
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['courses'] });
      const previousCourses = queryClient.getQueryData<any[]>(['courses']);

      queryClient.setQueryData(['courses'], (old: any[] = []) =>
        old.map((course) =>
          course.id === variables.id ? { ...course, is_active: variables.isActive } : course
        )
      );

      return { previousCourses };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousCourses) {
        queryClient.setQueryData(['courses'], context.previousCourses);
      }
      alert(`Error updating course status: ${error.response?.data?.message || error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setOpenDropdownId(null);
    }
  });

  const stats = [
    { title: t('totalCourses'), value: String(courses.length), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200' },
    { title: t('published'), value: String(courses.filter((c: any) => c.is_published).length), accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200' },
    { title: t('totalEnrollments'), value: '0', accent: 'bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200' },
    { title: t('completionRate'), value: '0%', accent: 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-200' }
  ];

  const departments = [
    { id: 'operations', name: t('operations') },
    { id: 'maintenance', name: t('maintenance') },
    { id: 'quality', name: t('quality') },
    { id: 'administration', name: t('adminDepartment') }
  ];

  const positions = [
    { id: 'technician', name: 'Technician' },
    { id: 'operator', name: 'Operator' },
    { id: 'supervisor', name: 'Supervisor' },
    { id: 'manager', name: 'Manager' }
  ];

  const handleCreate = (data: CourseForm) => {
    createCourseMutation.mutate({
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      durationMinutes: data.durationMinutes,
      passPercentage: data.passPercentage,
      isMandatory: data.isMandatory,
      isPublished: data.isPublished,
      departmentScope: data.departmentScope,
      selectedDepartments: data.selectedDepartments,
      positionScope: data.positionScope,
      selectedPositions: data.selectedPositions,
      exceptionPositions: data.exceptionPositions,
      questions: data.questions
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdownId(null);
        }
      });
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleEdit = (course: any) => {
    const parsedQuestions = parseQuestionsPayload(course.questions);

    reset({
      title: course.title || '',
      description: course.description || '',
      contentType: course.content_type || 'video',
      durationMinutes: course.duration_minutes ?? 0,
      passPercentage: course.pass_percentage ?? 80,
      isMandatory: course.is_mandatory ?? false,
      isPublished: course.is_published ?? false,
      departmentScope: course.assigned_departments?.length ? 'specific' : 'all',
      selectedDepartments: course.assigned_departments || [],
      positionScope: course.assigned_positions?.length ? 'specific' : 'all',
      selectedPositions: course.assigned_positions || [],
      exceptionPositions: course.exception_positions || [],
      questions: parsedQuestions,
      isActive: course.is_active ?? true
    });

    setEditingCourse(course);
    setActiveTab('details');
    setFileName('');
    setOpenDropdownId(null);
    setEditOpen(true);
  };

  const handleDeleteClick = (course: any) => {
    setDeletingCourse(course);
    setDeleteConfirmId('');
    setOpenDropdownId(null);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingCourse) return;
    
    const trimmedId = deleteConfirmId.trim();
    const shortId = deletingCourse.id.substring(0, 8);

    if (trimmedId !== deletingCourse.id && trimmedId !== shortId) {
      alert(`Course ID does not match. Please type ${shortId} or the full ID to confirm.`);
      return;
    }

    deleteCourseMutation.mutate(deletingCourse.id);
  };

  const handleToggleCourseStatus = (course: any) => {
    toggleCourseStatusMutation.mutate({
      id: course.id,
      isActive: !course.is_active
    });
  };

  const handleUpdate = (data: CourseForm) => {
    if (!editingCourse) return;
    
    updateCourseMutation.mutate({
      id: editingCourse.id,
      data: {
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        durationMinutes: data.durationMinutes,
        passPercentage: data.passPercentage,
        isMandatory: data.isMandatory,
        isPublished: data.isPublished,
        departmentScope: data.departmentScope,
        selectedDepartments: data.selectedDepartments,
        positionScope: data.positionScope,
        selectedPositions: data.selectedPositions,
        exceptionPositions: data.exceptionPositions,
        questions: data.questions
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort courses
  const sortedCourses = [...courses].sort((a: any, b: any) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const questions = watch('questions') || createEmptyQuiz();

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t('courseManagementTitle')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">{t('courseManagementSubtitle')}</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
        >
          <PlusIcon className="h-5 w-5" />
          {t('createCourse')}
        </button>
      </header>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{t('courseLibrary')}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">{t('coursesScoped')}</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            {courses.length} {t('coursesFound')}
          </span>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th 
                  onClick={() => handleSort('course_number')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Course # {sortField === 'course_number' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('title')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Course Title {sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('description')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {t('description')} {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  onClick={() => handleSort('duration_minutes')}
                  className="cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {t('duration')} (min) {sortField === 'duration_minutes' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('departments')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('positions')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Loading courses...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t('uploadContentPublish')}
                  </td>
                </tr>
              ) : (
                sortedCourses.map((course: any, index: number) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {course.title}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {course.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {course.duration_minutes || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {course.assigned_departments?.join(', ') || 'All'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {course.assigned_positions?.join(', ') || 'All'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          course.is_active
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-200'
                        }`}
                      >
                        {course.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative" ref={(el) => (dropdownRefs.current[course.id] = el)}>
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === course.id ? null : course.id)}
                          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        {openDropdownId === course.id && (
                          <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                            <div className="py-1">
                              <button
                                onClick={() => handleEdit(course)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                <PencilIcon className="h-4 w-4" />
                                {t('update') || 'Update'}
                              </button>
                              <button
                                onClick={() => handleToggleCourseStatus(course)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                              >
                                <PowerIcon className={`h-4 w-4 ${course.is_active ? 'text-red-500' : 'text-emerald-500'}`} />
                                {course.is_active ? (t('deactivate') || 'Deactivate') : (t('reactivate') || 'Reactivate')}
                              </button>
                              <button
                                onClick={() => handleDeleteClick(course)}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                              >
                                <TrashIcon className="h-4 w-4" />
                                {t('delete') || 'Delete'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={isCreateOpen}
        onClose={() => {
          setCreateOpen(false);
          setActiveTab('details');
          setFileName('');
        }}
        title={t('createNewCourse')}
        description={t('fillDetailsToCreate')}
      >
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('courseDetails')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rules'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('assignmentRules')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'quiz'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('courseQuiz')}
            </button>
          </nav>
        </div>

        <form className="space-y-6 pt-6" onSubmit={handleSubmit(handleCreate)}>
          {/* Course Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('courseTitle')} *
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  {...register('title', { required: true })}
                  placeholder="e.g., SOP-101: Animal Handling"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('description')}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  {...register('description')}
                  placeholder="Describe the course objectives and requirements..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('contentType')} *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    {...register('contentType')}
                  >
                    <option value="video">{t('video')}</option>
                    <option value="pdf">{t('pdf')}</option>
                    <option value="powerpoint">{t('powerpoint')}</option>
                    <option value="scorm">{t('scorm')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('durationMinutes')}
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('passPercentage')} *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  {...register('passPercentage', { valueAsNumber: true })}
                  placeholder="80"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('courseContentFile')} *
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    {t('chooseFile')}
                    <input
                      type="file"
                      className="hidden"
                      {...register('contentFile')}
                      onChange={handleFileChange}
                      accept=".pdf,.mp4,.ppt,.pptx,.zip"
                    />
                  </label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {fileName || t('noFileChosen')}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <input
                  type="checkbox"
                  id="mandatory"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  {...register('isMandatory')}
                />
                <div>
                  <label htmlFor="mandatory" className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('mandatory')}
                  </label>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {t('mandatoryDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  {...register('isPublished')}
                />
                <label htmlFor="published" className="text-sm font-medium text-slate-900 dark:text-white">
                  {t('publish')}
                </label>
              </div>
            </div>
          )}

          {/* Assignment Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('selectDepartments')}</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t('selectDepartmentsDesc')}</p>
                
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="all"
                      {...register('departmentScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('allDepartments')}</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="specific"
                      {...register('departmentScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('specificDepartments')}</span>
                  </label>
                </div>

                {watch('departmentScope') === 'specific' && (
                  <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    {departments.map((dept) => (
                      <label key={dept.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          value={dept.id}
                          {...register('selectedDepartments')}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-900 dark:text-white">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('selectJobPositions')}</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t('selectJobPositionsDesc')}</p>
                
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="all"
                      {...register('positionScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('allPositions')}</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="specific"
                      {...register('positionScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('specificPositions')}</span>
                  </label>
                </div>

                {watch('positionScope') === 'specific' && (
                  <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    {positions.map((pos) => (
                      <label key={pos.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          value={pos.id}
                          {...register('selectedPositions')}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-900 dark:text-white">{pos.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('assignmentExceptions') || 'Exceptions'}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {t('assignmentExceptionsDesc') || 'Select who is exempted from taking this training.'}
                </p>
                <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  {positions.map((pos) => (
                    <label key={pos.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        value={pos.id}
                        {...register('exceptionPositions')}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-900 dark:text-white">{pos.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
                <p className="font-semibold">{t('quizSettings')}</p>
                <p className="mt-1">{t('questionsCount')}</p>
              </div>

              {questions.map((_, qIndex) => (
                <div key={qIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white">
                    {t('questionText', { number: qIndex + 1 })}
                  </label>
                  <input
                    className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    {...register(`questions.${qIndex}.question` as const)}
                    placeholder={`Enter question ${qIndex + 1}...`}
                  />

                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((aIndex) => (
                      <div key={aIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`questions.${qIndex}.correctAnswerIndex`}
                          value={aIndex}
                          onChange={() => setValue(`questions.${qIndex}.correctAnswerIndex`, aIndex)}
                          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          title={t('markAsCorrect')}
                        />
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          {...register(`questions.${qIndex}.answers.${aIndex}` as const)}
                          placeholder={`${t('answerOption', { number: aIndex + 1 })}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setCreateOpen(false);
                setActiveTab('details');
                setFileName('');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {t('saveCourse')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Course Modal - Reuses same form as Create */}
      <Modal
        open={isEditOpen}
        onClose={() => {
          setEditOpen(false);
          setEditingCourse(null);
          setActiveTab('details');
          setFileName('');
          reset();
        }}
        title={t('editCourse') || 'Edit Course'}
        description={t('updateCourseDetails') || 'Update course details and settings'}
      >
        {/* Tabs */}
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('courseDetails')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'rules'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('assignmentRules')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quiz')}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeTab === 'quiz'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('courseQuiz')}
            </button>
          </nav>
        </div>

        <form className="space-y-6 pt-6" onSubmit={handleSubmit(handleUpdate)}>
          {/* Course Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('courseTitle')} *
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  {...register('title', { required: true })}
                  placeholder="e.g., SOP-101: Animal Handling"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('description')}
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  {...register('description')}
                  placeholder="Describe the course objectives and requirements..."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('contentType')} *
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    {...register('contentType')}
                  >
                    <option value="video">{t('video')}</option>
                    <option value="pdf">{t('pdf')}</option>
                    <option value="powerpoint">{t('powerpoint')}</option>
                    <option value="scorm">{t('scorm')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t('durationMinutes')}
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    {...register('durationMinutes', { valueAsNumber: true })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('passPercentage')} *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  {...register('passPercentage', { valueAsNumber: true })}
                  placeholder="80"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t('courseContentFile')}
                </label>
                <div className="flex items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <ArrowUpTrayIcon className="h-5 w-5" />
                    {t('chooseFile')}
                    <input
                      type="file"
                      className="hidden"
                      {...register('contentFile')}
                      onChange={handleFileChange}
                      accept=".pdf,.mp4,.ppt,.pptx,.zip"
                    />
                  </label>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {fileName || t('noFileChosen') || 'No file chosen (optional)'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <input
                  type="checkbox"
                  id="edit-mandatory"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  {...register('isMandatory')}
                />
                <div>
                  <label htmlFor="edit-mandatory" className="text-sm font-semibold text-slate-900 dark:text-white">
                    {t('mandatory')}
                  </label>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    {t('mandatoryDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="edit-published"
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  {...register('isPublished')}
                />
                <label htmlFor="edit-published" className="text-sm font-medium text-slate-900 dark:text-white">
                  {t('publish')}
                </label>
              </div>
            </div>
          )}

          {/* Assignment Rules Tab */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('selectDepartments')}</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t('selectDepartmentsDesc')}</p>
                
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="all"
                      {...register('departmentScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('allDepartments')}</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="specific"
                      {...register('departmentScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('specificDepartments')}</span>
                  </label>
                </div>

                {watch('departmentScope') === 'specific' && (
                  <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    {departments.map((dept) => (
                      <label key={dept.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          value={dept.id}
                          {...register('selectedDepartments')}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-900 dark:text-white">{dept.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('selectJobPositions')}</h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t('selectJobPositionsDesc')}</p>
                
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="all"
                      {...register('positionScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('allPositions')}</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      value="specific"
                      {...register('positionScope')}
                      className="h-4 w-4 border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-900 dark:text-white">{t('specificPositions')}</span>
                  </label>
                </div>

                {watch('positionScope') === 'specific' && (
                  <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                    {positions.map((pos) => (
                      <label key={pos.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          value={pos.id}
                          {...register('selectedPositions')}
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-900 dark:text-white">{pos.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t('assignmentExceptions') || 'Exceptions'}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {t('assignmentExceptionsDesc') || 'Select who is exempted from taking this training.'}
                </p>
                <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  {positions.map((pos) => (
                    <label key={pos.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        value={pos.id}
                        {...register('exceptionPositions')}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-slate-900 dark:text-white">{pos.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200">
                <p className="font-semibold">{t('quizSettings')}</p>
                <p className="mt-1">{t('questionsCount')}</p>
              </div>

              {questions.map((_, qIndex) => (
                <div key={qIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <label className="mb-3 block text-sm font-semibold text-slate-900 dark:text-white">
                    {t('questionText', { number: qIndex + 1 })}
                  </label>
                  <input
                    className="mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    {...register(`questions.${qIndex}.question` as const)}
                    placeholder={`Enter question ${qIndex + 1}...`}
                  />

                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((aIndex) => (
                      <div key={aIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`questions.${qIndex}.correctAnswerIndex`}
                          value={aIndex}
                          onChange={() => setValue(`questions.${qIndex}.correctAnswerIndex`, aIndex)}
                          className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          title={t('markAsCorrect')}
                        />
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                          {...register(`questions.${qIndex}.answers.${aIndex}` as const)}
                          placeholder={`${t('answerOption', { number: aIndex + 1 })}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setEditOpen(false);
                setEditingCourse(null);
                setActiveTab('details');
                setFileName('');
                reset();
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              {t('updateCourse') || 'Update Course'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingCourse(null);
          setDeleteConfirmId('');
        }}
        title={t('deleteCourse') || 'Delete Course'}
        description={t('confirmDeleteCourse') || 'This action cannot be undone. Please type the course ID to confirm.'}
      >
        <div className="space-y-4">
          {deletingCourse && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
              <p className="text-sm font-semibold text-red-700 dark:text-red-200">
                {t('courseToDelete') || 'Course to delete:'}
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {deletingCourse.title} ({deletingCourse.id.substring(0, 8)})
              </p>
            </div>
          )}
          
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('typeCourseId') || 'Type the course ID (or first 8 characters) to confirm:'}
            </label>
            <input
              type="text"
              value={deleteConfirmId}
              onChange={(e) => setDeleteConfirmId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              placeholder={deletingCourse ? deletingCourse.id.substring(0, 8) : 'Course ID'}
            />
            {deletingCourse && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Hint: {deletingCourse.id} ({deletingCourse.id.substring(0, 8)})
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setDeletingCourse(null);
                setDeleteConfirmId('');
              }}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteCourseMutation.isPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              {deleteCourseMutation.isPending ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
