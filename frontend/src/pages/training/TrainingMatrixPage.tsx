import { DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useTrainingStore } from '../../contexts/useTrainingStore';
import { generateCVS_ADM_005_PDF } from '../../utils/pdfGenerator';

// Mock data - in real implementation, this would come from API
const employees = [
  { 
    id: 'EMP001',
    name: 'Jean Carmona', 
    employeeId: 'EMP001', 
    department: 'Administration',
    jobTitle: 'System Administrator',
    status: 'active'
  }
];

const courses = [
  { 
    id: 'SOP-101',
    title: 'SOP-101 Animal Handling',
    description: 'Standard Operating Procedure for safe and humane animal handling practices'
  },
  { 
    id: 'SOP-102',
    title: 'Safety Orientation',
    description: 'General workplace safety and emergency procedures'
  }
];

// Training completion records - showing multiple versions for same course
interface CompletionRecord {
  id: string;
  employeeId: string;
  courseId: string;
  version: number; // 1, 2, 3... for tracking re-takes
  completionDate: Date;
  expirationDate: Date;
  quizScore: number;
  passPercentage: number;
  videoWatchDuration: number;
  quizCompletionTime: number;
  status: 'active' | 'expired' | 'superseded';
  employeeSignature: string;
  employeeSignatureDate: Date;
  supervisorName: string;
  supervisorSignature: string;
  supervisorSignatureDate?: Date; // Optional because it might not be signed yet
}

const seedCompletionRecords: CompletionRecord[] = [
  {
    id: 'REC001-V1',
    employeeId: 'EMP001',
    courseId: 'SOP-101',
    version: 1,
    completionDate: new Date('2024-10-24T10:30:00'),
    expirationDate: new Date('2025-10-24T10:30:00'),
    quizScore: 95,
    passPercentage: 80,
    videoWatchDuration: 42,
    quizCompletionTime: 8,
    status: 'superseded',
    employeeSignature: 'Jean Carmona',
    employeeSignatureDate: new Date('2024-10-24T10:38:00'),
    supervisorName: 'John Smith',
    supervisorSignature: 'John Smith',
    supervisorSignatureDate: new Date('2024-10-24T11:00:00')
  },
  {
    id: 'REC001-V2',
    employeeId: 'EMP001',
    courseId: 'SOP-101',
    version: 2,
    completionDate: new Date('2025-10-25T14:15:00'),
    expirationDate: new Date('2026-10-25T14:15:00'),
    quizScore: 100,
    passPercentage: 80,
    videoWatchDuration: 40,
    quizCompletionTime: 6,
    status: 'active',
    employeeSignature: 'Jean Carmona',
    employeeSignatureDate: new Date('2025-10-25T14:21:00'),
    supervisorName: 'John Smith',
    supervisorSignature: 'John Smith',
    supervisorSignatureDate: new Date('2025-10-25T15:00:00')
  },
  {
    id: 'REC002-V1',
    employeeId: 'EMP001',
    courseId: 'SOP-102',
    version: 1,
    completionDate: new Date('2025-10-26T09:00:00'),
    expirationDate: new Date('2026-10-26T09:00:00'),
    quizScore: 85,
    passPercentage: 80,
    videoWatchDuration: 30,
    quizCompletionTime: 7,
    status: 'active',
    employeeSignature: 'Jean Carmona',
    employeeSignatureDate: new Date('2025-10-26T09:07:00'),
    supervisorName: 'John Smith',
    supervisorSignature: 'John Smith',
    supervisorSignatureDate: new Date('2025-10-26T10:00:00')
  }
];

