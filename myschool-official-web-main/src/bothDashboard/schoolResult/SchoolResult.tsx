import React, { useEffect, useState, useMemo, useCallback } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
// @ts-ignore
import classesData from '@/lib/classes.json';
import Spreadsheet from 'react-spreadsheet';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

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
  openEditModal: (result: ResultRow) => void;
  openDeleteConfirm: (id: string) => void;
}

const ResultsTable: React.FC<ResultsTableProps> = React.memo(({ parsedResults, loadingResults, openEditModal, openDeleteConfirm }) => {
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
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loadingResults ? (
            <tr><td colSpan={8} className="text-center py-4">Loading...</td></tr>
          ) : parsedResults.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-4">No results found.</td></tr>
          ) : parsedResults.map(result => {
            const hasData = result.studentId && result.studentName && result.class && result.exam;
            return (
              <tr key={result.id || `${result.studentId}-${result.exam}`} className="hover:bg-gray-50">
              <td className="border px-2 py-1 font-mono">{result.studentId}</td>
              <td className="border px-2 py-1">{result.studentName}</td>
              <td className="border px-2 py-1">{result.class}</td>
              <td className="border px-2 py-1">{result.exam}</td>
              <td className="border px-2 py-1">
                <div className={isMobile ? 'flex flex-col gap-1' : 'flex flex-wrap gap-2'}>
                  {Object.entries(result.subjects)
                      .filter(([_, mark]) => mark)
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
                <td className="border px-2 py-1">
                  {hasData && (
                    <>
                      <Button size="sm" className="mr-2" onClick={() => openEditModal(result)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => openDeleteConfirm(result.id)}>Delete</Button>
                    </>
                  )}
                </td>
            </tr>
            );
          })}
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
  const [user, setUser] = useState<any>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalResult, setModalResult] = useState<ResultRow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formState, setFormState] = useState<Partial<ResultRow>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [addClass, setAddClass] = useState('');
  const [addExam, setAddExam] = useState('');
  const [addSubjects, setAddSubjects] = useState<string[]>([]);
  const [addMarks, setAddMarks] = useState<{ [subject: string]: string }>({});
  const [addRank, setAddRank] = useState('');
  const [addTotal, setAddTotal] = useState('');
  const [isAddingNewExam, setIsAddingNewExam] = useState(false);
  const [addExamName, setAddExamName] = useState('');

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

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

  useEffect(() => {
    if (!addClass) {
      setStudents([]);
      setSelectedStudent(null);
      setAvailableExams([]);
      setAddExam('');
      setIsAddingNewExam(false);
      setAddExamName('');
      return;
    }
    axios.get(`${BACKEND_URL}/students`, { params: { class: addClass, limit: 1000 } })
      .then(res => setStudents(res.data.students || []))
      .catch(() => setStudents([]));
    const exams = examConfigs.filter(cfg => cfg.class === addClass).map(cfg => cfg.exam);
    setAvailableExams([...new Set(exams)]);
    if (!exams.includes(addExam)) setAddExam('');
  }, [addClass, examConfigs]);

  useEffect(() => {
    if (!addClass || !addExam) {
      setAddSubjects([]);
      setAddMarks({});
      return;
    }
    const config = examConfigs.find(cfg => cfg.class === addClass && cfg.exam === addExam);
    setAddSubjects(config ? config.subjects : []);
    setAddMarks({});
  }, [addClass, addExam, examConfigs]);

  useEffect(() => {
    const sum = addSubjects.reduce((acc, sub) => acc + (parseInt(addMarks[sub] || '0', 10) || 0), 0);
    setAddTotal(sum ? sum.toString() : '');
  }, [addMarks, addSubjects]);

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

  const openAddModal = () => {
    setModalMode('add');
    setModalResult(null);
    setFormState({});
    setShowResultModal(true);
  };
  const openEditModal = (result: ResultRow) => {
    setModalMode('edit');
    setModalResult(result);
    setFormState(result);
    setShowResultModal(true);
  };
  const openDeleteConfirm = (id: string) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };
  const closeModals = () => {
    setShowResultModal(false);
    setShowDeleteConfirm(false);
    setModalResult(null);
    setDeleteId(null);
    setFormState({});
  };
  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        await axios.post(`${BACKEND_URL}/results`, formState);
        toast({ title: 'Result added!' });
      } else if (modalMode === 'edit' && modalResult?.id) {
        await axios.put(`${BACKEND_URL}/results/${modalResult.id}`, formState);
        toast({ title: 'Result updated!' });
      }
      closeModals();
      fetchResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to save result.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`${BACKEND_URL}/results/${deleteId}`);
      toast({ title: 'Result deleted!' });
      closeModals();
      fetchResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to delete result.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addClass || !selectedStudent || !(isAddingNewExam ? addExamName : addExam)) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Class, student, and exam are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const subjectsObj: Record<string, string> = {};
      addSubjects.forEach(sub => subjectsObj[sub] = addMarks[sub] || '');
      const payload = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        class: addClass,
        exam: isAddingNewExam ? addExamName : addExam,
        subjects: subjectsObj,
        total: addTotal,
        rank: addRank
      };
      await axios.post(`${BACKEND_URL}/results`, payload);
      toast({ title: 'Result added!' });
      setShowResultModal(false);
      setAddClass('');
      setSelectedStudent(null);
      setAddExam('');
      setAddSubjects([]);
      setAddMarks({});
      setAddRank('');
      setAddTotal('');
      setIsAddingNewExam(false);
      setAddExamName('');
      fetchResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to add result.' });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {user && (user.role === 'admin' || user.role === 'staff') && (
            <Button className="bg-green-600 text-white px-3 py-1 rounded" onClick={openAddModal}>Add Result</Button>
          )}
        </div>
        <ResultsTable parsedResults={results} loadingResults={loadingResults} openEditModal={openEditModal} openDeleteConfirm={openDeleteConfirm} />
      </div>
      {showResultModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full h-full flex items-center justify-center">
            <form
              onSubmit={modalMode === 'add' ? handleAddResult : handleResultSubmit}
              className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl mx-2 p-4 sm:p-6 flex flex-col gap-4 overflow-y-auto max-h-[90vh]"
              style={{ minWidth: 0 }}
            >
              <h2 className="text-xl font-bold mb-2 text-center">{modalMode === 'add' ? 'Add Result' : 'Edit Result'}</h2>
              <div className="flex flex-col gap-2">
                {modalMode === 'add' ? (
                  <>
                    <label className="text-sm font-medium">Class</label>
                    <select className="border p-2 rounded" value={addClass} onChange={e => { setAddClass(e.target.value); setAddExam(''); setSelectedStudent(null); }} required>
                      <option value="">Select Class</option>
                      {CLASSES.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                    <label className="text-sm font-medium">Student</label>
                    <select className="border p-2 rounded" value={selectedStudent?.id || ''} onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value))} required disabled={!addClass}>
                      <option value="">Select Student</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>{student.name} ({student.id})</option>
                      ))}
                    </select>
                    {selectedStudent && (
                      <>
                        <label className="text-sm font-medium">Exam</label>
                        <select className="border p-2 rounded" value={addExam} onChange={e => {
                          if (e.target.value === '__add_new__') {
                            setAddExam('');
                            setIsAddingNewExam(true);
                          } else {
                            setAddExam(e.target.value);
                            setIsAddingNewExam(false);
                            setAddExamName('');
                          }
                        }} required>
                          <option value="">Select Exam</option>
                          {availableExams.map(exam => (
                            <option key={exam} value={exam}>{exam}</option>
                          ))}
                          <option value="__add_new__">+ Add new</option>
                        </select>
                        {isAddingNewExam && (
                          <input className="border p-2 rounded mt-2" placeholder="New exam name" value={addExamName} onChange={e => setAddExamName(e.target.value)} required />
                        )}
                      </>
                    )}
                    {addSubjects.length > 0 ? (
                      addSubjects.map(subject => (
                        <div key={subject} className="flex items-center gap-2">
                          <label className="w-24">{subject}</label>
                          <input
                            className="border p-2 rounded flex-1"
                            type="number"
                            min="0"
                            max="100"
                            value={addMarks[subject] || ''}
                            onChange={e => setAddMarks(m => ({ ...m, [subject]: e.target.value }))}
                            required
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No subjects found for this class/exam.</div>
                    )}
                    <input className="border p-2 rounded" placeholder="Total" value={addTotal} disabled readOnly />
                    <input className="border p-2 rounded" placeholder="Rank" value={addRank} onChange={e => setAddRank(e.target.value)} required />
                  </>
                ) : (
                  <>
                    {formState.subjects && Object.keys(formState.subjects).length > 0 ? (
                      Object.entries(formState.subjects).map(([subject, mark]) => (
                        <div key={subject} className="flex items-center gap-2">
                          <label className="w-24">{subject}</label>
                          <input
                            className="border p-2 rounded flex-1"
                            type="number"
                            min="0"
                            max="100"
                            value={mark || ''}
                            onChange={e => setFormState(f => ({
                              ...f,
                              subjects: { ...f.subjects, [subject]: e.target.value }
                            }))}
                            required
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No subjects found for this result.</div>
                    )}
                    <input className="border p-2 rounded" placeholder="Total" value={formState.total || ''} disabled readOnly />
                    <input className="border p-2 rounded" placeholder="Rank" value={formState.rank || ''} onChange={e => setFormState(f => ({ ...f, rank: e.target.value }))} required />
                  </>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <Button type="submit" className="flex-1 bg-blue-600 text-white" disabled={isSubmitting}>{modalMode === 'add' ? 'Add' : 'Update'}</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={closeModals}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-xs mx-2">
            <h2 className="text-lg font-bold mb-2">Confirm Delete</h2>
            <p>Are you sure you want to delete this result?</p>
            <div className="flex gap-2 mt-4">
              <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>Delete</Button>
              <Button variant="outline" onClick={closeModals}>Cancel</Button>
            </div>
          </div>
        </div>
        )}
    </div>
  );
};

export default SchoolResult;