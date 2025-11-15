import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircleIcon, DocumentDuplicateIcon, PrinterIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Modal } from './Modal';
export function EmployeeInfoModal({ open, onClose, employeeData }) {
    const { t } = useTranslation();
    const handleCopyDetails = () => {
        const details = `
Employee Information
====================
Name: ${employeeData.fullName}
Employee ID: ${employeeData.employeeId}
Department: ${employeeData.department || 'N/A'}
Position: ${employeeData.jobTitle || 'N/A'}
System Role: ${employeeData.role.replace('_', ' ')}

Login Credentials
=================
Login Email: ${employeeData.email}
Temporary Password: ${employeeData.temporaryPassword}
Login URL: ${window.location.origin}

Getting Started Instructions
============================
1. Go to ${window.location.origin}
2. Click "Sign in with Email"
3. Enter your login email: ${employeeData.email}
4. You will receive a one-time verification code via email. Enter it to proceed.
5. Complete your profile information (if prompted).
6. Begin your assigned training courses.

Note: This employee does not have a personal email. They will log in using Employee ID: ${employeeData.employeeId}. Their system login email is auto-generated as ${employeeData.email}.
    `.trim();
        navigator.clipboard.writeText(details);
        alert('Details copied to clipboard!');
    };
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow)
            return;
        const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Access Information - ${employeeData.fullName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
            color: #1e293b;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #0ea5e9;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #0f172a;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: #0ea5e9;
            font-size: 18px;
            margin: 0;
            font-weight: normal;
          }
          .section {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
          }
          .section h3 {
            margin-top: 0;
            color: #0f172a;
            border-bottom: 2px solid #0ea5e9;
            padding-bottom: 10px;
          }
          .info-row {
            display: flex;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .label {
            font-weight: 600;
            width: 180px;
            color: #475569;
          }
          .value {
            flex: 1;
            color: #0f172a;
          }
          .important-note {
            background: #fef3c7;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
          }
          .important-note strong {
            color: #92400e;
          }
          .instructions {
            background: #ecfdf5;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .instructions h3 {
            color: #065f46;
            border-bottom: 2px solid #10b981;
          }
          .instructions ol {
            margin: 10px 0;
            padding-left: 25px;
          }
          .instructions li {
            margin: 8px 0;
            color: #064e3b;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 12px;
            color: #64748b;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🐾 Complete-Pet FL Learning Management System</h1>
          <h2>New Employee Access Information</h2>
        </div>

        <div class="section">
          <h3>Employee Details</h3>
          <div class="info-row">
            <div class="label">Employee Name:</div>
            <div class="value">${employeeData.fullName}</div>
          </div>
          <div class="info-row">
            <div class="label">Employee ID:</div>
            <div class="value">${employeeData.employeeId}</div>
          </div>
          <div class="info-row">
            <div class="label">Department:</div>
            <div class="value">${employeeData.department || 'Not Assigned'}</div>
          </div>
          <div class="info-row">
            <div class="label">Position:</div>
            <div class="value">${employeeData.jobTitle || 'Not Assigned'}</div>
          </div>
          <div class="info-row">
            <div class="label">System Role:</div>
            <div class="value">${employeeData.role.replace('_', ' ')}</div>
          </div>
        </div>

        <div class="section">
          <h3>Login Credentials</h3>
          <div class="info-row">
            <div class="label">Login Email:</div>
            <div class="value"><strong>${employeeData.email}</strong></div>
          </div>
          <div class="info-row">
            <div class="label">Temporary Password:</div>
            <div class="value"><strong>${employeeData.temporaryPassword}</strong></div>
          </div>
          <div class="info-row">
            <div class="label">Login URL:</div>
            <div class="value">${window.location.origin}</div>
          </div>
        </div>

        <div class="important-note">
          <strong>⚠️ Important:</strong> This employee does not have a personal email. They will log in using Employee ID: <strong>${employeeData.employeeId}</strong>. Their system login email is auto-generated as <strong>${employeeData.email}</strong>.
        </div>

        <div class="instructions">
          <h3>Getting Started Instructions</h3>
          <ol>
            <li>Go to <strong>${window.location.origin}</strong></li>
            <li>Click "<strong>Sign in with Email</strong>"</li>
            <li>Enter your login email: <strong>${employeeData.email}</strong></li>
            <li>Enter your temporary password: <strong>${employeeData.temporaryPassword}</strong></li>
            <li>You may be prompted to change your password on first login</li>
            <li>Complete your profile information (if prompted)</li>
            <li>Begin your assigned training courses</li>
          </ol>
        </div>

        <div class="footer">
          <p>For technical assistance or questions, please contact your supervisor or the HR department.</p>
          <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 250);
    };
    return (_jsx(Modal, { open: open, onClose: onClose, title: "Employee Information Ready", children: _jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/10", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx(CheckCircleIcon, { className: "h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold text-emerald-900 dark:text-emerald-100", children: "\u2713 Information Prepared Successfully" }), _jsxs("p", { className: "mt-1 text-xs text-emerald-700 dark:text-emerald-200", children: ["The employee record has been set up. Share the credentials below with ", employeeData.fullName, "."] })] })] }) }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-slate-900 dark:text-white", children: "Employee Details" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "Employee Name:" }), _jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: employeeData.fullName })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "Employee ID:" }), _jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: employeeData.employeeId })] }), employeeData.department && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "Department:" }), _jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: employeeData.department })] })), employeeData.jobTitle && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "Position:" }), _jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: employeeData.jobTitle })] })), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-600 dark:text-slate-400", children: "System Role:" }), _jsx("span", { className: "font-medium text-slate-900 dark:text-white", children: employeeData.role.replace('_', ' ') })] })] })] }), _jsxs("div", { className: "rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/40 dark:bg-blue-500/10", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-blue-900 dark:text-blue-100", children: "Login Credentials" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-blue-700 dark:text-blue-200", children: "Login Email:" }), _jsx("span", { className: "font-mono font-medium text-blue-900 dark:text-blue-100", children: employeeData.email })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-blue-700 dark:text-blue-200", children: "Temporary Password:" }), _jsx("span", { className: "font-mono font-medium text-blue-900 dark:text-blue-100", children: employeeData.temporaryPassword })] })] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900", children: [_jsx("h3", { className: "mb-3 text-sm font-semibold text-slate-900 dark:text-white", children: "\uD83D\uDCCB Next Steps" }), _jsxs("ol", { className: "list-decimal space-y-2 pl-5 text-xs text-slate-600 dark:text-slate-400", children: [_jsx("li", { children: "Copy or print these credentials" }), _jsx("li", { children: "Share with the employee (in person, by phone, or printed document)" }), _jsx("li", { children: "Employee visits the login page and signs in" }), _jsx("li", { children: "Employee completes profile and begins training" }), _jsxs("li", { children: [_jsx("strong", { className: "text-slate-900 dark:text-white", children: "Note:" }), " Only Global Administrators can edit department and position fields"] })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700", children: [_jsxs("button", { onClick: handleCopyDetails, className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300", children: [_jsx(DocumentDuplicateIcon, { className: "h-5 w-5" }), "Copy Details"] }), _jsxs("button", { onClick: handlePrint, className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300", children: [_jsx(PrinterIcon, { className: "h-5 w-5" }), "Print"] }), _jsx("button", { onClick: onClose, className: "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90", children: "Done" })] })] }) }));
}
