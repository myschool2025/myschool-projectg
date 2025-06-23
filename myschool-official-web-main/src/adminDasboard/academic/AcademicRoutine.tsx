import React, { useEffect, useState } from "react";
import { FaEdit, FaSave, FaTrash } from "react-icons/fa";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getCurrentUser } from "@/lib/auth";
import { User } from "@/lib/types";
import Loading from "@/components/loader/Loading";
import { useToast } from "@/hooks/use-toast";
import { Link } from 'react-router-dom';

const ClassRoutine = () => {
  const [routine, setRoutine] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { toast } = useToast();

  const subjectColors = {
    "আরবি মকতব": "bg-amber-100",
    "শারীরিক প্রশিক্ষণ": "bg-blue-100",
    "গণিত": "bg-green-100",
    "ইংরেজি": "bg-pink-100",
    "বিজ্ঞান": "bg-purple-100",
    "সামাজিক বিজ্ঞান": "bg-orange-100",
    "শিল্পকলা": "bg-red-100",
    "অবসর সময়": "bg-yellow-100",
    "ভাষা": "bg-teal-100",
    "সমীক্ষা": "bg-indigo-100",
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        const routineRef = doc(db, "routines", "defaultRoutine");
        const routineSnap = await getDoc(routineRef);

        if (routineSnap.exists()) {
          setRoutine(routineSnap.data());
        } else {
          const defaultRoutine = {
            schoolName: "MySchool-মাইস্কুল",
            classLevels: [
              { name: "প্লে", teacher: "শিক্ষক এ" },
              { name: "নার্সারি", teacher: "শিক্ষক বি" },
              { name: "প্রথম", teacher: "শিক্ষক সি" },
              { name: "দ্বিতীয়", teacher: "শিক্ষক ডি" },
              { name: "তৃতীয়", teacher: "শিক্ষক ই" },
              { name: "চতুর্থ", teacher: "শিক্ষক এফ" },
              { name: "পঞ্চম", teacher: "শিক্ষক জি" },
            ],
            timeSlots: [
              "8:00 - 8:40 AM",
              "8:41 - 9:05 AM",
              "9:06 - 9:46 AM",
              "9:47 - 10:27 AM",
              "10:28 - 11:08 AM",
              "11:09 - 11:41 AM",
              "11:41 - 12:00 PM",
              "12:01 - 12:36 PM",
              "12:37 - 1:12 PM",
              "1:13 - 1:48 PM",
              "1:49 - 2:24 PM",
            ],
            schedule: {
              "8:00 - 8:40 AM": Array(7).fill({ name: "আরবি মকতব", teacher: "মিস আরবি" }),
              "8:41 - 9:05 AM": Array(7).fill({ name: "শারীরিক প্রশিক্ষণ", teacher: "কোচ পিটি" }),
              "9:06 - 9:46 AM": [
                { name: "গণিত", teacher: "মি. জন" },
                { name: "গণিত", teacher: "মি. জন" },
                { name: "ইংরেজি", teacher: "মিস এমা" },
                { name: "ইংরেজি", teacher: "মিস এমা" },
                { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
                { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
                { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
              ],
              "9:47 - 10:27 AM": [
                { name: "ইংরেজি", teacher: "মিস এমা" },
                { name: "ইংরেজি", teacher: "মিস এমা" },
                { name: "গণিত", teacher: "মি. জন" },
                { name: "গণিত", teacher: "মি. জন" },
                { name: "সামাজিক বিজ্ঞান", teacher: "মি. অ্যালেক্স" },
                { name: "সামাজিক বিজ্ঞান", teacher: "মি. অ্যালেক্স" },
                { name: "সামাজিক বিজ্ঞান", teacher: "মি. অ্যালেক্স" },
              ],
              "10:28 - 11:08 AM": [
                { name: "শিল্পকলা", teacher: "মিস লিলি" },
                { name: "শিল্পকলা", teacher: "মিস লিলি" },
                { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
                { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
                { name: "গণিত", teacher: "মি. জন" },
                { name: "গণিত", teacher: "মি. জন" },
                { name: "গণিত", teacher: "মি. জন" },
              ],
              "11:09 - 11:41 AM": [
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
                { name: "ইংরেজি", teacher: "মিস এমা" },
                { name: "ইংরেজি", teacher: "মিস এমা" },
                { name: "ইংরেজি", teacher: "মিস এমা" },
              ],
              "11:41 - 12:00 PM": Array(7).fill({ name: "অবসর সময়", teacher: "-" }),
              "12:01 - 12:36 PM": [
                null,
                null,
                null,
                null,
                { name: "শিল্পকলা", teacher: "মিস লিলি" },
                { name: "শিল্পকলা", teacher: "মিস লিলি" },
                { name: "শিল্পকলা", teacher: "মিস লিলি" },
              ],
              "12:37 - 1:12 PM": [
                null,
                null,
                null,
                null,
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
                { name: "ভাষা", teacher: "মিস গার্সিয়া" },
              ],
              "1:13 - 1:48 PM": [
                null,
                null,
                null,
                null,
                { name: "সমীক্ষা", teacher: "মি. রায়ান" },
                { name: "সমীক্ষা", teacher: "মি. রায়ান" },
                { name: "সমীক্ষা", teacher: "মি. রায়ান" },
              ],
              "1:49 - 2:24 PM": [
                null,
                null,
                null,
                null,
                { name: "গণিত", teacher: "মি. জন" },
                { name: "গণিত", teacher: "মি. জন" },
                { name: "গণিত", teacher: "মি. জন" },
              ],
            },
          };
          await setDoc(routineRef, defaultRoutine);
          setRoutine(defaultRoutine);
        }
      } catch (error) {
        console.error("Error initializing routine:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load routine data.",
        });
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [toast]);

  const saveRoutine = async () => {
    if (user?.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only admins can edit the routine.",
      });
      return;
    }
    try {
      const routineRef = doc(db, "routines", "defaultRoutine");
      await setDoc(routineRef, routine);
      toast({
        title: "Success",
        description: "Routine saved successfully.",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving routine:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save routine.",
      });
    }
  };

  const resetRoutine = async () => {
    if (user?.role !== "admin") {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only admins can reset the routine.",
      });
      return;
    }
    try {
      const routineRef = doc(db, "routines", "defaultRoutine");
      const defaultRoutine = {
        schoolName: "MySchool-মাইস্কুল",
        classLevels: [
          { name: "প্লে", teacher: "শিক্ষক এ" },
          { name: "নার্সারি", teacher: "শিক্ষক বি" },
          { name: "প্রথম", teacher: "শিক্ষক সি" },
          { name: "দ্বিতীয়", teacher: "শিক্ষক ডি" },
          { name: "তৃতীয়", teacher: "শিক্ষক ই" },
          { name: "চতুর্থ", teacher: "শিক্ষক এফ" },
          { name: "পঞ্চম", teacher: "শিক্ষক জি" },
        ],
        timeSlots: [
          "8:00 - 8:40 AM",
          "8:41 - 9:05 AM",
          "9:06 - 9:46 AM",
          "9:47 - 10:27 AM",
          "10:28 - 11:08 AM",
          "11:09 - 11:41 AM",
          "11:41 - 12:00 PM",
          "12:01 - 12:36 PM",
          "12:37 - 1:12 PM",
          "1:13 - 1:48 PM",
          "1:49 - 2:24 PM",
        ],
        schedule: {
          "8:00 - 8:40 AM": Array(7).fill({ name: "আরবি মকতব", teacher: "মিস আরবি" }),
          "8:41 - 9:05 AM": Array(7).fill({ name: "শারীরিক প্রশিক্ষণ", teacher: "কোচ পিটি" }),
          "9:06 - 9:46 AM": [
            { name: "গণিত", teacher: "মি. জন" },
            { name: "গণিত", teacher: "মি. জন" },
            { name: "ইংরেজি", teacher: "মিস এমা" },
            { name: "ইংরেজি", teacher: "মিস এমা" },
            { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
            { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
            { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
          ],
          "9:47 - 10:27 AM": [
            { name: "ইংরেজি", teacher: "মিস এমা" },
            { name: "ইংরেজি", teacher: "মিস এমা" },
            { name: "গণিত", teacher: "মি. জন" },
            { name: "গণিত", teacher: "মি. জন" },
            { name: "সামাজিক বিজ্ঞান", teacher: "মি. অ্যালেক্স" },
            { name: "সামাজিক বিজ্ঞান", teacher: "মি. অ্যালেক্স" },
            { name: "সামাজিক বিজ্ঞান", teacher: "মি. অ্যালেক্স" },
          ],
          "10:28 - 11:08 AM": [
            { name: "শিল্পকলা", teacher: "মিস লিলি" },
            { name: "শিল্পকলা", teacher: "মিস লিলি" },
            { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
            { name: "বিজ্ঞান", teacher: "ড. স্মিথ" },
            { name: "গণিত", teacher: "মি. জন" },
            { name: "গণিত", teacher: "মি. জন" },
            { name: "গণিত", teacher: "মি. জন" },
          ],
          "11:09 - 11:41 AM": [
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
            { name: "ইংরেজি", teacher: "মিস এমা" },
            { name: "ইংরেজি", teacher: "মিস এমা" },
            { name: "ইংরেজি", teacher: "মিস এমা" },
          ],
          "11:41 - 12:00 PM": Array(7).fill({ name: "অবসর সময়", teacher: "-" }),
          "12:01 - 12:36 PM": [
            null,
            null,
            null,
            null,
            { name: "শিল্পকলা", teacher: "মিস লিলি" },
            { name: "শিল্পকলা", teacher: "মিস লিলি" },
            { name: "শিল্পকলা", teacher: "মিস লিলি" },
          ],
          "12:37 - 1:12 PM": [
            null,
            null,
            null,
            null,
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
            { name: "ভাষা", teacher: "মিস গার্সিয়া" },
          ],
          "1:13 - 1:48 PM": [
            null,
            null,
            null,
            null,
            { name: "সমীক্ষা", teacher: "মি. রায়ান" },
            { name: "সমীক্ষা", teacher: "মি. রায়ান" },
            { name: "সমীক্ষা", teacher: "মি. রায়ান" },
          ],
          "1:49 - 2:24 PM": [
            null,
            null,
            null,
            null,
            { name: "গণিত", teacher: "মি. জন" },
            { name: "গণিত", teacher: "মি. জন" },
            { name: "গণিত", teacher: "মি. জন" },
          ],
        },
      };
      await setDoc(routineRef, defaultRoutine);
      setRoutine(defaultRoutine);
      toast({
        title: "Success",
        description: "Routine reset successfully.",
      });
    } catch (error) {
      console.error("Error resetting routine:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reset routine.",
      });
    }
  };

  const handleEditSchoolName = (value) => {
    if (value.trim()) {
      setRoutine((prev) => ({ ...prev, schoolName: value }));
    }
  };

  const handleEditClass = (index, field, value) => {
    if (value.trim()) {
      setRoutine((prev) => {
        const updatedClasses = [...prev.classLevels];
        updatedClasses[index] = { ...updatedClasses[index], [field]: value };
        return { ...prev, classLevels: updatedClasses };
      });
    }
  };

  const handleEditSchedule = (timeSlot, classIndex, field, value) => {
    setRoutine((prev) => {
      const updatedSchedule = { ...prev.schedule };
      const updatedSlot = [...(updatedSchedule[timeSlot] || Array(prev.classLevels.length).fill(null))];
      updatedSlot[classIndex] = {
        ...updatedSlot[classIndex],
        [field]: value,
        name: field === "name" ? value : updatedSlot[classIndex]?.name || "",
        teacher: field === "teacher" ? value : updatedSlot[classIndex]?.teacher || "",
      };
      updatedSchedule[timeSlot] = updatedSlot;
      return { ...prev, schedule: updatedSchedule };
    });
  };

  const getSubjectColor = (subjectName) => subjectColors[subjectName] || "bg-gray-100";

  if (loading || !routine) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-2 sm:px-4 lg:px-6">
      <div className="max-w-full mx-auto">
        {user?.role === "admin" && (
          <div className="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-col sm:flex-row items-center justify-between">
            <input
              value={routine.schoolName}
              onChange={(e) => handleEditSchoolName(e.target.value)}
              className="text-xl sm:text-2xl font-semibold text-gray-800 text-center sm:text-left bg-transparent focus:outline-none w-full sm:w-auto font-noto"
              placeholder="স্কুলের নাম লিখুন"
              disabled={!isEditing}
            />
            <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (isEditing) {
                    saveRoutine();
                  } else {
                    setIsEditing(true);
                  }
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-noto text-sm w-full sm:w-auto"
                title={isEditing ? "সংরক্ষণ করুন" : "সম্পাদনা করুন"}
              >
                {isEditing ? <FaSave /> : <FaEdit />}
                {isEditing ? "সংরক্ষণ করুন" : "সম্পাদনা করুন"}
              </button>
              <button
                onClick={resetRoutine}
                className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-noto text-sm w-full sm:w-auto"
                title="রিসেট করুন"
              >
                <FaTrash />
                রিসেট করুন
              </button>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg shadow-md p-3 mb-4">
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {Object.entries(subjectColors).map(([subject, color]) => (
              <div
                key={subject}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full font-noto"
              >
                <div className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs sm:text-sm text-gray-700">{subject}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <table className="w-full text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white font-noto">
                <th className="p-2 sm:p-3 border-b sticky left-0 z-20 bg-blue-600 min-w-[100px] sm:min-w-[120px]">
                  সময়
                </th>
                {routine.classLevels.map((level) => (
                  <th key={level.name} className="p-2 sm:p-3 border-b min-w-[120px] sm:min-w-[150px]">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        value={level.name}
                        onChange={(e) =>
                          handleEditClass(routine.classLevels.indexOf(level), "name", e.target.value)
                        }
                        className="w-full text-center bg-transparent text-white focus:outline-none border-b border-blue-300 disabled:border-0 font-noto text-xs sm:text-sm"
                        disabled={user?.role !== "admin" || !isEditing}
                      />
                      <input
                        value={level.teacher}
                        onChange={(e) =>
                          handleEditClass(routine.classLevels.indexOf(level), "teacher", e.target.value)
                        }
                        className="w-full text-center bg-transparent text-white focus:outline-none border-b border-blue-300 disabled:border-0 text-xs font-noto"
                        disabled={user?.role !== "admin" || !isEditing}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {routine.timeSlots.map((time, slotIndex) => (
                <tr
                  key={time}
                  className={`border-b ${
                    slotIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                  } hover:bg-blue-50 font-noto`}
                >
                  <td
                    className={`p-2 sm:p-3 border-r sticky left-0 z-10 font-medium ${
                      slotIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } min-w-[100px] sm:min-w-[120px]`}
                  >
                    {time}
                  </td>
                  {routine.classLevels.map((_, classIndex) => {
                    const subject = routine.schedule[time]?.[classIndex] || null;
                    return (
                      <td
                        key={`${time}-${classIndex}`}
                        className={`p-2 sm:p-3 border-r ${getSubjectColor(
                          subject?.name
                        )} min-w-[120px] sm:min-w-[150px]`}
                      >
                        {user?.role === "admin" && isEditing ? (
                          <div className="flex flex-col items-center gap-1">
                            <input
                              value={subject?.name || ""}
                              onChange={(e) =>
                                handleEditSchedule(time, classIndex, "name", e.target.value)
                              }
                              className="w-full text-center bg-transparent border-b border-gray-400 focus:outline-none text-xs sm:text-sm font-noto"
                              placeholder="বিষয় লিখুন"
                            />
                            <input
                              value={subject?.teacher || ""}
                              onChange={(e) =>
                                handleEditSchedule(time, classIndex, "teacher", e.target.value)
                              }
                              className="w-full text-center bg-transparent border-b border-gray-400 focus:outline-none text-xs font-noto"
                              placeholder="শিক্ষকের নাম"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <span className="font-medium text-xs sm:text-sm">
                              {subject?.name || "-"}
                            </span>
                            <span className="text-xs text-gray-600">{subject?.teacher || "-"}</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {user?.role === "admin" && (
          <div className="mt-4">
            <Link to="/admin/exam-management">
              <button className="bg-green-600 text-white px-4 py-2 rounded mb-4">Exam & Subject Management</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassRoutine;