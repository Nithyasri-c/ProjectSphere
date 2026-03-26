import { useState } from 'react';
import * as XLSX from 'xlsx';

export const downloadGuidesTemplate = () => {
  const sampleData = [
    {
      'Guide Name': 'Dr. Nanda Devi D.R',
      'Email': 'nanda.devi@gnits.ac.in'
    },
    {
      'Guide Name': 'Dr. Ramesh Kumar',
      'Email': 'ramesh@gnits.ac.in'
    },
    {
      'Guide Name': 'Mrs. Anjali Singh',
      'Email': 'anjali@gnits.ac.in'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);

  ws['!cols'] = [
    { wch: 30 },
    { wch: 35 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Guides');
  XLSX.writeFile(wb, 'Guides_Template.xlsx');
};

export const downloadProblemsTemplate = () => {
  const sampleData = [
    {
      'Project Title': 'EnviroWatch: Empowering Communities for Environmental Action',
      'Internal Guide': 'Dr. Nanda Devi D.R',
      'Research Thrust Area/Domain': 'Deep Learning',
      'Description': 'Mobile application for environmental monitoring'
    },
    {
      'Project Title': 'Smart City Water Management System',
      'Internal Guide': 'Dr. Ramesh Kumar',
      'Research Thrust Area/Domain': 'IoT',
      'Description': 'IoT-based water conservation and management'
    },
    {
      'Project Title': 'AI-based Predictive Analytics',
      'Internal Guide': 'Mrs. Anjali Singh',
      'Research Thrust Area/Domain': 'Data Analytics',
      'Description': 'Machine learning for business intelligence'
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);

  ws['!cols'] = [
    { wch: 50 },
    { wch: 30 },
    { wch: 30 },
    { wch: 50 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Problems');
  XLSX.writeFile(wb, 'Problems_Template.xlsx');
};
