import React, { useEffect, useState, useRef } from 'react';
import AdmitCard from '@/components/pdf/AdmitCard';
import IDCard from '@/components/pdf/IDCard';
import ResultCard from '@/components/pdf/ResultCard';
import SeatPlan from '@/components/pdf/SeatPlan';
import html2pdf from 'html2pdf.js';
import classesList from '@/lib/classes.json';
import axios from 'axios';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

const SCHOOL_NAME = 'MySchool Official';
const SCHOOL_LOGO = '/public/my-school-logo.jpg';

const PDF_TYPES = [
  { value: 'result', label: 'Result Card' },
  { value: 'admit', label: 'Admit Card' },
  { value: 'seat', label: 'Exam Seat Plan' },
  { value: 'id', label: 'ID Card' },
];

const fetchStudents = async (className = '') => {
  try {
    const params = className ? { class: className, limit: 1000 } : { limit: 1000 };
    const res = await axios.get(`${BACKEND_URL}/students`, { params });
    return res.data.students || [];
  } catch (e) {
    return [];
  }
};

const fetchResults = async (studentId = '', exam = '') => {
  try {
    const params: any = {};
    if (studentId) params.studentId = studentId;
    if (exam) params.exam = exam;
    const res = await axios.get(`${BACKEND_URL}/results`, { params });
    return res.data.results || [];
  } catch (e) {
    return [];
  }
};

const fetchExamConfigs = async (className = '') => {
  try {
    const res = await axios.get(`${BACKEND_URL}/exam-configs`);
    let configs = res.data.configs || [];
    if (className) configs = configs.filter((c) => c.class === className);
    return configs;
  } catch (e) {
    return [];
  }
};

const getAbsoluteUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return window.location.origin + url;
  return url;
};

