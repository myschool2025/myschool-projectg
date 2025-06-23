import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash, Edit, X, Settings, Download, Phone, Mail, BookOpen, Calendar, Droplet, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';

// Explicitly declare interface for TypeScript
export interface Teacher {
  id?: string;
  staffId: string;
  nameBangla: string;
  nameEnglish: string;
  subject: string;
  designation: string;
  joiningDate: string;
  nid: string;
  mobile: string;
  salary: number;
  email: string;
  address: string;
  bloodGroup: string;
  workingDays: number;
  photoUrl: string;
}

const TeachersPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editTeacher, setEditTeacher] = useState<Teacher | null>(null);
  const [operationStatus, setOperationStatus] = useState<'idle' | 'saving' | 'updating' | 'deleting' | 'uploading'>('idle');
  const [visibleFields, setVisibleFields] = useState(() => {
    const savedFields = localStorage.getItem('visibleFields');
    return savedFields
      ? JSON.parse(savedFields)
      : {
        nameBangla: true,
        nameEnglish: true,
        subject: true,
        designation: true,
        joiningDate: true,
        nid: true,
        mobile: true,
        salary: true,
        email: true,
        address: true,
        bloodGroup: true,
        workingDays: true,
        photoUrl: true,
      };
  });

  useEffect(() => {
    localStorage.setItem('visibleFields', JSON.stringify(visibleFields));
  }, [visibleFields]);

  // Fetch staff from Firestore
  const fetchTeachers = async () => {
    const querySnapshot = await getDocs(collection(db, 'staff'));
    const teachers: Teacher[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Teacher[];
    return teachers;
  };

  const { data: teachers = [], isLoading, error } = useQuery({
    queryKey: ['teachers'],
    queryFn: fetchTeachers,
  });

  const formatDateBD = useCallback((dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? 'Invalid Date'
      : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }, []);

  // Image upload to ImgBB
  const uploadImageToImgBB = async (file: File): Promise<string> => {
    const IMAGE_HOST_KEY = import.meta.env.VITE_IMGBB_API_KEY;
    if (!IMAGE_HOST_KEY) throw new Error('ImgBB API key not configured');
    const formData = new FormData();
    formData.append('image', file);
    setOperationStatus('uploading');
    try {
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMAGE_HOST_KEY}`, {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Error uploading image to ImgBB');
      const data = await response.json();
      return data.data.url;
    } finally {
      setOperationStatus('idle');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (operationStatus !== 'idle') return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const photoUrl = await uploadImageToImgBB(file);
      setEditTeacher(prev => (prev ? { ...prev, photoUrl } : null));
      toast({ title: 'Success', description: 'Photo uploaded successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to upload photo' });
    }
  };

  // Save/Update teacher mutation
  const saveMutation = useMutation({
    mutationFn: async (teacher: Teacher) => {
      const { id, ...teacherData } = teacher;
      if (id) {
        const teacherRef = doc(db, 'staff', id);
        await updateDoc(teacherRef, {
          ...teacherData,
          salary: Number(teacherData.salary),
          workingDays: Number(teacherData.workingDays),
        });
      } else {
        const newDoc = await addDoc(collection(db, 'staff'), {
          ...teacherData,
          salary: Number(teacherData.salary),
          workingDays: Number(teacherData.workingDays),
        });
        await updateDoc(doc(db, 'staff', newDoc.id), { staffId: newDoc.id });
      }
    },
    onMutate: () => setOperationStatus(editTeacher?.id ? 'updating' : 'saving'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Success', description: 'Teacher saved successfully' });
      setShowAddModal(false);
      setEditTeacher(null);
      setOperationStatus('idle');
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to save teacher: ${error.message}` });
      setOperationStatus('idle');
    },
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const teacherRef = doc(db, 'staff', id);
      await deleteDoc(teacherRef);
    },
    onMutate: () => setOperationStatus('deleting'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast({ title: 'Success', description: 'Teacher deleted successfully' });
      setShowDeleteModal(null);
      setOperationStatus('idle');
    },
    onError: (error: any) => {
      toast({ variant: 'destructive', title: 'Error', description: `Failed to delete teacher: ${error.message}` });
      setOperationStatus('idle');
    },
  });

  const handleSave = () => {
    if (operationStatus !== 'idle') return;
    if (!editTeacher?.nameBangla || !editTeacher?.designation) {
      toast({ variant: 'destructive', title: 'Error', description: 'Name (Bangla) and Designation are required' });
      return;
    }
    saveMutation.mutate(editTeacher!);
  };

  // CSV export function
  const exportToCSV = (teachers: Teacher[]) => {
    const headers = [
      'Staff ID',
      'Name (Bangla)',
      'Name (English)',
      'Subject',
      'Designation',
      'Joining Date',
      'NID',
      'Mobile',
      'Salary',
      'Email',
      'Address',
      'Blood Group',
      'Working Days',
      'Photo URL',
    ];

    const rows = teachers.map(teacher => [
      teacher.staffId || '',
      teacher.nameBangla || '',
      teacher.nameEnglish || '',
      teacher.subject || '',
      teacher.designation || '',
      teacher.joiningDate ? formatDateBD(teacher.joiningDate) : '',
      teacher.nid || '',
      teacher.mobile || '',
      teacher.salary || '',
      teacher.email || '',
      teacher.address || '',
      teacher.bloodGroup || '',
      teacher.workingDays || '',
      teacher.photoUrl || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teachers_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF export function
   const exportToPDF = () => {
  const totalTeachers = teachers.length;
  const exportDate = new Date().toLocaleDateString();
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>MySchool-মাইস্কুল Staff Directory</title>
          <style>
            @media print {
              @page { margin: 0; }
              thead { display: table-header-group; }
              th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 10px;
              color: #333;
              line-height: 1.5;
            }
            .container {
              width: 100%;
              max-width: none;
              margin: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
              background-color: #f8f9fa;
            }
            .header h1 {
              color: #2c3e50;
              margin: 0;
              font-size: 24px;
              font-weight: 700;
            }
            .header p {
              color: #555;
              font-size: 12px;
              margin: 5px 0 0;
            }
            .stats {
              background: #f8f9fa;
              padding: 10px;
              border-radius: 8px;
              margin-bottom: 15px;
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              border: 1px solid #ddd;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
              margin-top: 0;
            }
            thead {
              display: table-header-group;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
              word-wrap: break-word;
              white-space: normal;
            }
            th {
              background-color: #3498db;
              color: #fff;
              font-weight: 600;
              text-transform: uppercase;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f1f1f1;
            }
            img {
              max-width: 80px;
              height: auto;
              border-radius: 4px;
              display: block;
            }
            .footer {
              margin-top: 15px;
              text-align: center;
              color: #777;
              font-size: 10px;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media (max-width: 768px) {
              table, th, td {
                font-size: 10px;
                padding: 6px;
              }
              img {
                max-width: 50px;
              }
              .header h1 {
                font-size: 20px;
              }
              .header p {
                font-size: 10px;
              }
              .stats {
                flex-direction: column;
                gap: 6px;
                font-size: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MySchool-মাইস্কুল Staff Directory</h1>
              <p>Generated on: ${exportDate}</p>
            </div>
            <div class="stats">
              <span>Total Staff: ${totalTeachers}</span>
              <span>Exported on: ${exportDate}</span>
            </div>
            <table>
              <thead>
                <tr>
                  ${visibleFieldKeys.includes('staffId') ? '<th style="width: 10%;">Staff ID</th>' : ''}
                  ${visibleFieldKeys.includes('nameBangla') ? '<th style="width: 10%;">Name (Bangla)</th>' : ''}
                  ${visibleFieldKeys.includes('nameEnglish') ? '<th style="width: 10%;">Name (English)</th>' : ''}
                  ${visibleFieldKeys.includes('designation') ? '<th style="width: 10%;">Designation</th>' : ''}
                  ${visibleFieldKeys.includes('joiningDate') ? '<th style="width: 10%;">Joining Date</th>' : ''}
                  ${visibleFieldKeys.includes('nid') ? '<th style="width: 10%;">NID</th>' : ''}
                  ${visibleFieldKeys.includes('mobile') ? '<th style="width: 10%;">Mobile</th>' : ''}
                  ${visibleFieldKeys.includes('salary') ? '<th style="width: 8%;">Salary</th>' : ''}
                  ${visibleFieldKeys.includes('email') ? '<th style="width: 10%;">Email</th>' : ''}
                  ${visibleFieldKeys.includes('address') ? '<th style="width: 12%;">Address</th>' : ''}
                  ${visibleFieldKeys.includes('bloodGroup') ? '<th style="width: 8%;">Blood Group</th>' : ''}
                  ${visibleFieldKeys.includes('photoUrl') ? '<th style="width: 10%;">Photo</th>' : ''}
                </tr>
              </thead>
              <tbody>
                ${teachers
                  .map(
                    (teacher) => `
                  <tr>
                    ${visibleFieldKeys.includes('staffId') ? `<td>${teacher.staffId || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('nameBangla') ? `<td>${teacher.nameBangla || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('nameEnglish') ? `<td>${teacher.nameEnglish || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('designation') ? `<td>${teacher.designation || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('joiningDate') ? `<td>${formatDateBD(teacher.joiningDate) || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('nid') ? `<td>${teacher.nid || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('mobile') ? `<td>${teacher.mobile || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('salary') ? `<td>৳${teacher.salary ? Number(teacher.salary).toFixed(2) : '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('email') ? `<td>${teacher.email || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('address') ? `<td>${teacher.address || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('bloodGroup') ? `<td>${teacher.bloodGroup || '-'}</td>` : ''}
                    ${visibleFieldKeys.includes('photoUrl') ? `
                      <td>
                        ${teacher.photoUrl
                          ? `<img src="${teacher.photoUrl}" alt="${teacher.nameEnglish || teacher.nameBangla || 'Staff'}'s photo" onerror="this.style.display='none';this.nextSibling.style.display='block'" /><span style="display:none">Image not available</span>`
                          : 'No photo'}
                      </td>` : ''}
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            <div class="footer">
              Generated by MySchool Official Website • https://myschool-offical.netlify.app
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

  const canCloseModal = operationStatus === 'idle';

  const fieldOrder = [
    'nameBangla',
    'nameEnglish',
    'subject',
    'designation',
    'joiningDate',
    'nid',
    'mobile',
    'salary',
    'email',
    'address',
    'bloodGroup',
    'workingDays',
    'photoUrl',
  ];

  const visibleFieldKeys = fieldOrder.filter(field => visibleFields[field]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="max-w-full sm:max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            School Staff Directory
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              onClick={() => exportToCSV(teachers)}
              disabled={operationStatus !== 'idle' || isLoading || !teachers.length}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow-sm hover:bg-green-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <Download size={18} className="mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={operationStatus !== 'idle' || isLoading || !teachers.length}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <FileText size={18} className="mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={() => setShowSettingsModal(true)}
              disabled={operationStatus !== 'idle'}
              className="flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 disabled:opacity-50 w-full sm:w-auto"
            >
              <Settings size={18} className="mr-2 text-gray-500" />
              Customize View
            </Button>
            <Button
              onClick={() => {
                setEditTeacher({
                  id: '',
                  staffId: '',
                  nameBangla: '',
                  nameEnglish: '',
                  subject: '',
                  designation: '',
                  joiningDate: '',
                  nid: '',
                  mobile: '',
                  salary: 0,
                  email: '',
                  address: '',
                  bloodGroup: '',
                  workingDays: 0,
                  photoUrl: '',
                });
                setShowAddModal(true);
              }}
              disabled={operationStatus !== 'idle'}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <Plus size={18} className="mr-2" />
              Add New Staff
            </Button>
          </div>
        </header>

        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading staff data...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">Error loading staff data: {(error as Error).message}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {teachers.map((teacher, index) => (
              <motion.div
                key={teacher.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={teacher.photoUrl || '/placeholder-avatar.png'}
                          alt={teacher.nameEnglish || teacher.nameBangla}
                          className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-sm"
                        />
                        <Button
                          onClick={async () => {
                            if (operationStatus !== 'idle') return;
                            try {
                              const response = await fetch(teacher.photoUrl!);
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `${teacher.nameEnglish || teacher.nameBangla}_photo.jpg`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              toast({ variant: 'destructive', title: 'Error', description: 'Failed to download image' });
                            }
                          }}
                          disabled={operationStatus !== 'idle'}
                          className="absolute -bottom-2 -right-2 bg-blue-100 p-1.5 rounded-full shadow-sm hover:bg-blue-200 transition-colors disabled:opacity-50"
                        >
                          <Download size={16} className="text-blue-600" />
                        </Button>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {teacher.nameEnglish || teacher.nameBangla}
                        </h2>
                        <p className="text-sm text-gray-600">{teacher.designation}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditTeacher(teacher);
                          setShowAddModal(true);
                        }}
                        disabled={operationStatus !== 'idle'}
                        className="text-gray-400 hover:text-blue-600 transition-colors bg-transparent hover:bg-transparent"
                      >
                        <Edit size={18} />
                      </Button>
                      <Button
                        onClick={() => setShowDeleteModal(teacher.id!)}
                        disabled={operationStatus !== 'idle'}
                        className="text-gray-400 hover:text-red-600 transition-colors bg-transparent hover:bg-transparent"
                      >
                        <Trash size={18} />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {visibleFields.mobile && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Phone size={16} className="text-gray-500" />
                        <a href={`tel:${teacher.mobile}`} className="text-gray-700 hover:text-blue-600">
                          {teacher.mobile || 'N/A'}
                        </a>
                      </div>
                    )}

                    {visibleFields.email && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Mail size={16} className="text-gray-500" />
                        <a href={`mailto:${teacher.email}`} className="text-gray-700 hover:text-blue-600 truncate">
                          {teacher.email || 'N/A'}
                        </a>
                      </div>
                    )}

                    {visibleFields.subject && teacher.subject && (
                      <div className="col-span-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <BookOpen size={16} className="text-gray-500" />
                        <span className="text-gray-700">{teacher.subject}</span>
                      </div>
                    )}

                    {visibleFields.joiningDate && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Calendar size={16} className="text-gray-500" />
                        <span className="text-gray-700">
                          Joined: {formatDateBD(teacher.joiningDate)}
                        </span>
                      </div>
                    )}

                    {visibleFields.bloodGroup && teacher.bloodGroup && (
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Droplet size={16} className="text-gray-500" />
                        <span className="text-gray-700">Blood Group: {teacher.bloodGroup}</span>
                      </div>
                    )}
                  </div>

                  {(visibleFields.address || visibleFields.nid || visibleFields.salary) && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Additional Information
                      </h3>
                      <div className="space-y-1 text-sm">
                        {visibleFields.address && teacher.address && (
                          <p className="text-gray-600">📍 {teacher.address}</p>
                        )}
                        {visibleFields.nid && teacher.nid && (
                          <p className="text-gray-600">🆔 NID: {teacher.nid}</p>
                        )}
                        {visibleFields.salary && teacher.salary && (
                          <p className="text-gray-600">💵 Salary: ৳{teacher.salary}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Add/Edit Staff Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editTeacher?.id ? 'Edit Staff' : 'New Staff Member'}
                  </h2>
                  <Button
                    onClick={() => canCloseModal && setShowAddModal(false)}
                    disabled={operationStatus !== 'idle'}
                    className="text-gray-500 hover:text-gray-700 transition-colors bg-transparent hover:bg-transparent"
                  >
                    <X size={24} />
                  </Button>
                </div>

                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Name (Bangla) *</label>
                      <input
                        type="text"
                        value={editTeacher?.nameBangla || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, nameBangla: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Name (English)</label>
                      <input
                        type="text"
                        value={editTeacher?.nameEnglish || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, nameEnglish: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Designation *</label>
                      <input
                        type="text"
                        value={editTeacher?.designation || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, designation: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <input
                        type="text"
                        value={editTeacher?.subject || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, subject: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Joining Date</label>
                      <input
                        type="date"
                        value={editTeacher?.joiningDate ? editTeacher.joiningDate.split('T')[0] : ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, joiningDate: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">NID</label>
                      <input
                        type="text"
                        value={editTeacher?.nid || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, nid: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Mobile</label>
                      <input
                        type="text"
                        value={editTeacher?.mobile || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, mobile: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Salary</label>
                      <input
                        type="number"
                        value={editTeacher?.salary || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, salary: Number(e.target.value) } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editTeacher?.email || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, email: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <input
                        type="text"
                        value={editTeacher?.address || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, address: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Blood Group</label>
                      <input
                        type="text"
                        value={editTeacher?.bloodGroup || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, bloodGroup: e.target.value } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Working Days</label>
                      <input
                        type="number"
                        value={editTeacher?.workingDays || ''}
                        onChange={e => setEditTeacher(prev => prev ? { ...prev, workingDays: Number(e.target.value) } : null)}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Profile Photo</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={operationStatus !== 'idle'}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-100 file:text-blue-600 file:hover:bg-blue-200 transition-colors disabled:opacity-50"
                      />
                      {editTeacher?.photoUrl && (
                        <div className="relative">
                          <img
                            src={editTeacher.photoUrl}
                            alt="Preview"
                            className="w-16 h-16 rounded-full border-4 border-white shadow-sm"
                          />
                          <Button
                            onClick={() => setEditTeacher(prev => prev ? { ...prev, photoUrl: '' } : null)}
                            disabled={operationStatus !== 'idle'}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleSave}
                    disabled={operationStatus !== 'idle'}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {operationStatus === 'saving' ? 'Saving...' :
                      operationStatus === 'updating' ? 'Updating...' :
                        operationStatus === 'uploading' ? 'Uploading...' :
                          editTeacher?.id ? 'Save Changes' : 'Add Staff Member'}
                  </Button>
                  <Button
                    onClick={() => canCloseModal && setShowAddModal(false)}
                    disabled={operationStatus !== 'idle'}
                    className="py-3 px-6 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettingsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Display Settings</h2>
                  <Button
                    onClick={() => setShowSettingsModal(false)}
                    disabled={operationStatus !== 'idle'}
                    className="text-gray-500 hover:text-gray-700 transition-colors bg-transparent hover:bg-transparent"
                  >
                    <X size={24} />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {fieldOrder.map(field => (
                    <label
                      key={field}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={visibleFields[field]}
                        onChange={e => setVisibleFields(prev => ({ ...prev, [field]: e.target.checked }))}
                        disabled={operationStatus !== 'idle'}
                        className="h-5 w-5 text-blue-600 rounded border-gray-300 disabled:opacity-50"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').replace('Url', ' URL')}
                      </span>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={() => setShowSettingsModal(false)}
                  disabled={operationStatus !== 'idle'}
                  className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  Save Preferences
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed insets-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              >
                <div className="text-center">
                  <Trash className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Staff Member?</h3>
                  <p className="text-gray-600 mb-6">
                    This action cannot be undone. All information related to this staff member will be permanently removed.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button
                      onClick={() => deleteMutation.mutate(showDeleteModal!)}
                      disabled={operationStatus !== 'idle'}
                      className="px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {operationStatus === 'deleting' ? 'Deleting...' : 'Yes, Delete'}
                    </Button>
                    <Button
                      onClick={() => setShowDeleteModal(null)}
                      disabled={operationStatus !== 'idle'}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TeachersPanel;