import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash, X, Calendar as CalendarIcon, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, addYears, formatISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import classesData from '@/lib/classes.json';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

interface FeeSetting {
  feeId: string;
  feeType: string;
  classes: string[];
  description: string;
  amount: number;
  activeFrom: string;
  activeTo: string;
  canOverride: boolean;
  examName?: string;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const DEFAULT_FEE_TYPE_OPTIONS = [
  { value: 'admission', label: 'Admission Fee' },
  { value: 'tuition', label: 'Tuition Fee' },
  { value: 'session', label: 'Session Fee' },
  { value: 'exam', label: 'Exam Fee' },
  { value: 'library', label: 'Library Fee' },
  { value: 'laboratory', label: 'Laboratory Fee' },
  { value: 'transport', label: 'Transport Fee' },
  { value: 'idcard', label: 'ID Card Fee' },
  { value: 'sports', label: 'Sports Fee' },
  { value: 'development', label: 'Development Fee' },
  { value: 'computer', label: 'Computer Fee' },
  { value: 'hostel', label: 'Hostel Fee' },
  { value: 'uniform', label: 'Uniform Fee' },
  { value: 'extra', label: 'Extra-Curricular Fee' },
  { value: 'latefine', label: 'Late Fee Fine' },
  { value: 'tc', label: 'Transfer Certificate Fee' },
];

const FEE_TYPE_OPTIONS = [
  { value: 'monthly', label: 'Monthly Fee' },
  { value: 'exam', label: 'Exam Fee' },
  { value: 'books', label: 'Books Fee' },
  // Add more as needed
];

const todayISO = formatISO(new Date(), { representation: 'date' });
const nextYearISO = formatISO(addYears(new Date(), 1), { representation: 'date' });

const PRESET_FEES = [
  { feeType: 'monthly', classes: ['Play'], amount: 300 },
  { feeType: 'monthly', classes: ['Nursery'], amount: 500 },
  { feeType: 'monthly', classes: ['One', 'Two'], amount: 600 },
  { feeType: 'monthly', classes: ['Three', 'Four'], amount: 800 },
  { feeType: 'exam', classes: ['Play'], amount: 300 },
  { feeType: 'exam', classes: ['Nursery'], amount: 500 },
  { feeType: 'exam', classes: ['One', 'Two'], amount: 600 },
  { feeType: 'exam', classes: ['Three', 'Four'], amount: 800 },
  { feeType: 'books', classes: ['Play'], amount: 300 },
  { feeType: 'books', classes: ['Nursery'], amount: 500 },
  { feeType: 'books', classes: ['One', 'Two'], amount: 600 },
  { feeType: 'books', classes: ['Three', 'Four'], amount: 800 },
].map(fee => ({
  ...fee,
  description: `${fee.feeType} fee for ${fee.classes.join(', ')}`,
  activeFrom: todayISO,
  activeTo: nextYearISO,
  canOverride: false,
}));

const FeeSettings: React.FC = () => {
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editFeeSetting, setEditFeeSetting] = useState<Partial<FeeSetting> | null>(null);
  const { toast } = useToast();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const paginatedFeeSettings = useMemo(() => {
    const start = page * rowsPerPage;
    return feeSettings.slice(start, start + rowsPerPage);
  }, [feeSettings, page, rowsPerPage]);

  const [batchFees, setBatchFees] = useState([
    { feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false }
  ]);

  const [customFeeTypes, setCustomFeeTypes] = useState<{ value: string, label: string }[]>([]);
  const allFeeTypeOptions = [...DEFAULT_FEE_TYPE_OPTIONS, ...customFeeTypes];

