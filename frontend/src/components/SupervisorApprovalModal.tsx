import { useState } from 'react';

import { TrainingRecord } from '../contexts/useTrainingStore';
import { Modal } from './Modal';

interface SupervisorApprovalModalProps {
  open: boolean;
  record: TrainingRecord | null;
  onClose: () => void;
  onApprove: (signature: string) => void;
  onDeny?: (reason: string) => void;
}

export function SupervisorApprovalModal({ open, record, onClose, onApprove, onDeny }: SupervisorApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'signature' | 'deny'>('review');
  const [signature, setSignature] = useState('');
  const [denyReason, setDenyReason] = useState('');
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);

  if (!record) {
    return null;
  }

  const handleApprove = () => {
    if (signature.trim().length < 3) return;
    onApprove(signature.trim());
    setSignature('');
    setActiveTab('review');
  };

  const handleDeny = () => {
    if (!onDeny) return;
    onDeny(denyReason.trim());
    setDenyReason('');
    setShowDenyConfirm(false);
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
            Approve
          </button>
          {onDeny && (
            <button
              className={`border-b-2 px-1 py-2 ${
                activeTab === 'deny'
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400'
              }`}
              onClick={() => setActiveTab('deny')}
            >
              Deny
            </button>
          )}
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
              {record.employeeSignature?.startsWith('data:image') ? (
                <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                  <img
                    src={record.employeeSignature}
                    alt="Employee signature"
                    className="mx-auto h-16 w-full object-contain"
                  />
                </div>
              ) : (
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {record.employeeSignature || 'Signature on file'}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'signature' ? (
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
      ) : (
        <div className="space-y-4 pt-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/40 dark:bg-red-500/10">
            <p className="text-sm font-semibold text-red-900 dark:text-red-200">⚠️ Deny Training Completion</p>
            <p className="mt-1 text-xs text-red-700 dark:text-red-300">
              Denying this training will reset the employee's progress completely. They will need to retake the entire training from the beginning.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Reason for denial (optional)
            </label>
            <textarea
              value={denyReason}
              onChange={(event) => setDenyReason(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Explain why this training is being denied..."
              rows={4}
            />
          </div>

          {!showDenyConfirm ? (
            <button
              type="button"
              onClick={() => setShowDenyConfirm(true)}
              className="w-full rounded-xl border border-red-500 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
            >
              Deny Training Record
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-sm font-semibold text-red-700 dark:text-red-400">
                Are you sure? This action cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShowDenyConfirm(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeny}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  Confirm Denial
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}