const preloadImages = async (urls) => {
  const promises = urls.filter(Boolean).map(
    (url) =>
      new Promise((resolve) => {
        const img = new window.Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = getAbsoluteUrl(url);
      })
  );
  await Promise.all(promises);
};

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const PDFGenerator = () => {
  const [pdfType, setPdfType] = useState('result');
  const [className, setClassName] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [exam, setExam] = useState('');
  const [exams, setExams] = useState([]);
  const [room, setRoom] = useState('');
  const [loading, setLoading] = useState(false);
  const pdfRef = useRef(null);

  useEffect(() => {
    if (className) {
      setLoading(true);
      fetchStudents(className).then((sts) => {
        setStudents(sts);
        setSelectedStudents([]);
        setLoading(false);
      });
      fetchExamConfigs(className).then((cfgs) => {
        const allExams = Array.from(new Set(cfgs.map((c) => c.exam)));
        setExams(allExams);
      });
    }
  }, [className]);

  const handleStudentSelect = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleGeneratePDF = async () => {
    if (!pdfRef.current) return;
    const allStudentObjs = pdfType === 'seat' ? seatPlanStudents : selectedStudentObjs;
    const imageUrls = [SCHOOL_LOGO, ...allStudentObjs.map((s) => s.photoUrl).filter(Boolean)];
    await preloadImages(imageUrls);
    pdfRef.current.classList.add('pdf-mode');
    html2pdf()
      .set({
        margin: [0.4, 0.4, 0.4, 0.4],
        filename: `${pdfType}-cards.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#fff' },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      })
      .from(pdfRef.current)
      .save()
      .finally(() => {
        pdfRef.current.classList.remove('pdf-mode');
      });
  };

  const selectedStudentObjs = students.filter((s) => selectedStudents.includes(s.id));

  const [results, setResults] = useState({});
  useEffect(() => {
    if (pdfType === 'result' && selectedStudentObjs.length > 0 && exam) {
      setLoading(true);
      Promise.all(
        selectedStudentObjs.map(async (student) => {
          const resArr = await fetchResults(student.id, exam);
          return { id: student.id, result: resArr[0] };
        })
      ).then((resArr) => {
        const resMap = {};
        resArr.forEach(({ id, result }) => {
          resMap[id] = result;
        });
        setResults(resMap);
        setLoading(false);
      });
    }
  }, [pdfType, selectedStudents, exam]);

  const seatPlanStudents = selectedStudentObjs.map((s, i) => ({ ...s, seat: (i + 1).toString() }));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Cards & Certificates Generator</h1>
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block font-semibold mb-1">PDF Type</label>
          <select
            value={pdfType}
            onChange={(e) => setPdfType(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {PDF_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Class</label>
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">Select Class</option>
            {classesList.map((cls) => (
              <option key={cls.id} value={cls.name}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        {(pdfType === 'result' || pdfType === 'admit' || pdfType === 'seat') && (
          <div>
            <label className="block font-semibold mb-1">Exam</label>
            <select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">Select Exam</option>
              {exams.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
        )}
        {pdfType === 'seat' && (
          <div>
            <label className="block font-semibold mb-1">Room</label>
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="Room No."
            />
          </div>
        )}
      </div>
      <div className="mb-4">
        <label className="block font-semibold mb-1">Select Students</label>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {(pdfType === 'admit' || pdfType === 'seat') && students.length > 0 && (
              <button
                className="mb-2 px-3 py-1 bg-blue-500 text-white rounded shadow hover:bg-blue-600"
                onClick={() => setSelectedStudents(students.map((s) => s.id))}
              >
                Select All Students
              </button>
            )}
            <div className="max-h-48 overflow-y-auto border rounded p-2 grid grid-cols-2 gap-2">
              {students.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={() => handleStudentSelect(s.id)}
                  />
                  <span>
                    {s.name} ({s.class})
                  </span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
      <button
        onClick={handleGeneratePDF}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
      >
        Download PDF
      </button>
      <div className="mt-8 flex justify-center">
        <div
          className="a4-preview"
          style={{
            width: '210mm',
            height: '297mm',
            background: '#fff',
            boxSizing: 'border-box',
            overflow: 'hidden',
            position: 'relative',
            margin: '0 auto',
            padding: 0,
            display: 'block',
          }}
          ref={pdfRef}
          id="pdf-preview"
        >
          <style>{`
            .a4-preview {
              background: #fff !important;
              color: #222 !important;
              width: 210mm !important;
              height: 297mm !important;
              box-sizing: border-box !important;
              overflow: hidden !important;
              margin: 0 auto !important;
              padding: 0 !important;
              position: relative !important;
            }
            .card-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: repeat(3, 1fr);
              gap: 0;
              width: 100%;
              height: 100%;
              page-break-after: always;
            }
            .admit-card, .seat-card {
              width: 90mm !important;
              height: 45mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              border: 1px solid #bbb !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            .id-card {
              width: 90mm !important;
              height: 55mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              border: 1px solid #bbb !important;
              box-sizing: border-box !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              align-items: center !important;
            }
            .result-card {
              width: 100% !important;
              min-height: 100mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #fff !important;
              border: 1px solid #bbb !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
            }
            @media (max-width: 900px) {
              .a4-preview {
                width: 100vw !important;
                height: auto !important;
                min-height: 100vh !important;
              }
              .card-grid {
                grid-template-columns: 1fr !important;
                grid-template-rows: none !important;
              }
            }
          `}</style>
          {/* PDF Preview */}
          {pdfType === 'result' && chunkArray(selectedStudentObjs, 1).map((chunk, pageIdx) => (
            <div key={pageIdx} className="result-card">
              <ResultCard
                student={chunk[0]}
                result={results[chunk[0].id] ? {
                  exam: results[chunk[0].id].exam,
                  subjects: Object.entries(results[chunk[0].id].subjects || {}).map(([subject, mark]) => ({ subject, mark: String(mark) })),
                  total: results[chunk[0].id].total,
                  rank: results[chunk[0].id].rank,
                } : { exam, subjects: [], total: '', rank: '' }}
                schoolName={SCHOOL_NAME}
                schoolLogoUrl={SCHOOL_LOGO}
              />
            </div>
          ))}
          {pdfType === 'admit' && chunkArray(selectedStudentObjs, 6).map((chunk, pageIdx) => (
            <div key={pageIdx} className="card-grid">
              {chunk.map((student) => (
                <div key={student.id} className="admit-card">
                  <AdmitCard
                    students={[student]}
                    exam={exam}
                    schoolName={SCHOOL_NAME}
                    schoolLogoUrl={SCHOOL_LOGO}
                  />
                </div>
              ))}
            </div>
          ))}
          {pdfType === 'seat' && chunkArray(seatPlanStudents, 6).map((chunk, pageIdx) => (
            <div key={pageIdx} className="card-grid">
              {chunk.map((student) => (
                <div key={student.id} className="seat-card">
                  <SeatPlan
                    students={[student]}
                    exam={exam}
                    room={room}
                    schoolName={SCHOOL_NAME}
                    schoolLogoUrl={SCHOOL_LOGO}
                  />
                </div>
              ))}
            </div>
          ))}
          {pdfType === 'id' && chunkArray(selectedStudentObjs, 6).map((chunk, pageIdx) => (
            <div key={pageIdx} className="card-grid">
              {chunk.map((student) => (
                <div key={student.id} className="id-card">
                  <IDCard
                    students={[student]}
                    schoolName={SCHOOL_NAME}
                    schoolLogoUrl={SCHOOL_LOGO}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;