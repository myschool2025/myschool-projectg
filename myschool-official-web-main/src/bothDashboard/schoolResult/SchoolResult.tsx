import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
// @ts-ignore
import classesData from '@/lib/classes.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const CLASSES = (classesData as { name: string }[]).map(cls => cls.name);

interface ResultRow {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  exam: string;
  subjects: Record<string, string>;
  total: string;
  rank: string;
}

interface ExamConfig {
  class: string;
  exam: string;
  subjects: string[];
}

interface ResultsTableProps {
  parsedResults: ResultRow[];
  loadingResults: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = React.memo(({ parsedResults, loadingResults }) => {
  const isMobile = window.innerWidth < 768;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Student ID</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Class</th>
            <th className="border px-2 py-1">Exam</th>
            <th className="border px-2 py-1">Subject</th>
            <th className="border px-2 py-1">Total</th>
            <th className="border px-2 py-1">Rank</th>
          </tr>
        </thead>
        <tbody>
          {loadingResults ? (
            <tr><td colSpan={7} className="text-center py-4">Loading...</td></tr>
          ) : parsedResults.length === 0 ? (
            <tr><td colSpan={7} className="text-center py-4">No results found.</td></tr>
          ) : parsedResults.map(result => (
            <tr key={result.id} className="hover:bg-gray-50">
              <td className="border px-2 py-1 font-mono">{result.studentId}</td>
              <td className="border px-2 py-1">{result.studentName}</td>
              <td className="border px-2 py-1">{result.class}</td>
              <td className="border px-2 py-1">{result.exam}</td>
              <td className="border px-2 py-1">
                <div className={isMobile ? 'flex flex-col gap-1' : 'flex flex-wrap gap-2'}>
                  {Object.entries(result.subjects)
                    .filter(([_, mark]) => mark) // Only show subjects with marks
                    .map(([subject, mark]) => (
                      <span key={subject} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs">
                        {subject}: {mark}
                      </span>
                    ))}
                </div>
              </td>
              <td className="border px-2 py-1 font-semibold">{result.total}</td>
              <td className="border px-2 py-1">
                <span className="inline-block bg-blue-100 text-blue-700 rounded px-2 py-0.5 font-bold">{result.rank}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const SchoolResult: React.FC = () => {
  const [results, setResults] = useState<ResultRow[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [examConfigs, setExamConfigs] = useState<ExamConfig[]>([]);
  const [availableExams, setAvailableExams] = useState<string[]>([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExamConfigs = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/exam-configs`);
        setExamConfigs(res.data.configs || []);
        setError(null);
      } catch {
        setError('Failed to fetch exam configurations');
        setExamConfigs([]);
      }
    };
    fetchExamConfigs();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      const exams = examConfigs.filter(cfg => cfg.class === selectedClass).map(cfg => cfg.exam);
      setAvailableExams(exams);
      setSelectedExam('');
    }
  }, [selectedClass, examConfigs]);

  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedClass) params.class = selectedClass;
      if (selectedExam) params.exam = selectedExam;
      const res = await axios.get(`${BACKEND_URL}/results`, { params });
      setResults(res.data.results || []);
    } catch {
      setError('Failed to fetch results');
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  }, [selectedClass, selectedExam]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const generateResultsPDF = useCallback((rows: ResultRow[], title = 'School Results') => {
    const exportDate = new Date().toLocaleString();
    const element = document.createElement('div');
    element.innerHTML = `
      <div class="pdf-container">
        <div class="header">
          <h1>MySchool Official</h1>
          <p>Result Sheet</p>
          <p>Generated on: ${exportDate}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Class</th>
              <th>Exam</th>
              <th>Subject</th>
              <th>Total</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(result => `
              <tr>
                <td>${result.studentId}</td>
                <td>${result.studentName}</td>
                <td>${result.class}</td>
                <td>${result.exam}</td>
                <td>${Object.entries(result.subjects)
                  .filter(([_, mark]) => mark)
                  .map(([sub, mark]) => `${sub}: ${mark}`).join(', ')}</td>
                <td>${result.total}</td>
                <td>${result.rank}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated by MySchool Official Website • https://myschool-offical.netlify.app</p>
        </div>
      </div>
    `;
    const style = document.createElement('style');
    style.textContent = `
      .pdf-container { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; color: #333; }
      .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2c3e50; padding-bottom: 20px; }
      .header h1 { color: #2c3e50; margin: 0; font-size: 28px; }
      .header p { color: #7f8c8d; margin: 5px 0 0; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; font-size: 13px; }
      th { background-color: #2c3e50; color: white; }
      tr:nth-child(even) { background-color: #f9f9f9; }
      tr:hover { background-color: #f1f1f1; }
      .footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #7f8c8d; font-size: 13px; }
      @media print { @page { margin: 2cm; } }
    `;
    element.appendChild(style);
    html2pdf().set({
      margin: 0.5,
      filename: `${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' },
    }).from(element).save();
  }, []);

  return (
    <div className="p-2 sm:p-4 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">School Results</h2>
      {error && <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Class</label>
          <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedExam(''); }} className="w-full border rounded p-2">
            <option value="">All Classes</option>
            {CLASSES.map((cls, index) => <option key={index} value={cls}>{cls}</option>)}
          </select>
            </div>
        <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Exam</label>
          <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)} className="w-full border rounded p-2" disabled={!selectedClass}>
            <option value="">All Exams</option>
            {availableExams.map((exam, index) => <option key={index} value={exam}>{exam}</option>)}
          </select>
            </div>
          </div>
      <div className="overflow-x-auto rounded shadow bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-center p-2 gap-2">
          <span className="font-semibold">Results</span>
          <button
            type="button"
            className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
            onClick={() => generateResultsPDF(results, 'School Results')}
            disabled={results.length === 0}
          >
            Download PDF
          </button>
        </div>
        <ResultsTable parsedResults={results} loadingResults={loadingResults} />
      </div>
    </div>
  );
};

export default SchoolResult;