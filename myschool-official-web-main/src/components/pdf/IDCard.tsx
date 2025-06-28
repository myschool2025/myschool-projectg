import React from 'react';

const getAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return window.location.origin + url;
  return url;
};

interface IDCardProps {
  students: {
    name: string;
    class: string;
    id: string;
    photoUrl?: string;
    section?: string;
    shift?: string;
  }[];
  schoolName: string;
  schoolLogoUrl?: string;
}

const IDCard: React.FC<IDCardProps> = ({ students, schoolName, schoolLogoUrl }) => {
  return (
    <div className="w-full grid grid-cols-3 gap-3 p-4">
      {students.map((student, idx) => (
        <div
          key={idx}
          className="id-card flex flex-col items-center p-3 relative bg-white border border-blue-700 rounded-lg shadow-sm"
          style={{ width: 200, height: 300, pageBreakInside: 'avoid' }}
        >
          <div className="flex flex-col items-center mb-1">
            {schoolLogoUrl && (
              <img
                src={getAbsoluteUrl(schoolLogoUrl)}
                alt="School Logo"
                className="h-10 w-10 rounded-full border mb-1"
                style={{ background: '#fff' }}
              />
            )}
            <div className="text-blue-800 font-bold text-sm text-center leading-tight">{schoolName}</div>
            <div className="text-[10px] text-blue-600 font-semibold">Student ID Card</div>
          </div>
          <div className="flex flex-col items-center mb-1">
            {student.photoUrl && (
              <img
                src={getAbsoluteUrl(student.photoUrl)}
                alt="Student"
                className="h-16 w-16 rounded-lg border mb-1"
                style={{ background: '#fff' }}
              />
            )}
            <div className="text-xs font-semibold">{student.name}</div>
            <div className="text-[10px]">Class: {student.class}</div>
            <div className="text-[10px]">ID: {student.id}</div>
            {student.section && <div className="text-[10px]">Section: {student.section}</div>}
            {student.shift && <div className="text-[10px]">Shift: {student.shift}</div>}
          </div>
          <div className="flex-1" />
          <div className="w-full flex flex-col items-center mt-1">
            <div className="w-20 border-t border-blue-400 mb-1" />
            <div className="text-[10px] text-blue-700">Principal's Signature</div>
          </div>
          <div className="absolute bottom-1 left-2 text-[8px] text-gray-400">Powered by MySchool Official</div>
        </div>
      ))}
    </div>
  );
};

export default IDCard;
export { IDCard };