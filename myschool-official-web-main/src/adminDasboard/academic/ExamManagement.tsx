import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
// @ts-ignore
import classesData from '@/lib/classes.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const CLASSES = (classesData as any[]).map(cls => cls.name);

interface ExamConfig {
  id: string;
  class: string;
  exam: string;
  subjects: string[];
}

interface Student {
  id: string;
  name: string;
  class: string;
}

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

const ResultsTable: React.FC<{
  parsedResults: ResultRow[];
  loadingResults: boolean;
  onEditResult: (result: ResultRow) => void;
  onDeleteResult: (id: string) => void;
}> = React.memo(({ parsedResults, loadingResults, onEditResult, onDeleteResult }) => {
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
          ) : parsedResults.map(result => (
            <tr key={result.id} className="hover:bg-gray-50">
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
                <span className="inline-block bg-blue-100 text-blue-800 rounded px-2 py-0.5 font-bold">{result.rank}</span>
              </td>
              <td className="border px-2 py-1">
                <Button variant="outline" size="sm" className="mr-2" onClick={() => onEditResult(result)}>Edit</Button>
                <Button variant="destructive" size="sm" onClick={() => onDeleteResult(result.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

const ExamManagement: React.FC = () => {
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState('');
  const [examName, setExamName] = useState('');
  const [subjectInput, setSubjectInput] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [configs, setConfigs] = useState<ExamConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedExam, setSelectedExam] = useState('');
  const [marks, setMarks] = useState<{ [subject: string]: string }>({});
  const [rank, setRank] = useState('');
  const [total, setTotal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableExams, setAvailableExams] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [customSubjects, setCustomSubjects] = useState<string[]>([]);
  const [tab, setTab] = useState<'exam' | 'result' | 'results'>('exam');
  const [results, setResults] = useState<ResultRow[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultClass, setResultClass] = useState('');
  const [resultExam, setResultExam] = useState('');
  const [editingConfig, setEditingConfig] = useState<ExamConfig | null>(null);
  const [editingResult, setEditingResult] = useState<ResultRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 10;

  // Fetch configs
  useEffect(() => {
    setLoading(true);
    axios.get(`${BACKEND_URL}/exam-configs`)
      .then(res => setConfigs(res.data.configs || []))
      .catch(() => setConfigs([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch students
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSelectedStudent(null);
      return;
    }
    axios.get(`${BACKEND_URL}/students`, { params: { class: selectedClass, limit: 1000 } })
      .then(res => setStudents(res.data.students || []))
      .catch(() => setStudents([]));
  }, [selectedClass]);

  // Calculate total
  useEffect(() => {
    const sum = (availableSubjects.length > 0 ? availableSubjects : customSubjects)
      .reduce((acc, sub) => acc + (parseInt(marks[sub] || '0', 10) || 0), 0);
    setTotal(sum ? sum.toString() : '');
  }, [marks, availableSubjects, customSubjects]);

  // Update available exams
  useEffect(() => {
    const exams = configs.filter(cfg => cfg.class === selectedClass || cfg.class === resultClass).map(cfg => cfg.exam);
    setAvailableExams([...new Set(exams)]);
    if (!exams.includes(selectedExam)) setSelectedExam('');
    if (!exams.includes(resultExam)) setResultExam('');
  }, [selectedClass, resultClass, configs]);

  // Update available subjects
  useEffect(() => {
    if (selectedClass && selectedExam) {
      const config = configs.find(cfg => cfg.class === selectedClass && cfg.exam === selectedExam);
      setAvailableSubjects(config ? config.subjects : []);
      if (!editingResult) {
        setCustomSubjects([]);
        setMarks({});
      }
    }
  }, [selectedClass, selectedExam, configs, editingResult]);

  // Fetch results with pagination
  const fetchResults = useCallback(async () => {
    setLoadingResults(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: resultsPerPage.toString(),
      };
      if (resultClass) params.class = resultClass;
      if (resultExam) params.exam = resultExam;
      const res = await axios.get(`${BACKEND_URL}/results`, { params });
      setResults(res.data.results || []);
      setTotalPages(Math.ceil((res.data.total || 0) / resultsPerPage));
    } catch {
      setResults([]);
      setTotalPages(1);
    } finally {
      setLoadingResults(false);
    }
  }, [currentPage, resultClass, resultExam]);

  useEffect(() => {
    if (tab === 'results') {
      fetchResults();
    }
  }, [tab, fetchResults]);

  const handleAddSubject = () => {
    if (subjectInput && !subjects.includes(subjectInput)) {
      setSubjects([...subjects, subjectInput]);
      setSubjectInput('');
    }
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjects(subjects.filter(s => s !== sub));
  };

  const handleSaveConfig = async () => {
    if (!selectedClass || !examName || subjects.length === 0) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Class, exam, and at least one subject are required.' });
      return;
    }
    setLoading(true);
    try {
      if (editingConfig) {
        await axios.put(`${BACKEND_URL}/exam-configs/${editingConfig.id}`, {
          class: selectedClass,
          exam: examName,
          subjects
        });
        toast({ title: 'Exam config updated!' });
      } else {
        await axios.post(`${BACKEND_URL}/exam-configs`, {
          class: selectedClass,
          exam: examName,
          subjects
        });
        toast({ title: 'Exam config saved!' });
      }
      setSubjects([]);
      setExamName('');
      setSelectedClass('');
      setEditingConfig(null);
      const res = await axios.get(`${BACKEND_URL}/exam-configs`);
      setConfigs(res.data.configs || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to save config.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditConfig = (config: ExamConfig) => {
    setEditingConfig(config);
    setSelectedClass(config.class);
    setExamName(config.exam);
    setSubjects(config.subjects);
  };

  const handleDeleteConfig = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this exam configuration?')) return;
    setLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/exam-configs/${id}`);
      toast({ title: 'Exam config deleted!' });
      const res = await axios.get(`${BACKEND_URL}/exam-configs`);
      setConfigs(res.data.configs || []);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to delete config.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setSelectedClass(student.class);
  };

  const handleMarkChange = (subject: string, value: string) => {
    if (/^\d{0,3}$/.test(value)) {
      setMarks(prev => ({ ...prev, [subject]: value }));
    }
  };

  const handleSubmitResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedClass || !selectedExam) {
      toast({ variant: 'destructive', title: 'Missing fields', description: 'Student, class, and exam are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const dynamicSubjects = availableSubjects.length > 0 ? availableSubjects : customSubjects;
      const subjectsObj: Record<string, string> = {};
      dynamicSubjects.forEach(sub => subjectsObj[sub] = marks[sub] || '');
      const payload = {
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        class: selectedClass,
        exam: selectedExam,
        subjects: subjectsObj,
        total,
        rank
      };
      if (editingResult) {
        await axios.put(`${BACKEND_URL}/results/${editingResult.id}`, payload);
        toast({ title: 'Result updated!' });
      } else {
        await axios.post(`${BACKEND_URL}/results`, payload);
        toast({ title: 'Result added!' });
      }
      setMarks({});
      setRank('');
      setSelectedStudent(null);
      setSelectedClass('');
      setSelectedExam('');
      setCustomSubjects([]);
      setEditingResult(null);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to add result.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditResult = (result: ResultRow) => {
    setTab('result');
    setEditingResult(result);
    setSelectedClass(result.class);
    setSelectedExam(result.exam);
    setSelectedStudent({ id: result.studentId, name: result.studentName, class: result.class });
    setMarks(result.subjects);
    setRank(result.rank);
    setTotal(result.total);
  };

  const handleDeleteResult = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    setIsSubmitting(true);
    try {
      await axios.delete(`${BACKEND_URL}/results/${id}`);
      toast({ title: 'Result deleted!' });
      fetchResults();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Error', description: err?.response?.data?.error || 'Failed to delete result.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubjectInline = () => {
    if (subjectInput && !customSubjects.includes(subjectInput)) {
      setCustomSubjects([...customSubjects, subjectInput]);
      setSubjectInput('');
    }
  };

  const handleRemoveSubjectInline = (sub: string) => {
    setCustomSubjects(customSubjects.filter(s => s !== sub));
    setMarks(prev => {
      const copy = { ...prev };
      delete copy[sub];
      return copy;
    });
  };

  const generateResultsPDF = useCallback((rows: ResultRow[], title = 'Exam Results') => {
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
                <td>${Object.entries(result.subjects || []).filter(([_, mark]) => mark).map(([sub, mark]) => `${sub}: ${mark}`).join(', ')}</td>
                <td>${result.total}</td>
                <td>${result.rank}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated by MySchool Official Website • https://myschool-official.netlify.app</p>
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
      th, td { padding: 10px; text-align: left; border: 1px solid #ddd; font-size: 13px; }
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const dynamicSubjects = availableSubjects.length > 0 ? availableSubjects : customSubjects;

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex gap-2 mb-4">
        <Button className={`px-4 py-2 rounded ${tab === 'exam' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('exam')}>Exam Settings</Button>
        <Button className={`px-4 py-2 rounded ${tab === 'result' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('result')}>Result Publish</Button>
        <Button className={`px-4 py-2 rounded ${tab === 'results' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`} onClick={() => setTab('results')}>Results</Button>
      </div>
      {tab === 'exam' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Exam & Subject Management</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Class</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">{selectedClass || 'Select Class'}</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {CLASSES.map(cls => (
                    <DropdownMenuItem key={cls} onClick={() => { setSelectedClass(cls); setSelectedStudent(null); setSelectedExam(''); }}>{cls}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Exam Name</label>
              <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="Exam name" className="w-full" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Subjects</label>
            <div className="flex gap-2 mb-2">
              <Input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Add subject" className="w-40" />
              <Button type="button" onClick={handleAddSubject}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.map(sub => (
                <span key={sub} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                  {sub}
                  <button type="button" onClick={() => handleRemoveSubject(sub)} className="ml-1 text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
          <Button onClick={handleSaveConfig} disabled={loading}>{loading ? 'Saving...' : editingConfig ? 'Update Config' : 'Save Config'}</Button>
          <hr className="my-6" />
          <h3 className="text-lg font-semibold mb-2">Existing Configurations</h3>
          {configs.length === 0 ? (
            <div>No configs found.</div>
          ) : (
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border px-2 py-1">Class</th>
                  <th className="border px-2 py-1">Exam</th>
                  <th className="border px-2 py-1">Subjects</th>
                  <th className="border px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {configs.map(cfg => (
                  <tr key={cfg.id}>
                    <td className="border px-2 py-1">{cfg.class}</td>
                    <td className="border px-2 py-1">{cfg.exam}</td>
                    <td className="border px-2 py-1">{cfg.subjects.join(', ')}</td>
                    <td className="border px-2 py-1">
                      <Button variant="outline" size="sm" className="mr-2" onClick={() => handleEditConfig(cfg)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteConfig(cfg.id)}>Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {tab === 'result' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Result Publish</h2>
          <form onSubmit={handleSubmitResult} className="bg-white rounded shadow p-4 mb-8">
            <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-medium mb-1">Class</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{selectedClass || 'Select Class'}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {CLASSES.map(cls => (
                      <DropdownMenuItem key={cls} onClick={() => { setSelectedClass(cls); setSelectedStudent(null); setSelectedExam(''); }}>{cls}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {selectedClass && (
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-medium mb-1">Student</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">{selectedStudent ? selectedStudent.name : 'Select Student'}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-h-60 overflow-y-auto w-56">
                      {students.map(student => (
                        <DropdownMenuItem key={student.id} onClick={() => handleStudentSelect(student)}>
                          {student.name} <span className="ml-2 text-xs text-muted-foreground">({student.class})</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
              <div className="flex-1 min-w-[140px]">
                <label className="block text-sm font-medium mb-1">Exam</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">{selectedExam || 'Select Exam'}</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {availableExams.map(exam => (
                      <DropdownMenuItem key={exam} onClick={() => setSelectedExam(exam)}>{exam}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-4">
              {dynamicSubjects.map(subject => (
                <div key={subject} className="flex-1 min-w-[120px]">
                  <label className="block text-sm font-medium mb-1">{subject}</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={marks[subject] || ''}
                    onChange={e => handleMarkChange(subject, e.target.value)}
                    placeholder="0"
                    className="w-full"
                  />
                </div>
              ))}
              {availableSubjects.length === 0 && (
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium mb-1">Add Subject</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={subjectInput} onChange={e => setSubjectInput(e.target.value)} placeholder="Subject name" className="w-full" />
                    <Button type="button" onClick={handleAddSubjectInline}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {customSubjects.map(sub => (
                      <span key={sub} className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                        {sub}
                        <button type="button" onClick={() => handleRemoveSubjectInline(sub)} className="ml-1 text-red-500">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium mb-1">Total</label>
                <Input value={total} disabled className="w-full" />
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-sm font-medium mb-1">Rank</label>
                <Input value={rank} onChange={e => setRank(e.target.value)} placeholder="Rank" className="w-full" />
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">{isSubmitting ? 'Submitting...' : editingResult ? 'Update Result' : 'Publish Result'}</Button>
          </form>
        </div>
      )}
      {tab === 'results' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Results</h2>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Class</label>
              <select value={resultClass} onChange={e => { setResultClass(e.target.value); setResultExam(''); setCurrentPage(1); }} className="w-full border rounded p-2">
                <option value="">All Classes</option>
                {CLASSES.map((cls, index) => <option key={index} value={cls}>{cls}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-sm font-medium mb-1">Exam</label>
              <select value={resultExam} onChange={e => { setResultExam(e.target.value); setCurrentPage(1); }} className="w-full border rounded p-2" disabled={!resultClass}>
                <option value="">All Exams</option>
                {availableExams.map((exam, index) => <option key={index} value={exam}>{exam}</option>)}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto rounded shadow bg-white">
            <div className="flex flex-col sm:flex-row justify-between items-center p-2 gap-2">
              <span className="font-semibold">Results</span>
              <Button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                onClick={() => generateResultsPDF(results)}
                disabled={results.length === 0}
              >
                Download PDF
              </Button>
            </div>
            <ResultsTable
              parsedResults={results}
              loadingResults={loadingResults}
              onEditResult={handleEditResult}
              onDeleteResult={handleDeleteResult}
            />
            <div className="flex justify-center items-center gap-2 p-4">
              <Button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2"
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagement;