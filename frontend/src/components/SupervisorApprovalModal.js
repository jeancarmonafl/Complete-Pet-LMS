import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Modal } from './Modal';
export function SupervisorApprovalModal({ open, record, onClose, onApprove }) {
    const [activeTab, setActiveTab] = useState('review');
    const [signature, setSignature] = useState('');
    if (!record) {
        return null;
    }
    const handleApprove = () => {
        if (signature.trim().length < 3)
            return;
        onApprove(signature.trim());
        setSignature('');
        setActiveTab('review');
    };
    return (_jsxs(Modal, { open: open, onClose: () => {
            setSignature('');
            setActiveTab('review');
            onClose();
        }, title: `Review: ${record.courseTitle}`, description: "Confirm the learner's completion details and certify the record.", children: [_jsx("div", { className: "border-b border-slate-200 dark:border-slate-700", children: _jsxs("nav", { className: "flex gap-4 text-sm font-medium", children: [_jsx("button", { className: `border-b-2 px-1 py-2 ${activeTab === 'review'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, onClick: () => setActiveTab('review'), children: "Review details" }), _jsx("button", { className: `border-b-2 px-1 py-2 ${activeTab === 'signature'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`, onClick: () => setActiveTab('signature'), children: "Supervisor signature" })] }) }), activeTab === 'review' ? (_jsxs("div", { className: "space-y-4 pt-4", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: "Learner" }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: [record.employeeName, " \u00B7 ID ", record.employeeId] })] }), _jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [_jsxs("div", { className: "rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Completion date" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: new Date(record.completionDate).toLocaleString() })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Quiz score" }), _jsxs("p", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: [record.quizScore, "%"] })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Pass requirement" }), _jsxs("p", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: [record.passPercentage, "%"] })] }), _jsxs("div", { className: "rounded-2xl border border-slate-200 p-4 text-sm dark:border-slate-700", children: [_jsx("p", { className: "text-slate-500 dark:text-slate-400", children: "Employee signature" }), _jsx("p", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: record.employeeSignature })] })] })] })) : (_jsxs("div", { className: "space-y-4 pt-4", children: [_jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "By signing below you confirm that you have reviewed the quiz results and certify that the learner meets the requirements of this SOP." }), _jsxs("div", { children: [_jsx("label", { className: "mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200", children: "Supervisor signature" }), _jsx("input", { type: "text", value: signature, onChange: (event) => setSignature(event.target.value), className: "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", placeholder: "Enter your full name" }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Signature is required to approve." })] }), _jsx("button", { type: "button", disabled: signature.trim().length < 3, onClick: handleApprove, className: `w-full rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${signature.trim().length < 3 ? 'bg-slate-300 dark:bg-slate-700' : 'bg-primary hover:bg-primary/90'}`, children: "Approve training record" })] }))] }));
}
