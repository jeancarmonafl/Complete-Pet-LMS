// Lazy load html2pdf to avoid initialization errors
// import html2pdf from 'html2pdf.js';

interface TrainingCompletionRecord {
  // Employee Information
  employeeFirstName: string;
  employeeLastName: string;
  employeeId: string;
  department: string;
  jobTitle: string;
  
  // Training Information
  sopNumber: string; // Course ID
  courseTitle: string;
  courseDescription: string;
  contentType: string;
  
  // Completion Details
  videoWatchDuration: number; // minutes
  quizCompletionTime: number; // minutes
  quizScore: number; // percentage
  passPercentage: number;
  
  // Signatures and Timestamps
  employeeSignature: string;
  employeeSignatureDate: Date;
  supervisorName: string;
  supervisorSignature: string;
  supervisorSignatureDate: Date;
  
  // Metadata
  completionDate: Date;
  expirationDate: Date;
  recordVersion: number; // 1, 2, 3... for tracking multiple completions
  status: 'active' | 'expired' | 'superseded';
}

export async function generateCVS_ADM_005_PDF(record: TrainingCompletionRecord): Promise<void> {
  // Dynamically import html2pdf only when needed
  const html2pdf = (await import('html2pdf.js')).default;
  
  const documentHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>CVS-ADM-005 Rev 004 - Training Record</title>
      <style>
        @page {
          size: A4;
          margin: 0.5in;
        }
        
        body {
          font-family: Arial, sans-serif;
          font-size: 11pt;
          line-height: 1.4;
          color: #000;
        }
        
        .header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 16pt;
          font-weight: bold;
          margin: 0;
          padding: 0;
        }
        
        .header .doc-number {
          font-size: 10pt;
          margin-top: 5px;
          font-weight: bold;
        }
        
        .section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .section-title {
          font-size: 12pt;
          font-weight: bold;
          background-color: #e8e8e8;
          padding: 5px 10px;
          border-left: 4px solid #333;
          margin-bottom: 10px;
        }
        
        .info-grid {
          display: table;
          width: 100%;
          border-collapse: collapse;
        }
        
        .info-row {
          display: table-row;
        }
        
        .info-label {
          display: table-cell;
          font-weight: bold;
          width: 35%;
          padding: 6px 10px;
          border: 1px solid #ccc;
          background-color: #f5f5f5;
        }
        
        .info-value {
          display: table-cell;
          padding: 6px 10px;
          border: 1px solid #ccc;
        }
        
        .signature-section {
          margin-top: 30px;
          page-break-inside: avoid;
        }
        
        .signature-box {
          border: 2px solid #000;
          padding: 15px;
          margin-bottom: 20px;
        }
        
        .signature-line {
          border-bottom: 1px solid #000;
          min-height: 40px;
          margin-bottom: 5px;
          font-style: italic;
          font-family: 'Brush Script MT', cursive, Arial;
          font-size: 18pt;
          padding-top: 10px;
        }
        
        .signature-label {
          font-size: 9pt;
          color: #666;
          margin-top: 3px;
        }
        
        .timestamp {
          font-size: 9pt;
          color: #333;
          margin-top: 5px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 10px;
          border-top: 1px solid #ccc;
          font-size: 8pt;
          color: #666;
          text-align: center;
        }
        
        .status-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 3px;
          font-size: 9pt;
          font-weight: bold;
        }
        
        .status-active {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .status-expired {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        .status-superseded {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        
        .compliance-notice {
          background-color: #e7f3ff;
          border: 1px solid #b3d9ff;
          padding: 10px;
          margin-top: 20px;
          font-size: 9pt;
          text-align: center;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div class="header">
        <h1>Complete-Pet Training Completion Record</h1>
        <div class="doc-number">CVS-ADM-005 Rev 004</div>
        <div style="font-size: 9pt; margin-top: 5px;">21 CFR Part 11 Compliant Electronic Record</div>
      </div>
      
      <!-- Record Status -->
      <div style="text-align: right; margin-bottom: 15px;">
        <span class="status-badge status-${record.status}">
          ${record.status.toUpperCase()} - Record Version ${record.recordVersion}
        </span>
      </div>
      
      <!-- Section 1: Employee Information -->
      <div class="section">
        <div class="section-title">1. EMPLOYEE INFORMATION</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Employee Name:</div>
            <div class="info-value">${record.employeeLastName}, ${record.employeeFirstName}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Employee ID:</div>
            <div class="info-value">${record.employeeId}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Department:</div>
            <div class="info-value">${record.department}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Job Title:</div>
            <div class="info-value">${record.jobTitle}</div>
          </div>
        </div>
      </div>
      
      <!-- Section 2: Training Information -->
      <div class="section">
        <div class="section-title">2. TRAINING INFORMATION</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">SOP Number:</div>
            <div class="info-value">${record.sopNumber}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Training Title:</div>
            <div class="info-value">${record.courseTitle}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Training Description:</div>
            <div class="info-value">${record.courseDescription}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Content Type:</div>
            <div class="info-value">${record.contentType}</div>
          </div>
        </div>
      </div>
      
      <!-- Section 3: Completion Details -->
      <div class="section">
        <div class="section-title">3. COMPLETION DETAILS</div>
        <div class="info-grid">
          <div class="info-row">
            <div class="info-label">Video Watch Duration:</div>
            <div class="info-value">${record.videoWatchDuration} minutes</div>
          </div>
          <div class="info-row">
            <div class="info-label">Quiz Completion Time:</div>
            <div class="info-value">${record.quizCompletionTime} minutes</div>
          </div>
          <div class="info-row">
            <div class="info-label">Total Training Time:</div>
            <div class="info-value">${record.videoWatchDuration + record.quizCompletionTime} minutes</div>
          </div>
          <div class="info-row">
            <div class="info-label">Quiz Score:</div>
            <div class="info-value">${record.quizScore}% (Pass: ${record.passPercentage}%)</div>
          </div>
          <div class="info-row">
            <div class="info-label">Result:</div>
            <div class="info-value">
              <strong style="color: ${record.quizScore >= record.passPercentage ? '#155724' : '#721c24'};">
                ${record.quizScore >= record.passPercentage ? 'PASSED' : 'FAILED'}
              </strong>
            </div>
          </div>
          <div class="info-row">
            <div class="info-label">Completion Date:</div>
            <div class="info-value">${formatDateTime(record.completionDate)}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Expiration Date:</div>
            <div class="info-value">${formatDateTime(record.expirationDate)}</div>
          </div>
        </div>
      </div>
      
      <!-- Section 4: Electronic Signatures -->
      <div class="section signature-section">
        <div class="section-title">4. ELECTRONIC SIGNATURES</div>
        
        <!-- Employee Signature -->
        <div class="signature-box">
          <div style="font-weight: bold; margin-bottom: 10px;">EMPLOYEE ACKNOWLEDGMENT</div>
          <p style="font-size: 9pt; margin-bottom: 10px;">
            I acknowledge that I have completed the training as described above and understand 
            the material covered. I agree to comply with all procedures outlined in this training.
          </p>
          <div class="signature-line">${record.employeeSignature}</div>
          <div class="signature-label">Employee Signature (Electronic)</div>
          <div class="timestamp">
            Signed on: ${formatDateTime(record.employeeSignatureDate)}<br>
            By: ${record.employeeFirstName} ${record.employeeLastName} (${record.employeeId})
          </div>
        </div>
        
        <!-- Supervisor Signature -->
        <div class="signature-box">
          <div style="font-weight: bold; margin-bottom: 10px;">SUPERVISOR/ADMINISTRATOR VERIFICATION</div>
          <p style="font-size: 9pt; margin-bottom: 10px;">
            I verify that the employee named above has successfully completed this training 
            and demonstrated understanding of the material. This training record is approved.
          </p>
          <div class="signature-line">${record.supervisorSignature}</div>
          <div class="signature-label">Supervisor/Administrator Signature (Electronic)</div>
          <div class="timestamp">
            Signed on: ${formatDateTime(record.supervisorSignatureDate)}<br>
            By: ${record.supervisorName}
          </div>
        </div>
      </div>
      
      <!-- Compliance Notice -->
      <div class="compliance-notice">
        <strong>21 CFR Part 11 Compliance Notice</strong><br>
        This electronic record has been created, modified, maintained, archived, retrieved, and/or transmitted 
        in accordance with 21 CFR Part 11 requirements. All electronic signatures are legally binding.
      </div>
      
      <!-- Footer -->
      <div class="footer">
        Document: CVS-ADM-005 Rev 004 | Generated: ${formatDateTime(new Date())}<br>
        Complete-Pet Training Management System | Confidential
      </div>
    </body>
    </html>
  `;
  
  // Configure html2pdf options
  const options = {
    margin: [0.5, 0.5, 0.5, 0.5], // inches
    filename: `CVS-ADM-005_${record.sopNumber}_${record.employeeLastName}_${record.employeeId}_v${record.recordVersion}_${formatDateForFilename(record.completionDate)}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { 
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: { 
      unit: 'in', 
      format: 'letter', 
      orientation: 'portrait',
      compress: true
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };
  
  // Generate PDF and open in new tab
  const element = document.createElement('div');
  element.innerHTML = documentHTML;
  
  return html2pdf()
    .set(options)
    .from(element)
    .toPdf()
    .get('pdf')
    .then((pdf: any) => {
      // Open in new tab
      window.open(pdf.output('bloburl'), '_blank');
    });
}

// Helper function to format date and time
function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(new Date(date));
}

// Helper function to format date for filename
function formatDateForFilename(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

