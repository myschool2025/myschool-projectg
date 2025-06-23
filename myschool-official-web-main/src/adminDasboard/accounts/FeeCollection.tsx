import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Printer, Calendar as CalendarIcon } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { FiSend } from 'react-icons/fi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import classesData from '@/lib/classes.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface Student {
  id: string;
  name: string;
  number: string;
  class: string;
  section?: string;
  shift?: string;
  fatherName?: string;
}

interface FeeAnalysisItem {
  feeId: string;
  description: string;
  actualAmount: number;
  totalPaid: number;
  dueAmount: number;
  // For UI state
  selected: boolean;
  amountToPay: number;
}

interface FeeSetting {
  feeId: string;
  description: string;
  amount: number;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const FeeCollection = () => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [collectionItems, setCollectionItems] = useState<FeeAnalysisItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [collectionDate, setCollectionDate] = useState<Date>(new Date());
  const [narration, setNarration] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const { toast } = useToast();
  const receiptRef = useRef(null);
  const [smsMessage, setSmsMessage] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [allFeeSettings, setAllFeeSettings] = useState<FeeSetting[]>([]);

  const handleLoadStudent = useCallback(async () => {
    if (!studentIdInput) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a student ID.' });
      return;
    }
    setIsLoading(true);
    try {
      let student = null;
      // Try by ID first
      let response = await axios.get(`${BACKEND_URL}/students`, { params: { id: studentIdInput, limit: 1 } });
      if (response.data.students && response.data.students.length > 0) {
        student = response.data.students[0];
      } else {
        // Fallback to number
        response = await axios.get(`${BACKEND_URL}/students`, { params: { number: studentIdInput, limit: 1 } });
        if (response.data.students && response.data.students.length > 0) {
          student = response.data.students[0];
        }
      }

      if (!student) {
        toast({ variant: 'destructive', title: 'Not Found', description: 'Student not found.' });
        setSelectedStudent(null);
        setCollectionItems([]);
        return;
      }
      setSelectedStudent(student);

      const analysisResponse = await axios.get(`${BACKEND_URL}/fee-analysis/${student.id}`);
      const analysisData = analysisResponse.data.feeSummary;
      
      const uiReadyItems = analysisData.map((item: any) => ({
        ...item,
        selected: false,
        amountToPay: item.dueAmount > 0 ? item.dueAmount : 0,
      }));
      setCollectionItems(uiReadyItems);

    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load student data.' });
      setSelectedStudent(null);
      setCollectionItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [studentIdInput, toast]);

  const handleItemSelection = (feeId: string, isSelected: boolean) => {
    setCollectionItems(prev =>
      prev.map(item =>
        item.feeId === feeId ? { ...item, selected: isSelected } : item
      )
    );
  };

  const handleAmountToPayChange = (feeId: string, amount: number) => {
    setCollectionItems(prev =>
      prev.map(item => {
        if (item.feeId === feeId) {
          const newAmount = Math.max(0, amount);
          return {
            ...item,
            amountToPay: newAmount,
            dueAmount: Math.max(0, item.actualAmount - (item.totalPaid + newAmount)),
          };
        }
        return item;
      })
    );
  };

  const totalToCollect = collectionItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + item.amountToPay, 0);

  const generateAndPrintInvoice = (paidItems: any[], transactionId: string) => {
    const studentCopy = `
      <div style="border: 1px solid #ccc; padding: 20px; margin-bottom: 20px; font-family: sans-serif;">
        <h2 style="text-align: center;">Student Copy</h2>
        <p><strong>Student:</strong> ${selectedStudent?.name}</p>
        <p><strong>Student ID:</strong> ${selectedStudent?.id}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date:</strong> ${format(collectionDate, 'PPP')}</p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead><tr><th style="border-bottom: 1px solid #000; text-align: left;">Fee Head</th><th style="border-bottom: 1px solid #000; text-align: right;">Amount</th></tr></thead>
          <tbody>
            ${paidItems.map(item => `<tr><td style="padding: 5px 0;">${item.description}</td><td style="padding: 5px 0; text-align: right;">${item.amountToPay.toFixed(2)}</td></tr>`).join('')}
          </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; margin-top: 10px;">Total Paid: ${totalToCollect.toFixed(2)}</p>
      </div>`;

    const officeCopy = studentCopy.replace('Student Copy', 'Office Copy');

    const combined = `<div ref={receiptRef}>${studentCopy}${officeCopy}</div>`;
    
    const element = document.createElement('div');
    element.innerHTML = combined;

    html2pdf().from(element).set({
        margin: 10,
        filename: `receipt-${selectedStudent?.id}-${transactionId}.pdf`,
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).save();
  };

  const handlePost = async () => {
    const itemsToPay = collectionItems.filter(item => item.selected && item.amountToPay > 0);
    if (itemsToPay.length === 0 || !selectedStudent) {
      toast({ variant: 'destructive', title: 'Error', description: 'No items selected for payment.' });
      return;
    }

    setIsLoading(true);
    const transactionId = `${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Date.now()}`;
    
    try {
      const collectionPromises = itemsToPay.map(item => {
        const payload = {
          date: collectionDate.toISOString(),
          studentId: selectedStudent.id,
          feeId: item.feeId,
          month: (new Date(collectionDate).getMonth() + 1).toString(),
          year: new Date(collectionDate).getFullYear().toString(),
          quantity: 1,
          amountPaid: item.amountToPay,
          paymentMethod: paymentMethod,
          description: narration || item.description,
        };
        return axios.post(`${BACKEND_URL}/fee-collections`, payload);
      });

      await Promise.all(collectionPromises);

      if (sendSms && selectedStudent?.number) {
        const smsMessage = `Dear Parent, a payment of BDT ${totalToCollect.toFixed(2)} has been received for ${selectedStudent.name}. Transaction ID: ${transactionId}. Thank you, MySchool.`;
        try {
          await axios.post(`${BACKEND_URL}/sendSMS`, {
            number: selectedStudent.number,
            message: smsMessage,
          });
          toast({ title: 'SMS Sent', description: 'Payment confirmation SMS sent successfully.' });
        } catch (smsError) {
          toast({ variant: 'destructive', title: 'SMS Failed', description: 'The payment was successful, but the SMS could not be sent.' });
        }
      }

      toast({ title: 'Success', description: 'Payment posted successfully.' });
      generateAndPrintInvoice(itemsToPay, transactionId);
      // Reload student data
      handleLoadStudent();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post payment.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Update SMS template when student or fee data changes
  useEffect(() => {
    if (!selectedStudent) {
      setSmsMessage('');
      return;
    }
    const unpaidItems = collectionItems.filter(item => item.dueAmount > 0);
    const unpaidText = unpaidItems.map(item => `${item.description}: ৳${item.dueAmount.toFixed(2)}`).join(', ');
    setSmsMessage(
      `প্রিয় অভিভাবক, ${selectedStudent.name} (${selectedStudent.id})-এর জন্য বকেয়া: ${unpaidText || 'নেই'}। অনুগ্রহ করে নির্ধারিত সময়ে পরিশোধ করুন। ধন্যবাদ, MySchool`
    );
  }, [selectedStudent, collectionItems]);

  const handleSendSms = async () => {
    if (!selectedStudent?.number || !smsMessage.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Student mobile number or SMS message missing.' });
      return;
    }
    setSmsLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/sendSMS`, {
        number: selectedStudent.number,
        message: smsMessage,
      });
      toast({ title: 'SMS Sent', description: 'SMS sent successfully.' });
    } catch (smsError) {
      toast({ variant: 'destructive', title: 'SMS Failed', description: 'Could not send SMS.' });
    } finally {
      setSmsLoading(false);
    }
  };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/fee-settings`).then(res => {
      setAllFeeSettings(res.data.feeSettings || []);
    });
  }, []);

  const handleAddOtherFee = (feeId) => {
    const fee = allFeeSettings.find(f => f.feeId === feeId);
    if (fee && !collectionItems.some(item => item.feeId === feeId)) {
      setCollectionItems(prev => [
        ...prev,
        {
          feeId: fee.feeId,
          description: fee.description,
          actualAmount: fee.amount,
          totalPaid: 0,
          dueAmount: fee.amount,
          selected: false,
          amountToPay: 0,
        }
      ]);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Fees Collection</h1>
        
        {/* Top Controls */}
        <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">St Code</label>
            <Input 
              placeholder="Enter student ID"
              value={studentIdInput}
              onChange={(e) => setStudentIdInput(e.target.value)}
            />
          </div>
          <div className="col-span-1">
            <Button onClick={handleLoadStudent} disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Load'}
            </Button>
          </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Payment On</label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Mobile Banking">Mobile Banking</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
                </div>
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700">Collection Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !collectionDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {collectionDate ? format(collectionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={collectionDate} onSelect={(d) => setCollectionDate(d || new Date())} initialFocus /></PopoverContent>
            </Popover>
            </div>
          <div className="col-span-full lg:col-span-1">
             <label className="block text-sm font-medium text-gray-700">Transaction Number</label>
             <Input disabled value="Auto-generated" />
        </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700">Narration</label>
            <Input placeholder="Optional notes..." value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
        </div>

        {/* Student Info */}
        {selectedStudent && (
          <div className="bg-white p-4 rounded-lg shadow-sm text-blue-800">
            <p><strong>Student:</strong> {selectedStudent.name}, <strong>Class:</strong> {selectedStudent.class}, <strong>Section:</strong> {selectedStudent.section || 'N/A'}, <strong>Shift:</strong> {selectedStudent.shift || 'N/A'}</p>
            <p><strong>Mobile:</strong> {selectedStudent.number}, <strong>Father's Name:</strong> {selectedStudent.fatherName || 'N/A'}</p>
                </div>
        )}

        {/* Collection Entry Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={collectionItems.every(item => item.selected)}
                    onCheckedChange={(checked) => setCollectionItems(prev => prev.map(item => ({...item, selected: !!checked})))}
                  />
                </TableHead>
                <TableHead>Installment</TableHead>
                <TableHead>Head</TableHead>
                <TableHead className="text-right">Total To Collect</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="text-right">Unpaid</TableHead>
                <TableHead className="text-right w-[150px]">Amount to Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collectionItems.length > 0 ? collectionItems.map(item => (
                <TableRow key={item.feeId}>
                  <TableCell>
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={(checked) => handleItemSelection(item.feeId, !!checked)}
                    />
                  </TableCell>
                  <TableCell>{format(collectionDate, 'MMMM')}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.actualAmount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{item.totalPaid.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-red-600">{(item.actualAmount - (item.totalPaid + item.amountToPay)).toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Input
                        type="number"
                      className="text-right"
                      value={item.amountToPay}
                      onChange={(e) => handleAmountToPayChange(item.feeId, parseFloat(e.target.value) || 0)}
                      disabled={!item.selected}
                    />
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {selectedStudent ? 'No fee items found for this student.' : 'Load a student to see fee details.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
                    </div>
        
        {/* Footer Actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
            <p className="text-lg">Total Amount to Pay: <span className="font-bold text-green-600">৳{totalToCollect.toFixed(2)}</span></p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <Button onClick={handlePost} disabled={isLoading || totalToCollect === 0}>
              <Plus className="mr-2 h-4 w-4"/> Post
            </Button>
            <Button variant="outline" onClick={() => generateAndPrintInvoice([], 'test-invoice')}><Printer className="mr-2 h-4 w-4"/> Download Receipt</Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary" onClick={() => setSmsModalOpen(true)} disabled={!selectedStudent}>
                  <FiSend className="mr-2 h-4 w-4"/> Send SMS
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Send a payment reminder or custom message to the student's parent.
              </TooltipContent>
            </Tooltip>
                    </div>
                    </div>
        {/* SMS Modal */}
        <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Send SMS to Parent</DialogTitle>
            </DialogHeader>
                    <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMS Message</label>
                      <textarea
                className="w-full border rounded p-2 text-sm"
                rows={4}
                value={smsMessage}
                onChange={e => setSmsMessage(e.target.value)}
                placeholder="Edit the SMS message before sending..."
              />
              <p className="text-xs text-gray-500 mt-2">
                এখানে আপনি SMS টেমপ্লেট সম্পাদনা করতে পারেন। বকেয়া, ছাত্রের নাম, এবং অন্যান্য তথ্য স্বয়ংক্রিয়ভাবে যুক্ত হয়েছে, তবে আপনি চাইলে বার্তা পরিবর্তন করতে পারবেন। এই বার্তা অভিভাবকের মোবাইলে যাবে।
              </p>
                    </div>
            <DialogFooter className="flex flex-row gap-2 justify-end">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={async () => { await handleSendSms(); setSmsModalOpen(false); }} disabled={smsLoading || !selectedStudent}>
                <FiSend className="mr-2 h-4 w-4"/> {smsLoading ? 'Sending...' : 'Send SMS'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FeeCollection;