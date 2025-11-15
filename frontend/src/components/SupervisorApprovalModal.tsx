import { useState } from 'react';

import { TrainingRecord } from '../contexts/useTrainingStore';
import { Modal } from './Modal';

interface SupervisorApprovalModalProps {
  open: boolean;
  record: TrainingRecord | null;
  onClose: () => void;
  onApprove: (signature: string) => void;
}

export function SupervisorApprovalModal({ open, record, onClose, onApprove }: SupervisorApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'signature'>('review');
  const [signature, setSignature] = useState('');

  if (!record) {
    return null;
  }

  const handleApprove = () => {
    if (signature.trim().length < 3) return;
    onApprove(signature.trim());
    setSignature('');
    setActiveTab('review');
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setSignature('');
        setActiveTab('review');
        onClose();
      }}
      title={`Review: ${record.courseTitle}`}
      description="Confirm the learner's completion details and certify the record."
    >
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4 text-sm font-medium">
          <button
            className={`border-b-2 px-1 py-2 ${
              activeTab === 'review'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('review')}
          >
            Review details
          </button>
          <button
            className={`border-b-2 px-1 py-2 ${
              activeTab === 'signature'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
            onClick={() => setActiveTab('signature')}
          >
            Supervisor signature
          </button>
        </nav>
      </div>

      {activeTab === 'review' ? (
        <div className="space-y-4 pt-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Learner</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {record.employeeName} · ID {record.employeeId}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Completion date</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {new Date(record.completionDate).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Quiz score</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{record.quizScore}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Pass requirement</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{record.passPercentage}%</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400">Employee signature</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{record.employeeSignature}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            By signing below you confirm that you have reviewed the quiz results and certify that the learner meets the
            requirements of this SOP.
          </p>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Supervisor signature
            </label>
            <input
              type="text"
              value={signature}
              onChange={(event) => setSignature(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Enter your full name"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Signature is required to approve.</p>
          </div>
          <button
            type="button"
            disabled={signature.trim().length < 3}
            onClick={handleApprove}
            className={`w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              signature.trim().length < 3 ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            Approve training record
          </button>
        </div>
      )}
    </Modal>
  );
}

