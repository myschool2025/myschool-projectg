
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, CheckCircle, XCircle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Fake attendance data - in a real app would come from Firestore
const attendanceData = {
  totalSchoolDays: 220,
  presentDays: 203,
  absences: [
    { date: "2023-05-10", reason: "Sick leave" },
    { date: "2023-06-15", reason: "Family event" },
    { date: "2023-07-20", reason: "Doctor's appointment" },
    { date: "2023-08-05", reason: "Sick leave" },
    { date: "2023-08-25", reason: "Family emergency" },
    { date: "2023-09-12", reason: "Sick leave" },
    { date: "2023-10-18", reason: "Family event" },
    { date: "2023-11-03", reason: "Doctor's appointment" },
    { date: "2023-11-24", reason: "Sick leave" },
    { date: "2023-12-15", reason: "Family event" },
    { date: "2024-01-10", reason: "Sick leave" },
    { date: "2024-02-02", reason: "Doctor's appointment" },
    { date: "2024-02-22", reason: "Family emergency" },
    { date: "2024-03-05", reason: "Sick leave" },
    { date: "2024-04-01", reason: "Family event" },
    { date: "2024-04-15", reason: "Education trip" },
    { date: "2024-05-03", reason: "Sick leave" },
  ],
};

const StudentAttendanceCard = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendanceInfo, setAttendanceInfo] = useState<{
    percentage: number;
    absent: { date: string; reason: string }[];
  }>({
    percentage: 0,
    absent: [],
  });

  useEffect(() => {
    // Calculate attendance percentage
    const percentage = Math.round(
      (attendanceData.presentDays / attendanceData.totalSchoolDays) * 100
    );
    setAttendanceInfo({
      percentage,
      absent: attendanceData.absences,
    });
  }, []);

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  // Check if selected date is absent
  const isDateAbsent = (date: Date | undefined) => {
    if (!date) return false;
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceInfo.absent.some((a) => a.date === dateStr);
  };

  // Get reason for absence
  const getAbsenceReason = (date: Date | undefined) => {
    if (!date) return "";
    const dateStr = format(date, "yyyy-MM-dd");
    const absence = attendanceInfo.absent.find((a) => a.date === dateStr);
    return absence ? absence.reason : "";
  };

  // Highlight absent dates in calendar
  const isDayAbsent = (day: Date) => {
    return attendanceInfo.absent.some(
      (absence) => absence.date === format(day, "yyyy-MM-dd")
    );
  };

  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible">
      <Card className="border border-gray-200 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle>Attendance Overview</CardTitle>
          <CardDescription>
            Your attendance record for the current academic year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Attendance Rate: {attendanceInfo.percentage}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {attendanceData.presentDays} / {attendanceData.totalSchoolDays} days
                  </span>
                </div>
                <Progress value={attendanceInfo.percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Present</p>
                    <p className="text-lg font-semibold">{attendanceData.presentDays} days</p>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Absent</p>
                    <p className="text-lg font-semibold">{attendanceInfo.absent.length} days</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Selected Date Status:</h3>
                <div className="p-4 rounded-lg border">
                  {isDateAbsent(date) ? (
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Absent</p>
                        <p className="text-sm text-gray-600">{getAbsenceReason(date)}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <p className="font-medium">Present</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mb-4",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    modifiers={{ absent: isDayAbsent }}
                    modifiersClassNames={{
                      absent: "bg-red-100 text-red-600 font-medium",
                    }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                <h3 className="text-sm font-medium mb-1">Recent Absences:</h3>
                {attendanceInfo.absent.slice(0, 5).map((absence, index) => (
                  <div
                    key={index}
                    className="p-3 border rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium">{absence.date}</p>
                      <p className="text-sm text-gray-500">{absence.reason}</p>
                    </div>
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentAttendanceCard;
