import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateChatReport = (chatData, teamName, guideName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Title
  doc.setFontSize(16);
  doc.text('Project Review Report', pageWidth / 2, 15, { align: 'center' });
  
  // Report metadata - SIMPLIFIED
  doc.setFontSize(11);
  doc.text(`Team: ${teamName}`, 20, 30);
  doc.text(`Guide: ${guideName}`, 20, 40);
  
  // Chat history as table
  const tableData = chatData.messages.map(msg => [
    new Date(msg.timestamp).toLocaleString(),
    msg.senderName,
    msg.text || (msg.fileName ? `[File: ${msg.fileName}]` : '')
  ]);
  
  doc.autoTable({
    head: [['Timestamp', 'Sender', 'Message']],
    body: tableData,
    startY: 55,
    margin: { top: 55 },
    styles: {
      fontSize: 9,
      cellPadding: 5,
      overflow: 'linebreak',
      halign: 'left'
    },
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 35 },
      2: { cellWidth: 90 }
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.text('This is an automatically generated report from Project Sphere', pageWidth / 2, pageHeight - 10, { align: 'center', textColor: 150 });
  
  // Save the PDF
  doc.save(`Project_Review_Report_${teamName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateSummaryReport = (summaries, teamName) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Title
  doc.setFontSize(18);
  doc.setTextColor(44, 62, 80); // Darker color
  doc.text('Daily Chat Summary Report', pageWidth / 2, 20, { align: 'center' });
  
  // Metadata
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Team: ${teamName}`, 20, 35);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 42);
  
  // Table Data
  const tableData = summaries.map(s => [
    new Date(s.date).toLocaleDateString(),
    s.summary
  ]);
  
  doc.autoTable({
    head: [['Date', 'Daily Summary']],
    body: tableData,
    startY: 50,
    margin: { top: 50 },
    styles: {
      fontSize: 10,
      cellPadding: 6,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [118, 75, 162], // Purple theme to match report-btn
      textColor: 255,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Project Sphere - System Generated Summary Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.save(`Chat_Summary_Team_${teamName}_${new Date().toISOString().split('T')[0]}.pdf`);
};
