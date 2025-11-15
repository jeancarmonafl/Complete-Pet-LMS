import { ClockIcon, AcademicCapIcon, UserGroupIcon, BookOpenIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type AdminTab = 'users' | 'courses' | 'quizzes' | 'activity';

export default function AdminPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  // Mock data - in a real app, this would come from API
  const users = [
    { id: '1', name: 'carmonajc90', email: 'carmonajc90@icloud.com', role: 'admin', status: 'active', created: 'Oct 24, 2025' }
  ];

  const courses = [
    { id: '1', title: 'SOP-101: Animal Handling', type: 'video', duration: 45, status: 'draft', created: 'Oct 25, 2025' }
  ];

  const quizzes = [
    { id: '1', courseTitle: 'SOP-101: Animal Handling', questions: 4, passRate: 80, created: 'Oct 25, 2025' }
  ];

  const activities = [
    { id: '1', type: 'user_created', user: 'admin', action: 'Created user: carmonajc90', timestamp: '2025-10-24 14:32:10' },
    { id: '2', type: 'course_created', user: 'admin', action: 'Created course: SOP-101', timestamp: '2025-10-25 09:15:22' },
    { id: '3', type: 'user_login', user: 'carmonajc90', action: 'User logged in', timestamp: '2025-10-25 10:45:33' }
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Administration</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Manage system entities and monitor real-time activity
        </p>
      </header>

      {/* Stats Cards */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Users</p>
            <UserGroupIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{users.length}</p>
        </div>
        
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Courses</p>
            <BookOpenIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{courses.length}</p>
        </div>
        
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Quizzes</p>
            <QuestionMarkCircleIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{quizzes.length}</p>
        </div>
        
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Recent Activities</p>
            <ClockIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{activities.length}</p>
        </div>
      </section>

      {/* Tabs */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-6 dark:border-slate-700">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <UserGroupIcon className="mb-1 inline-block h-5 w-5" /> Users
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'courses'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <BookOpenIcon className="mb-1 inline-block h-5 w-5" /> Courses
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'quizzes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <QuestionMarkCircleIcon className="mb-1 inline-block h-5 w-5" /> Quizzes
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === 'activity'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <ClockIcon className="mb-1 inline-block h-5 w-5" /> Activity Log
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Users Table */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">User Management</h2>
                <input
                  type="text"
                  placeholder="Search users..."
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{user.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-600 dark:bg-purple-500/10 dark:text-purple-200">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-200">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{user.created}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm text-primary hover:underline">{t('edit')}</button>
                          <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                          <button className="text-sm text-red-600 hover:underline">{t('delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Courses Table */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Course Management</h2>
                <input
                  type="text"
                  placeholder="Search courses..."
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                    {courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{course.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{course.title}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{course.type}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{course.duration} min</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-200">
                            {course.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{course.created}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm text-primary hover:underline">{t('edit')}</button>
                          <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                          <button className="text-sm text-red-600 hover:underline">{t('delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quizzes Table */}
          {activeTab === 'quizzes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quiz Management</h2>
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Course</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Questions</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Pass Rate</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                    {quizzes.map((quiz) => (
                      <tr key={quiz.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{quiz.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{quiz.courseTitle}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{quiz.questions}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{quiz.passRate}%</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{quiz.created}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm text-primary hover:underline">{t('edit')}</button>
                          <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
                          <button className="text-sm text-red-600 hover:underline">{t('delete')}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Activity Log */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">System Activity Log</h2>
                <div className="flex gap-2">
                  <select className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-800">
                    <option>All Events</option>
                    <option>User Events</option>
                    <option>Course Events</option>
                    <option>Login Events</option>
                  </select>
                  <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300">
                    {t('exportCSV')}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.action}</p>
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                            By: <span className="font-medium">{activity.user}</span>
                          </p>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{activity.timestamp}</span>
                      </div>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        activity.type === 'user_created' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200' :
                        activity.type === 'course_created' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                      }`}>
                        {activity.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