  const fetchFeeSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/fee-settings`);
      setFeeSettings(response.data.feeSettings || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch fee settings",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeeSettings();
  }, [fetchFeeSettings]);

  const handleSave = async () => {
    if (!editFeeSetting || !editFeeSetting.feeType || !editFeeSetting.description || !editFeeSetting.amount || !Array.isArray(editFeeSetting.classes) || editFeeSetting.classes.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill all required fields and select at least one class.',
      });
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        ...editFeeSetting,
        classes: editFeeSetting.classes,
      };
      if (editFeeSetting.feeId) {
        const response = await axios.put(`${BACKEND_URL}/fee-settings/${editFeeSetting.feeId}`, payload);
        const updatedSetting = response.data.feeSetting;
        setFeeSettings(prev =>
          prev.map(fee => fee.feeId === updatedSetting.feeId ? updatedSetting : fee)
        );
        toast({ title: 'Success', description: 'Fee setting updated successfully.' });
      } else {
        const response = await axios.post(`${BACKEND_URL}/fee-settings`, payload);
        const newSetting = response.data.feeSetting;
        setFeeSettings(prev => [...prev, newSetting]);
        toast({ title: 'Success', description: 'Fee setting added successfully.' });
      }
      setShowModal(false);
      setEditFeeSetting(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save fee setting.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (feeId: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/fee-settings/${feeId}`);
      setFeeSettings(prev => prev.filter(s => s.feeId !== feeId));
      toast({ title: 'Success', description: 'Fee setting deleted successfully.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete fee setting.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditFeeSetting({
      feeType: '',
      classes: [],
      description: '',
      amount: 0,
      activeFrom: new Date().toISOString(),
      activeTo: new Date().toISOString(),
      canOverride: false,
    });
    setShowModal(true);
  };

  console.log(CLASS_OPTIONS);

  const [selectedClass, setSelectedClass] = useState("all");

  const handleClassCheckboxChange = (value: string, checked: boolean) => {
    if (value === "all") {
      setEditFeeSetting({
        ...editFeeSetting,
        classes: checked ? ["all"] : [],
      });
    } else {
      let newClasses = Array.isArray(editFeeSetting.classes) ? [...editFeeSetting.classes] : [];
      newClasses = newClasses.filter((v) => v !== "all"); // Remove "all" if present
      if (checked) {
        newClasses.push(value);
      } else {
        newClasses = newClasses.filter((v) => v !== value);
      }
      setEditFeeSetting({
        ...editFeeSetting,
        classes: newClasses,
      });
    }
  };

  const handleBatchFeeChange = (idx: number, field: string, value: any) => {
    setBatchFees(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const handleBatchClassChange = (idx: number, classValue: string, checked: boolean) => {
    setBatchFees(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      let newClasses = Array.isArray(row.classes) ? [...row.classes] : [];
      if (classValue === 'all') {
        newClasses = checked ? ['all'] : [];
      } else {
        newClasses = newClasses.filter(v => v !== 'all');
        if (checked) newClasses.push(classValue);
        else newClasses = newClasses.filter(v => v !== classValue);
      }
      return { ...row, classes: newClasses };
    }));
  };

  const addBatchFeeRow = () => setBatchFees(prev => [...prev, { feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false }]);
  const removeBatchFeeRow = (idx: number) => setBatchFees(prev => prev.filter((_, i) => i !== idx));

  const handleBatchSubmit = async () => {
    const validFees = batchFees.filter(f => f.feeType && Array.isArray(f.classes) && f.classes.length > 0 && f.amount > 0 && f.description && f.activeFrom && f.activeTo);
    if (validFees.length === 0) {
      toast({ variant: 'destructive', title: 'Validation Error', description: 'Please fill all fields for at least one fee.' });
      return;
    }
    setIsLoading(true);
    try {
      await Promise.all(validFees.map(fee => axios.post(`${BACKEND_URL}/fee-settings`, fee)));
      toast({ title: 'Success', description: 'Batch fees added successfully.' });
      setBatchFees([{ feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false }]);
      fetchFeeSettings();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to add batch fees.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function to load preset fees
  const loadPresetFees = () => {
    setBatchFees(PRESET_FEES.map(fee => ({ ...fee })));
  };

  // Add this function to reset batch fees
  const resetBatchFees = () => {
    setBatchFees([{ feeType: '', classes: [], amount: 0, description: '', activeFrom: todayISO, activeTo: nextYearISO, canOverride: false }]);
  };

  const handleAddFeeType = (newType: string) => {
    if (!newType) return;
    const exists = allFeeTypeOptions.some(opt => opt.value === newType.toLowerCase());
    if (!exists) {
      const newOption = { value: newType.toLowerCase(), label: newType };
      setCustomFeeTypes(prev => [...prev, newOption]);
      // Optionally, send to backend for persistence
      axios.post(`${BACKEND_URL}/fee-types`, newOption).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Fee Settings</h1>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add New Setting
          </Button>
        </header>
        <Tabs defaultValue="main-table" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="main-table">Fee Table</TabsTrigger>
            <TabsTrigger value="batch-add">Quick Add Multiple Fees</TabsTrigger>
          </TabsList>
          <TabsContent value="main-table">
            <div className="bg-white rounded-lg shadow">
              {isLoading && (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                  <span>Loading...</span>
                </div>
              )}
              {!isLoading && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Active From</TableHead>
                      <TableHead>Active To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFeeSettings.map((setting) => (
                      <TableRow key={setting.feeId}>
                        <TableCell>{setting.feeType}</TableCell>
                        <TableCell>
                          {(setting.classes || []).map(cls =>
                            CLASS_OPTIONS.find(opt => opt === cls)?.label || cls
                          ).join(', ')}
                        </TableCell>
                        <TableCell>{setting.description}</TableCell>
                        <TableCell>৳{setting.amount}</TableCell>
                        <TableCell>{format(new Date(setting.activeFrom), 'PPP')}</TableCell>
                        <TableCell>{format(new Date(setting.activeTo), 'PPP')}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setEditFeeSetting({ ...setting });
                                setShowModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(setting.feeId)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="flex justify-between items-center mt-4">
              <div>
                <Button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Previous</Button>
                <span className="mx-2">Page {page + 1} of {Math.ceil(feeSettings.length / rowsPerPage)}</span>
                <Button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * rowsPerPage >= feeSettings.length}>Next</Button>
              </div>
              <div>
                <label className="mr-2">Rows per page:</label>
                <Select value={String(rowsPerPage)} onValueChange={v => setRowsPerPage(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20, 50].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="batch-add">
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold">Quick Add Multiple Fees</h2>
                <span className="text-gray-400" title="Use this section to quickly add multiple fee rules at once."><Info size={16} /></span>
              </div>
              <div className="flex gap-2 mb-4">
                <Button variant="secondary" onClick={loadPresetFees}>Load Preset Fees</Button>
                <Button variant="outline" onClick={resetBatchFees}>Reset</Button>
              </div>
              <div className="text-xs text-gray-500 mb-2">Select fee type, classes, and amount for each row. Use 'Load Preset Fees' for a template.</div>
              {batchFees.map((row, idx) => (
                <div key={idx} className="flex flex-wrap gap-2 items-center mb-2 border-b pb-2">
                  <select
                    className="border rounded p-1"
                    value={row.feeType}
                    onChange={e => handleBatchFeeChange(idx, 'feeType', e.target.value)}
                  >
                    <option value="">Select Fee Type</option>
                    {allFeeTypeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <span>Classes:</span>
                  <div className="flex flex-wrap gap-1">
                    {/* Group class checkboxes visually */}
                    <div className="flex flex-col gap-1">
                      {CLASS_OPTIONS.slice(1, 3).map(opt => (
                        <label key={opt} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={Array.isArray(row.classes) && row.classes.includes(opt)}
                            onChange={e => handleBatchClassChange(idx, opt, e.target.checked)}
                            disabled={opt !== 'all' && Array.isArray(row.classes) && row.classes.includes('all')}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {CLASS_OPTIONS.slice(3, 7).map(opt => (
                        <label key={opt} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={Array.isArray(row.classes) && row.classes.includes(opt)}
                            onChange={e => handleBatchClassChange(idx, opt, e.target.checked)}
                            disabled={opt !== 'all' && Array.isArray(row.classes) && row.classes.includes('all')}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      {CLASS_OPTIONS.slice(7, 11).map(opt => (
                        <label key={opt} className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            checked={Array.isArray(row.classes) && row.classes.includes(opt)}
                            onChange={e => handleBatchClassChange(idx, opt, e.target.checked)}
                            disabled={opt !== 'all' && Array.isArray(row.classes) && row.classes.includes('all')}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    className="border rounded p-1 w-24"
                    placeholder="Amount"
                    value={row.amount}
                    onChange={e => handleBatchFeeChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="text"
                    className="border rounded p-1 w-48"
                    placeholder="Description"
                    value={row.description}
                    onChange={e => handleBatchFeeChange(idx, 'description', e.target.value)}
                  />
                  {/* Hidden fields for activeFrom, activeTo, canOverride (can be made visible if needed) */}
                  <input type="hidden" value={row.activeFrom} readOnly />
                  <input type="hidden" value={row.activeTo} readOnly />
                  <input type="hidden" value={row.canOverride ? 'Y' : 'N'} readOnly />
                  <Button variant="outline" size="icon" onClick={() => removeBatchFeeRow(idx)} disabled={batchFees.length === 1}><X /></Button>
                </div>
              ))}
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={addBatchFeeRow}>Add Row</Button>
                <Button onClick={handleBatchSubmit} disabled={isLoading}>Submit All</Button>
              </div>
              {/* Summary Preview */}
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Summary Preview</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-2 py-1 border">Fee Type</th>
                        <th className="px-2 py-1 border">Classes</th>
                        <th className="px-2 py-1 border">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchFees.map((row, idx) => (
                        <tr key={idx}>
                          <td className="px-2 py-1 border">{row.feeType}</td>
                          <td className="px-2 py-1 border">{(row.classes || []).map(cls => CLASS_OPTIONS.find(opt => opt === cls)?.label || cls).join(', ')}</td>
                          <td className="px-2 py-1 border">৳{row.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <AnimatePresence>
          {showModal && editFeeSetting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    {editFeeSetting.feeId ? 'Edit Fee Setting' : 'Add New Fee Setting'}
                  </h2>
                  <button onClick={() => setShowModal(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">Fee Type</span>
                      <span className="text-xs text-gray-500">(ফি-এর ধরন লিখুন)</span>
                    </div>
                    <Input
                      placeholder="Fee Type (e.g., monthly_fee)"
                      value={editFeeSetting.feeType || ''}
                      onChange={(e) => setEditFeeSetting({ ...editFeeSetting, feeType: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">Class</span>
                      <span className="text-xs text-gray-500">(শ্রেণি নির্ধারণ করুন)</span>
                    </div>
                    <div>
                      <label className="font-semibold">Classes</label>
                      <div className="grid grid-cols-2 gap-2">
                        {CLASS_OPTIONS.filter(opt => opt !== 'all').map(opt => (
                          <label key={opt} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Array.isArray(editFeeSetting.classes) && editFeeSetting.classes.includes(opt)}
                              onChange={e => handleClassCheckboxChange(opt, e.target.checked)}
                              disabled={
                                opt !== "all" &&
                                Array.isArray(editFeeSetting.classes) &&
                                editFeeSetting.classes.includes("all")
                              }
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">Description</span>
                      <span className="text-xs text-gray-500">(ফি-এর বিবরণ)</span>
                    </div>
                    <Input
                      placeholder="Description"
                      value={editFeeSetting.description || ''}
                      onChange={(e) => setEditFeeSetting({ ...editFeeSetting, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-semibold">Amount</span>
                      <span className="text-xs text-gray-500">(ফি-এর পরিমাণ)</span>
                    </div>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={editFeeSetting.amount || 0}
                      onChange={(e) => setEditFeeSetting({ ...editFeeSetting, amount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editFeeSetting.activeFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFeeSetting.activeFrom ? format(new Date(editFeeSetting.activeFrom), "PPP") : <span>Pick a start date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(editFeeSetting.activeFrom)}
                          onSelect={(date) => setEditFeeSetting({ ...editFeeSetting, activeFrom: date?.toISOString() })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !editFeeSetting.activeTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {editFeeSetting.activeTo ? format(new Date(editFeeSetting.activeTo), "PPP") : <span>Pick an end date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={new Date(editFeeSetting.activeTo)}
                          onSelect={(date) => setEditFeeSetting({ ...editFeeSetting, activeTo: date?.toISOString() })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="canOverride"
                      checked={editFeeSetting.canOverride}
                      onCheckedChange={(checked) => setEditFeeSetting({ ...editFeeSetting, canOverride: !!checked })}
                    />
                    <label htmlFor="canOverride">Allow override for individual students</label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Setting'}
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

export default FeeSettings; 