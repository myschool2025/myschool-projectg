import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash, X } from 'lucide-react';
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
import classesData from '@/lib/classes.json';

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');

interface CustomFee {
  studentId: string;
  feeId: string;
  newAmount: number;
  effectiveFrom: string;
  active: boolean;
  reason: string;
}

interface Student {
  id: string;
  name: string;
  number: string;
  class: string;
}

interface FeeSetting {
  feeId: string;
  description: string;
}

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const CustomStudentFees: React.FC = () => {
  const [customFees, setCustomFees] = useState<CustomFee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeSettings, setFeeSettings] = useState<FeeSetting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCustomFee, setEditCustomFee] = useState<Partial<CustomFee> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchCustomFees = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${BACKEND_URL}/custom-student-fees`);
      setCustomFees(response.data.customFees || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch custom fees",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchStudents = useCallback(async (query: string) => {
    if (query.length < 3) {
      setStudents([]);
      return;
    }
    try {
      const response = await axios.get(`${BACKEND_URL}/students`, {
        params: { number: query, limit: 10 },
      });
      setStudents(response.data.students || []);
    } catch (error) {
      // Silently fail, student search is not critical
      console.error("Failed to fetch students", error);
    }
  }, []);

  const fetchFeeSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/fee-settings`);
      setFeeSettings(response.data.feeSettings || []);
    } catch (error) {
      // Silently fail, fee settings are not critical for initial load
      console.error("Failed to fetch fee settings", error);
    }
  }, []);

  useEffect(() => {
    fetchCustomFees();
    fetchFeeSettings();
  }, [fetchCustomFees, fetchFeeSettings]);

  const handleSave = async () => {
    if (!editCustomFee || !editCustomFee.studentId || !editCustomFee.feeId || !editCustomFee.newAmount) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fill all required fields.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const isEditing = customFees.some(f => f.studentId === editCustomFee.studentId && f.feeId === editCustomFee.feeId);
      if (isEditing) {
        const response = await axios.put(`${BACKEND_URL}/custom-student-fees/${editCustomFee.studentId}/${editCustomFee.feeId}`, editCustomFee);
        const updatedFee = response.data.customFee;
        setCustomFees(prevFees =>
          prevFees.map(f => (f.studentId === updatedFee.studentId && f.feeId === updatedFee.feeId ? updatedFee : f))
        );
        toast({ title: 'Success', description: 'Custom fee updated successfully.' });
      } else {
        const response = await axios.post(`${BACKEND_URL}/custom-student-fees`, editCustomFee);
        const newFee = response.data.customFee;
        setCustomFees(prevFees => [...prevFees, newFee]);
        toast({ title: 'Success', description: 'Custom fee added successfully.' });
      }
      setShowModal(false);
      setEditCustomFee(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save custom fee.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (studentId: string, feeId: string) => {
    setIsLoading(true);
    try {
      await axios.delete(`${BACKEND_URL}/custom-student-fees/${studentId}/${feeId}`);
      setCustomFees(prevFees => prevFees.filter(f => !(f.studentId === studentId && f.feeId === feeId)));
      toast({ title: 'Success', description: 'Custom fee deleted successfully.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete custom fee.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditCustomFee({
      studentId: '',
      feeId: '',
      newAmount: 0,
      effectiveFrom: new Date().toISOString(),
      active: true,
      reason: '',
    });
    setShowModal(true);
  };
  
  const debouncedStudentSearch = useCallback(debounce(fetchStudents, 500), [fetchStudents]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Custom Student Fees</h1>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add New Custom Fee
          </Button>
        </header>

        <div className="bg-white rounded-lg shadow">
          {isLoading && <p className="p-4">Loading...</p>}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Fee ID</TableHead>
                  <TableHead>New Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customFees.map((fee) => (
                  <TableRow key={`${fee.studentId}-${fee.feeId}`}>
                    <TableCell>{fee.studentId}</TableCell>
                    <TableCell>{fee.feeId}</TableCell>
                    <TableCell>৳{fee.newAmount}</TableCell>
                    <TableCell>{fee.reason}</TableCell>
                    <TableCell>{fee.active ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditCustomFee(fee);
                            setShowModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(fee.studentId, fee.feeId)}
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

        <AnimatePresence>
          {showModal && editCustomFee && (
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
                    {editCustomFee.studentId ? 'Edit Custom Fee' : 'Add New Custom Fee'}
                  </h2>
                  <button onClick={() => setShowModal(false)}>
                    <X size={24} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label>Search Student (by ID)</label>
                    <Input
                      placeholder="Type student ID to search..."
                      onChange={(e) => debouncedStudentSearch(e.target.value)}
                    />
                    {students.length > 0 && (
                      <Select
                        onValueChange={(value) => setEditCustomFee({ ...editCustomFee, studentId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map(student => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} ({student.id}) - {student.class}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  
                  <Select
                    value={editCustomFee.feeId}
                    onValueChange={(value) => setEditCustomFee({ ...editCustomFee, feeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a fee setting to override" />
                    </SelectTrigger>
                    <SelectContent>
                      {feeSettings.map(setting => (
                        <SelectItem key={setting.feeId} value={setting.feeId}>
                          {setting.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    placeholder="New Amount"
                    value={editCustomFee.newAmount || 0}
                    onChange={(e) => setEditCustomFee({ ...editCustomFee, newAmount: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    placeholder="Reason for override"
                    value={editCustomFee.reason || ''}
                    onChange={(e) => setEditCustomFee({ ...editCustomFee, reason: e.target.value })}
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={editCustomFee.active}
                      onCheckedChange={(checked) => setEditCustomFee({ ...editCustomFee, active: !!checked })}
                    />
                    <label htmlFor="isActive">This custom fee is active</label>
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Custom Fee'}
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

function debounce<F extends (...args: any[]) => any>(func: F, wait: number): (...args: Parameters<F>) => void {
  let timeout: NodeJS.Timeout;
  return function(this: any, ...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}


export default CustomStudentFees; 