export default function TrainingMatrixPage() {
  const { t } = useTranslation();
  const [viewingHistory, setViewingHistory] = useState<{employeeId: string, courseId: string} | null>(null);
  const [showFormerEmployees, setShowFormerEmployees] = useState(false);
  const { completedTrainings } = useTrainingStore();

  const dynamicRecords: CompletionRecord[] = completedTrainings
    .filter((record) => record.status === 'approved')
    .map((record) => ({
      id: record.id,
      employeeId: record.employeeId,
      courseId: record.courseId,
      version: 1,
      completionDate: new Date(record.completionDate),
      expirationDate: new Date(new Date(record.completionDate).getTime() + 365 * 24 * 60 * 60 * 1000),
      quizScore: record.quizScore,
      passPercentage: record.passPercentage,
      videoWatchDuration: record.durationMinutes,
      quizCompletionTime: 5,
      status: 'active',
      employeeSignature: record.employeeSignature,
      employeeSignatureDate: new Date(record.completionDate),
      supervisorName: record.supervisorName || 'Supervisor',
      supervisorSignature: record.supervisorSignature || '',
      supervisorSignatureDate: record.supervisorSignatureDate
        ? new Date(record.supervisorSignatureDate)
        : undefined
    }));

  const completionRecords = [...seedCompletionRecords, ...dynamicRecords];

const getRecordsForEmployeeCourse = (employeeId: string, courseId: string, records: CompletionRecord[]) => {
  return records.filter(
      r => r.employeeId === employeeId && r.courseId === courseId
    ).sort((a, b) => b.version - a.version); // Latest first
  };

const getLatestRecord = (employeeId: string, courseId: string, records: CompletionRecord[]) => {
  const entries = getRecordsForEmployeeCourse(employeeId, courseId, records);
    return entries.length > 0 ? entries[0] : null;
  };

  const handleViewPDF = async (record: CompletionRecord) => {
    const employee = employees.find(e => e.employeeId === record.employeeId);
    const course = courses.find(c => c.id === record.courseId);
    
    if (!employee || !course) return;

    // Split employee name
    const [firstName, ...lastNameParts] = employee.name.split(' ');
    const lastName = lastNameParts.join(' ');

    await generateCVS_ADM_005_PDF({
      // Employee Information
      employeeFirstName: firstName,
      employeeLastName: lastName,
      employeeId: employee.employeeId,
      department: employee.department,
      jobTitle: employee.jobTitle,
      
      // Training Information
      sopNumber: course.id,
      courseTitle: course.title,
      courseDescription: course.description,
      contentType: 'Video',
      
      // Completion Details
      videoWatchDuration: record.videoWatchDuration,
      quizCompletionTime: record.quizCompletionTime,
      quizScore: record.quizScore,
      passPercentage: record.passPercentage,
      
      // Signatures and Timestamps
      employeeSignature: record.employeeSignature,
      employeeSignatureDate: record.employeeSignatureDate,
      supervisorName: record.supervisorName,
      supervisorSignature: record.supervisorSignature,
      supervisorSignatureDate: record.supervisorSignatureDate || record.employeeSignatureDate,
      
      // Metadata
      completionDate: record.completionDate,
      expirationDate: record.expirationDate,
      recordVersion: record.version,
      status: record.status
    });
  };

  const filteredEmployees = showFormerEmployees ? employees.filter((employee) => employee.status === 'former') : employees.filter((employee) => employee.status !== 'former');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{t('trainingMatrixTitle')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">{t('trainingMatrixSubtitle')}</p>
      </header>

      {/* 21 CFR Part 11 Compliance Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10">
        <div className="flex items-start gap-3">
          <div className="flex-1 text-sm text-blue-900 dark:text-blue-100">
            <p className="font-semibold">📋 21 CFR Part 11 Compliant Record Keeping</p>
            <p className="mt-1 text-xs">
              All training records are maintained for audit trail purposes. Historical records are never deleted. 
              When training expires or is updated, new records are created while preserving previous versions. 
              Click on any completion cell to view all historical records.
            </p>
          </div>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Active Employees</h2>
            <p className="text-sm text-slate-500 dark:text-slate-300">Filter by department, job title, course, or status.</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300">
              <DocumentArrowDownIcon className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => setShowFormerEmployees((prev) => !prev)}
              className={`rounded-xl border px-4 py-2 text-sm transition ${
                showFormerEmployees
                  ? 'border-primary text-primary'
                  : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {showFormerEmployees ? 'Show Active' : 'Former Employees'}
            </button>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                  Employee
                </th>
                {courses.map((course) => (
                  <th key={course.id} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    {course.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
              {filteredEmployees.map((employee) => (
                <tr key={employee.employeeId}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{employee.name}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{employee.employeeId} · {employee.department}</span>
                    </div>
                  </td>
                  {courses.map((course) => {
                    const latestRecord = getLatestRecord(employee.employeeId, course.id, completionRecords);
                    const allRecords = getRecordsForEmployeeCourse(employee.employeeId, course.id, completionRecords);
                    const hasMultipleRecords = allRecords.length > 1;
                    
                    return (
                      <td key={course.id} className="px-6 py-4">
                        {latestRecord ? (
                          <div className="space-y-2">
                            {/* Latest Record */}
                            <div className={`relative rounded-2xl border p-4 text-xs ${
                              latestRecord.status === 'active'
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                                : latestRecord.status === 'expired'
                                ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200'
                                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
                            }`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold">
                                    {latestRecord.status === 'active' ? 'Completed' : 
                                     latestRecord.status === 'expired' ? 'Expired' : 'Superseded'}
                                    {hasMultipleRecords && ` (v${latestRecord.version})`}
                                  </p>
                                  <p>Score: {latestRecord.quizScore}%</p>
                                  <p>{new Date(latestRecord.completionDate).toLocaleDateString()}</p>
                                </div>
                                <button
                                  onClick={() => handleViewPDF(latestRecord)}
                                  className="shrink-0 rounded-lg bg-white/50 p-1.5 hover:bg-white dark:bg-slate-800/50 dark:hover:bg-slate-800"
                                  title="Generate CVS-ADM-005 PDF"
                                >
                                  <DocumentArrowDownIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            {/* Historical Records Indicator */}
                            {hasMultipleRecords && (
                              <button
                                onClick={() => setViewingHistory(
                                  viewingHistory?.employeeId === employee.employeeId && 
                                  viewingHistory?.courseId === course.id
                                    ? null
                                    : { employeeId: employee.employeeId, courseId: course.id }
                                )}
                                className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                              >
                                <EyeIcon className="mr-1 inline h-3 w-3" />
                                {viewingHistory?.employeeId === employee.employeeId && 
                                 viewingHistory?.courseId === course.id
                                  ? 'Hide History'
                                  : `View ${allRecords.length - 1} Previous Record${allRecords.length - 1 > 1 ? 's' : ''}`
                                }
                              </button>
                            )}

                            {/* Historical Records Dropdown */}
                            {viewingHistory?.employeeId === employee.employeeId && 
                             viewingHistory?.courseId === course.id && (
                              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  Historical Records (Audit Trail):
                                </p>
                                {allRecords.slice(1).map((record) => (
                                  <div
                                    key={record.id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-900"
                                  >
                                    <div className="flex-1 text-xs">
                                      <p className="font-medium text-slate-900 dark:text-white">
                                        Version {record.version} - {record.status}
                                      </p>
                                      <p className="text-slate-600 dark:text-slate-400">
                                        Score: {record.quizScore}% | {new Date(record.completionDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => handleViewPDF(record)}
                                      className="shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary hover:bg-primary/20"
                                      title="Generate CVS-ADM-005 PDF for this record"
                                    >
                                      <DocumentArrowDownIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                            Not Started
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
