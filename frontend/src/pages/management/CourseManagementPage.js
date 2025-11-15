import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowUpTrayIcon, EllipsisVerticalIcon, PlusIcon, TrashIcon, PencilIcon, PowerIcon } from '@heroicons/react/24/outline';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/Modal';
import { StatsCard } from '../../components/StatsCard';
import api from '../../services/apiClient';
export default function CourseManagementPage() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [isEditOpen, setEditOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [deletingCourse, setDeletingCourse] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [activeTab, setActiveTab] = useState('details');
    const [fileName, setFileName] = useState('');
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const dropdownRefs = useRef({});
    const { register, handleSubmit, reset, watch, setValue } = useForm({
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
            questions: [
                { question: '', answers: ['', '', '', ''], correctAnswerIndex: 0 },
                { question: '', answers: ['', '', '', ''], correctAnswerIndex: 0 },
                { question: '', answers: ['', '', '', ''], correctAnswerIndex: 0 },
                { question: '', answers: ['', '', '', ''], correctAnswerIndex: 0 }
            ]
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
        mutationFn: async (courseData) => {
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
        onError: (error) => {
            alert(`Error creating course: ${error.response?.data?.message || error.message}`);
        }
    });
    // Update course mutation
    const updateCourseMutation = useMutation({
        mutationFn: async ({ id, data }) => {
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
        onError: (error) => {
            alert(`Error updating course: ${error.response?.data?.message || error.message}`);
        }
    });
    // Delete course mutation
    const deleteCourseMutation = useMutation({
        mutationFn: async (courseId) => {
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
        onError: (error) => {
            alert(`Error deleting course: ${error.response?.data?.message || error.message}`);
        }
    });
    const toggleCourseStatusMutation = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const response = await api.patch(`/courses/${id}/status`, { isActive });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['courses'] });
            setOpenDropdownId(null);
        },
        onError: (error) => {
            alert(`Error updating course status: ${error.response?.data?.message || error.message}`);
        }
    });
    const stats = [
        { title: t('totalCourses'), value: String(courses.length), accent: 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200' },
        { title: t('published'), value: String(courses.filter((c) => c.is_published).length), accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200' },
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
    const handleCreate = (data) => {
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
        const handleClickOutside = (event) => {
            Object.values(dropdownRefs.current).forEach((ref) => {
                if (ref && !ref.contains(event.target)) {
                    setOpenDropdownId(null);
                }
            });
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    const handleEdit = (course) => {
        setEditingCourse(course);
        setActiveTab('details'); // Reset to details tab when opening edit
        setValue('title', course.title);
        setValue('description', course.description || '');
        setValue('contentType', course.content_type);
        setValue('durationMinutes', course.duration_minutes || 0);
        setValue('passPercentage', course.pass_percentage || 80);
        setValue('isMandatory', course.is_mandatory || false);
        setValue('isPublished', course.is_published || false);
        setValue('departmentScope', course.assigned_departments?.length > 0 ? 'specific' : 'all');
        setValue('selectedDepartments', course.assigned_departments || []);
        setValue('positionScope', course.assigned_positions?.length > 0 ? 'specific' : 'all');
        setValue('selectedPositions', course.assigned_positions || []);
        setValue('exceptionPositions', course.exception_positions || []);
        setValue('isActive', course.is_active ?? true);
        // Set quiz questions if available
        if (course.questions && Array.isArray(course.questions)) {
            setValue('questions', course.questions);
        }
        setOpenDropdownId(null);
        setEditOpen(true);
    };
    const handleDeleteClick = (course) => {
        setDeletingCourse(course);
        setDeleteConfirmId('');
        setOpenDropdownId(null);
        setDeleteOpen(true);
    };
    const handleDeleteConfirm = () => {
        if (!deletingCourse)
            return;
        if (deleteConfirmId !== deletingCourse.id) {
            alert('Course ID does not match. Please type the correct course ID.');
            return;
        }
        deleteCourseMutation.mutate(deletingCourse.id);
    };
    const handleToggleCourseStatus = (course) => {
        toggleCourseStatusMutation.mutate({
            id: course.id,
            isActive: !course.is_active
        });
    };
    const handleUpdate = (data) => {
        if (!editingCourse)
            return;
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
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFileName(e.target.files[0].name);
        }
    };
    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }
        else {
            setSortField(field);
            setSortDirection('asc');
        }
    };
    // Sort courses
    const sortedCourses = [...courses].sort((a, b) => {
        const aValue = a[sortField] || '';
        const bValue = b[sortField] || '';
        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        }
        else {
            return aValue < bValue ? 1 : -1;
        }
    });
    const questions = watch('questions') || [];
    return (_jsxs("div", { className: "space-y-10", children: [_jsxs("header", { className: "flex flex-wrap items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-semibold text-slate-900 dark:text-white", children: t('courseManagementTitle') }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: t('courseManagementSubtitle') })] }), _jsxs("button", { onClick: () => setCreateOpen(true), className: "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90", children: [_jsx(PlusIcon, { className: "h-5 w-5" }), t('createCourse')] })] }), _jsx("section", { className: "grid gap-6 sm:grid-cols-2 xl:grid-cols-4", children: stats.map((card) => (_jsx(StatsCard, { ...card }, card.title))) }), _jsxs("section", { className: "rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: t('courseLibrary') }), _jsx("p", { className: "text-sm text-slate-500 dark:text-slate-300", children: t('coursesScoped') })] }), _jsxs("span", { className: "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300", children: [courses.length, " ", t('coursesFound')] })] }), _jsx("div", { className: "mt-6 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800", children: _jsxs("table", { className: "min-w-full divide-y divide-slate-100 dark:divide-slate-800", children: [_jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/60", children: _jsxs("tr", { children: [_jsxs("th", { onClick: () => handleSort('course_number'), className: "cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white", children: ["Course # ", sortField === 'course_number' && (sortDirection === 'asc' ? '↑' : '↓')] }), _jsxs("th", { onClick: () => handleSort('title'), className: "cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white", children: ["Course Title ", sortField === 'title' && (sortDirection === 'asc' ? '↑' : '↓')] }), _jsxs("th", { onClick: () => handleSort('description'), className: "cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white", children: [t('description'), " ", sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')] }), _jsxs("th", { onClick: () => handleSort('duration_minutes'), className: "cursor-pointer px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white", children: [t('duration'), " (min) ", sortField === 'duration_minutes' && (sortDirection === 'asc' ? '↑' : '↓')] }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300", children: t('departments') }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300", children: t('positions') }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300", children: t('status') }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300", children: t('actions') })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900", children: isLoading ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400", children: "Loading courses..." }) })) : courses.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, className: "px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400", children: t('uploadContentPublish') }) })) : (sortedCourses.map((course, index) => (_jsxs("tr", { children: [_jsx("td", { className: "px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white", children: index + 1 }), _jsx("td", { className: "px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white", children: course.title }), _jsx("td", { className: "px-6 py-4", children: _jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: course.description || 'No description' }) }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: course.duration_minutes || '—' }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: course.assigned_departments?.join(', ') || 'All' }), _jsx("td", { className: "px-6 py-4 text-sm text-slate-600 dark:text-slate-300", children: course.assigned_positions?.join(', ') || 'All' }), _jsx("td", { className: "px-6 py-4", children: _jsx("span", { className: `inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${course.is_active
                                                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200'
                                                        : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-200'}`, children: course.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive') }) }), _jsx("td", { className: "px-6 py-4", children: _jsxs("div", { className: "relative", ref: (el) => (dropdownRefs.current[course.id] = el), children: [_jsx("button", { onClick: () => setOpenDropdownId(openDropdownId === course.id ? null : course.id), className: "rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800", children: _jsx(EllipsisVerticalIcon, { className: "h-5 w-5" }) }), openDropdownId === course.id && (_jsx("div", { className: "absolute right-0 z-50 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800", children: _jsxs("div", { className: "py-1", children: [_jsxs("button", { onClick: () => handleEdit(course), className: "flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700", children: [_jsx(PencilIcon, { className: "h-4 w-4" }), t('update') || 'Update'] }), _jsxs("button", { onClick: () => handleToggleCourseStatus(course), className: "flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700", children: [_jsx(PowerIcon, { className: `h-4 w-4 ${course.is_active ? 'text-red-500' : 'text-emerald-500'}` }), course.is_active ? (t('deactivate') || 'Deactivate') : (t('reactivate') || 'Reactivate')] }), _jsxs("button", { onClick: () => handleDeleteClick(course), className: "flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10", children: [_jsx(TrashIcon, { className: "h-4 w-4" }), t('delete') || 'Delete'] })] }) }))] }) })] }, course.id)))) })] }) })] }), _jsxs(Modal, { open: isCreateOpen, onClose: () => {
                    setCreateOpen(false);
                    setActiveTab('details');
                    setFileName('');
                }, title: t('createNewCourse'), description: t('fillDetailsToCreate'), children: [_jsx("div", { className: "border-b border-slate-200 dark:border-slate-700", children: _jsxs("nav", { className: "flex gap-6", children: [_jsx("button", { type: "button", onClick: () => setActiveTab('details'), className: `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'details'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('courseDetails') }), _jsx("button", { type: "button", onClick: () => setActiveTab('rules'), className: `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'rules'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('assignmentRules') }), _jsx("button", { type: "button", onClick: () => setActiveTab('quiz'), className: `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'quiz'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('courseQuiz') })] }) }), _jsxs("form", { className: "space-y-6 pt-6", onSubmit: handleSubmit(handleCreate), children: [activeTab === 'details' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('courseTitle'), " *"] }), _jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('title', { required: true }), placeholder: "e.g., SOP-101: Animal Handling" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: t('description') }), _jsx("textarea", { rows: 3, className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('description'), placeholder: "Describe the course objectives and requirements..." })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('contentType'), " *"] }), _jsxs("select", { className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('contentType'), children: [_jsx("option", { value: "video", children: t('video') }), _jsx("option", { value: "pdf", children: t('pdf') }), _jsx("option", { value: "powerpoint", children: t('powerpoint') }), _jsx("option", { value: "scorm", children: t('scorm') }), _jsx("option", { value: "other", children: t('other') })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: t('durationMinutes') }), _jsx("input", { type: "number", className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('durationMinutes', { valueAsNumber: true }), placeholder: "30" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('passPercentage'), " *"] }), _jsx("input", { type: "number", min: "0", max: "100", className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('passPercentage', { valueAsNumber: true }), placeholder: "80" })] }), _jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('courseContentFile'), " *"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300", children: [_jsx(ArrowUpTrayIcon, { className: "h-5 w-5" }), t('chooseFile'), _jsx("input", { type: "file", className: "hidden", ...register('contentFile'), onChange: handleFileChange, accept: ".pdf,.mp4,.ppt,.pptx,.zip" })] }), _jsx("span", { className: "text-sm text-slate-500 dark:text-slate-400", children: fileName || t('noFileChosen') })] })] }), _jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("input", { type: "checkbox", id: "mandatory", className: "mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary", ...register('isMandatory') }), _jsxs("div", { children: [_jsx("label", { htmlFor: "mandatory", className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('mandatory') }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('mandatoryDesc') })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", id: "published", className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary", ...register('isPublished') }), _jsx("label", { htmlFor: "published", className: "text-sm font-medium text-slate-900 dark:text-white", children: t('publish') })] })] })), activeTab === 'rules' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('selectDepartments') }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('selectDepartmentsDesc') }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "all", ...register('departmentScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('allDepartments') })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "specific", ...register('departmentScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('specificDepartments') })] })] }), watch('departmentScope') === 'specific' && (_jsx("div", { className: "mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: departments.map((dept) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", value: dept.id, ...register('selectedDepartments'), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: dept.name })] }, dept.id))) }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('selectJobPositions') }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('selectJobPositionsDesc') }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "all", ...register('positionScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('allPositions') })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "specific", ...register('positionScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('specificPositions') })] })] }), watch('positionScope') === 'specific' && (_jsx("div", { className: "mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: positions.map((pos) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", value: pos.id, ...register('selectedPositions'), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: pos.name })] }, pos.id))) }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('assignmentExceptions') || 'Exceptions' }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('assignmentExceptionsDesc') || 'Exclude specific positions from this training requirement.' }), _jsx("div", { className: "mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: positions.map((pos) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", value: pos.id, ...register('exceptionPositions'), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: pos.name })] }, pos.id))) })] })] })), activeTab === 'quiz' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200", children: [_jsx("p", { className: "font-semibold", children: t('quizSettings') }), _jsx("p", { className: "mt-1", children: t('questionsCount') })] }), questions.map((_, qIndex) => (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("label", { className: "mb-3 block text-sm font-semibold text-slate-900 dark:text-white", children: t('questionText', { number: qIndex + 1 }) }), _jsx("input", { className: "mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100", ...register(`questions.${qIndex}.question`), placeholder: `Enter question ${qIndex + 1}...` }), _jsx("div", { className: "space-y-2", children: [0, 1, 2, 3].map((aIndex) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", name: `questions.${qIndex}.correctAnswerIndex`, value: aIndex, onChange: () => setValue(`questions.${qIndex}.correctAnswerIndex`, aIndex), className: "h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500", title: t('markAsCorrect') }), _jsx("input", { className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100", ...register(`questions.${qIndex}.answers.${aIndex}`), placeholder: `${t('answerOption', { number: aIndex + 1 })}` })] }, aIndex))) })] }, qIndex)))] })), _jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700", children: [_jsx("button", { type: "button", onClick: () => {
                                            setCreateOpen(false);
                                            setActiveTab('details');
                                            setFileName('');
                                        }, className: "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300", children: t('cancel') }), _jsx("button", { type: "submit", className: "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90", children: t('saveCourse') })] })] })] }), _jsxs(Modal, { open: isEditOpen, onClose: () => {
                    setEditOpen(false);
                    setEditingCourse(null);
                    setActiveTab('details');
                    setFileName('');
                    reset();
                }, title: t('editCourse') || 'Edit Course', description: t('updateCourseDetails') || 'Update course details and settings', children: [_jsx("div", { className: "border-b border-slate-200 dark:border-slate-700", children: _jsxs("nav", { className: "flex gap-6", children: [_jsx("button", { type: "button", onClick: () => setActiveTab('details'), className: `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'details'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('courseDetails') }), _jsx("button", { type: "button", onClick: () => setActiveTab('rules'), className: `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'rules'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('assignmentRules') }), _jsx("button", { type: "button", onClick: () => setActiveTab('quiz'), className: `border-b-2 px-1 py-3 text-sm font-medium transition-colors ${activeTab === 'quiz'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, children: t('courseQuiz') })] }) }), _jsxs("form", { className: "space-y-6 pt-6", onSubmit: handleSubmit(handleUpdate), children: [activeTab === 'details' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('courseTitle'), " *"] }), _jsx("input", { className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('title', { required: true }), placeholder: "e.g., SOP-101: Animal Handling" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: t('description') }), _jsx("textarea", { rows: 3, className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('description'), placeholder: "Describe the course objectives and requirements..." })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [_jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('contentType'), " *"] }), _jsxs("select", { className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('contentType'), children: [_jsx("option", { value: "video", children: t('video') }), _jsx("option", { value: "pdf", children: t('pdf') }), _jsx("option", { value: "powerpoint", children: t('powerpoint') }), _jsx("option", { value: "scorm", children: t('scorm') }), _jsx("option", { value: "other", children: t('other') })] })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: t('durationMinutes') }), _jsx("input", { type: "number", className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('durationMinutes', { valueAsNumber: true }), placeholder: "30" })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: [t('passPercentage'), " *"] }), _jsx("input", { type: "number", min: "0", max: "100", className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", ...register('passPercentage', { valueAsNumber: true }), placeholder: "80" })] }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: t('courseContentFile') }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300", children: [_jsx(ArrowUpTrayIcon, { className: "h-5 w-5" }), t('chooseFile'), _jsx("input", { type: "file", className: "hidden", ...register('contentFile'), onChange: handleFileChange, accept: ".pdf,.mp4,.ppt,.pptx,.zip" })] }), _jsx("span", { className: "text-sm text-slate-500 dark:text-slate-400", children: fileName || t('noFileChosen') || 'No file chosen (optional)' })] })] }), _jsxs("div", { className: "flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("input", { type: "checkbox", id: "edit-mandatory", className: "mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary", ...register('isMandatory') }), _jsxs("div", { children: [_jsx("label", { htmlFor: "edit-mandatory", className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('mandatory') }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('mandatoryDesc') })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", id: "edit-published", className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary", ...register('isPublished') }), _jsx("label", { htmlFor: "edit-published", className: "text-sm font-medium text-slate-900 dark:text-white", children: t('publish') })] })] })), activeTab === 'rules' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('selectDepartments') }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('selectDepartmentsDesc') }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "all", ...register('departmentScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('allDepartments') })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "specific", ...register('departmentScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('specificDepartments') })] })] }), watch('departmentScope') === 'specific' && (_jsx("div", { className: "mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: departments.map((dept) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", value: dept.id, ...register('selectedDepartments'), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: dept.name })] }, dept.id))) }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('selectJobPositions') }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('selectJobPositionsDesc') }), _jsxs("div", { className: "mt-4 space-y-3", children: [_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "all", ...register('positionScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('allPositions') })] }), _jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", value: "specific", ...register('positionScope'), className: "h-4 w-4 border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: t('specificPositions') })] })] }), watch('positionScope') === 'specific' && (_jsx("div", { className: "mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: positions.map((pos) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", value: pos.id, ...register('selectedPositions'), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: pos.name })] }, pos.id))) }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: t('assignmentExceptions') || 'Exceptions' }), _jsx("p", { className: "mt-1 text-xs text-slate-600 dark:text-slate-400", children: t('assignmentExceptionsDesc') || 'Exclude specific positions from this training requirement.' }), _jsx("div", { className: "mt-4 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: positions.map((pos) => (_jsxs("label", { className: "flex items-center gap-3", children: [_jsx("input", { type: "checkbox", value: pos.id, ...register('exceptionPositions'), className: "h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" }), _jsx("span", { className: "text-sm text-slate-900 dark:text-white", children: pos.name })] }, pos.id))) })] })] })), activeTab === 'quiz' && (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-200", children: [_jsx("p", { className: "font-semibold", children: t('quizSettings') }), _jsx("p", { className: "mt-1", children: t('questionsCount') })] }), questions.map((_, qIndex) => (_jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("label", { className: "mb-3 block text-sm font-semibold text-slate-900 dark:text-white", children: t('questionText', { number: qIndex + 1 }) }), _jsx("input", { className: "mb-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100", ...register(`questions.${qIndex}.question`), placeholder: `Enter question ${qIndex + 1}...` }), _jsx("div", { className: "space-y-2", children: [0, 1, 2, 3].map((aIndex) => (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("input", { type: "radio", name: `questions.${qIndex}.correctAnswerIndex`, value: aIndex, onChange: () => setValue(`questions.${qIndex}.correctAnswerIndex`, aIndex), className: "h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-500", title: t('markAsCorrect') }), _jsx("input", { className: "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100", ...register(`questions.${qIndex}.answers.${aIndex}`), placeholder: `${t('answerOption', { number: aIndex + 1 })}` })] }, aIndex))) })] }, qIndex)))] })), _jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700", children: [_jsx("button", { type: "button", onClick: () => {
                                            setEditOpen(false);
                                            setEditingCourse(null);
                                            setActiveTab('details');
                                            setFileName('');
                                            reset();
                                        }, className: "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300", children: t('cancel') }), _jsx("button", { type: "submit", className: "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90", children: t('updateCourse') || 'Update Course' })] })] })] }), _jsx(Modal, { open: isDeleteOpen, onClose: () => {
                    setDeleteOpen(false);
                    setDeletingCourse(null);
                    setDeleteConfirmId('');
                }, title: t('deleteCourse') || 'Delete Course', description: t('confirmDeleteCourse') || 'This action cannot be undone. Please type the course ID to confirm.', children: _jsxs("div", { className: "space-y-4", children: [deletingCourse && (_jsxs("div", { className: "rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10", children: [_jsx("p", { className: "text-sm font-semibold text-red-700 dark:text-red-200", children: t('courseToDelete') || 'Course to delete:' }), _jsxs("p", { className: "mt-1 text-sm text-red-600 dark:text-red-300", children: [deletingCourse.title, " (", deletingCourse.id.substring(0, 8), ")"] })] })), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: t('typeCourseId') || 'Type the course ID to confirm:' }), _jsx("input", { type: "text", value: deleteConfirmId, onChange: (e) => setDeleteConfirmId(e.target.value), className: "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100", placeholder: deletingCourse?.id || 'Course ID' })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700", children: [_jsx("button", { type: "button", onClick: () => {
                                        setDeleteOpen(false);
                                        setDeletingCourse(null);
                                        setDeleteConfirmId('');
                                    }, className: "rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300", children: t('cancel') }), _jsx("button", { type: "button", onClick: handleDeleteConfirm, disabled: deleteCourseMutation.isPending, className: "rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-50", children: deleteCourseMutation.isPending ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete') })] })] }) })] }));
}
