import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { debounce } from 'lodash';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from '@/components/ui/pagination';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Search, Plus, Edit2, Trash2, Users, UserCheck, UserX, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { json2csv } from 'json-2-csv';
import classesData from '@/lib/classes.json';

interface Lead {
  id: string;
  name: string;
  class: string;
  number: string;
  description: string;
  englishName: string;
  motherName: string;
  fatherName: string;
  photoUrl: string;
  academicYear: string;
  section: string;
  shift: string;
  status: 'Admitted' | 'Not Admitted' | 'Canceled';
  studentData?: {
    id: string;
    name: string;
    class: string;
    number: string;
    description: string;
    englishName: string;
    motherName: string;
    fatherName: string;
    photoUrl: string;
    academicYear: string;
    section: string;
    shift: string;
  } | null;
}

interface MarketingStats {
  totalLeads: number;
  statusBreakdown: {
    admitted: number;
    notAdmitted: number;
    canceled: number;
    admittedPercentage: string;
    notAdmittedPercentage: string;
    canceledPercentage: string;
  };
  numberAnalysis: {
    totalNumbers: number;
    uniqueNumbers: number;
    duplicateNumbers: number;
    matchingWithStudents: number;
  };
  classDistribution: { [key: string]: { total: number; admitted: number; notAdmitted: number; canceled: number } };
  dataQuality: {
    completeProfiles: number;
    incompleteProfiles: number;
    missingFields: {
      name: number;
      class: number;
      number: number;
      englishName: number;
      motherName: number;
      fatherName: number;
      photoUrl: number;
    };
  };
}

interface MarketingResponse {
  message: string;
  stats: MarketingStats;
  leads: Lead[];
}

interface ReportResponse {
  message: string;
  leads: Lead[];
  total: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const Marketing: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: '',
    number: '',
    class: '',
    description: '',
    englishName: '',
    motherName: '',
    fatherName: '',
    photoUrl: '',
    academicYear: '',
    section: '',
    shift: '',
    status: 'Not Admitted',
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState<boolean>(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
  const isMobile = useIsMobile();

  // Fetch marketing leads analysis from server
  const fetchLeads = useCallback(
    debounce(async (search: string, status: string) => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        if (search) params.search = search;
        if (status && status !== 'all') params.status = status;

        const response = await axios.get<MarketingResponse>(
          `${BACKEND_URL}/marketing-leads-analysis`,
          { params }
        );

        if (response.data) {
          setLeads(response.data.leads || []);
          setStats(response.data.stats || null);
          setTotal(response.data.stats?.totalLeads || 0);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch leads';
        console.error('Error fetching marketing leads:', {
          message: errorMessage,
          status: err.response?.status,
          data: err.response?.data,
        });
        setError(errorMessage);
        setLeads([]);
        setStats(null);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Fetch data on mount, search, or status change
  useEffect(() => {
    fetchLeads(searchTerm, statusFilter);
    return () => {
      fetchLeads.cancel();
    };
  }, [fetchLeads, searchTerm, statusFilter]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewLead((prev) => ({ ...prev, [name]: value }));
  };

  // Add a handler for textarea changes
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewLead((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newLead.name || !newLead.number) {
      toast.error('Name and Number are required');
      return;
    }

    try {
      setLoading(true);
      
      if (editingLead) {
        // Update existing lead
        await axios.put(`${BACKEND_URL}/marketing-leads/${editingLead.id}`, newLead);
        toast.success('Marketing lead updated successfully');
      } else {
        // Add new lead
        await axios.post(`${BACKEND_URL}/marketing-leads`, newLead);
        toast.success('Marketing lead added successfully');
      }
      
      setIsModalOpen(false);
      setNewLead({
        name: '',
        number: '',
        class: '',
        description: '',
        englishName: '',
        motherName: '',
        fatherName: '',
        photoUrl: '',
        academicYear: '',
        section: '',
        shift: '',
        status: 'Not Admitted',
      });
      setEditingLead(null);
      fetchLeads(searchTerm, statusFilter);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save marketing lead');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete lead
  const handleDeleteLead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;

    try {
      setLoading(true);
      await axios.delete(`${BACKEND_URL}/marketing-leads/${id}`);
      toast.success('Marketing lead deleted successfully');
      fetchLeads(searchTerm, statusFilter);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete marketing lead');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit lead
  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      number: lead.number,
      class: lead.class,
      description: lead.description,
      englishName: lead.englishName,
      motherName: lead.motherName,
      fatherName: lead.fatherName,
      photoUrl: lead.photoUrl,
      academicYear: lead.academicYear,
      section: lead.section,
      shift: lead.shift,
      status: lead.status,
    });
    setIsModalOpen(true);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  // Handle bulk status update
  const handleBulkStatusUpdate = async () => {
    try {
      setIsBulkUpdating(true);
      const response = await axios.post(`${BACKEND_URL}/marketing-leads/bulk-update-status`);
      
      toast.success('Bulk status update completed successfully', {
        description: `Updated ${response.data.stats.leadsUpdatedToAdmitted} to Admitted, ${response.data.stats.leadsUpdatedToNotAdmitted} to Not Admitted`
      });
      
      fetchLeads(searchTerm, statusFilter);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to perform bulk status update');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Handle card click to filter by status
  const handleCardClick = (status: string) => {
    setStatusFilter(status === 'all' ? 'all' : status);
  };

  // Generate CSV report
  const generateCSV = async () => {
    try {
      setLoading(true);
      
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;

      const response = await axios.get<ReportResponse>(
        `${BACKEND_URL}/marketing-leads-report`,
        { params }
      );

      if (response.data.leads && response.data.leads.length > 0) {
        const csvData = response.data.leads.map(lead => ({
          'Lead ID': lead.id,
          'Name': lead.name,
          'Class': lead.class,
          'Phone Number': lead.number,
          'Description': lead.description,
          'English Name': lead.englishName,
          'Mother Name': lead.motherName,
          'Father Name': lead.fatherName,
          'Status': lead.status,
          'Is Student': lead.studentData ? 'Yes' : 'No',
        }));

        const csv = await json2csv(csvData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `marketing-leads-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('CSV report generated successfully');
      } else {
        toast.error('No data available for CSV export');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate CSV report');
    } finally {
      setLoading(false);
    }
  };

  // Filter leads based on search and status
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchLower) ||
        lead.number.toLowerCase().includes(searchLower) ||
        lead.class.toLowerCase().includes(searchLower)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    return filtered;
  }, [leads, searchTerm, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Leads</h1>
            <p className="text-gray-600">Manage and analyze marketing leads</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkStatusUpdate}
              disabled={isBulkUpdating}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              <RefreshCw size={20} className={isBulkUpdating ? 'animate-spin' : ''} />
              <span>{isBulkUpdating ? 'Updating...' : 'Update Status'}</span>
            </button>
            <button
              onClick={generateCSV}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setEditingLead(null);
                setNewLead({
                  name: '',
                  number: '',
                  class: '',
                  description: '',
                  englishName: '',
                  motherName: '',
                  fatherName: '',
                  photoUrl: '',
                  academicYear: '',
                  section: '',
                  shift: '',
                  status: 'Not Admitted',
                });
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={20} />
              <span>Add Lead</span>
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick('all')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick('Admitted')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Admitted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.statusBreakdown.admitted}</div>
                <p className="text-xs text-gray-500">{stats.statusBreakdown.admittedPercentage}%</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick('Not Admitted')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">Not Admitted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.statusBreakdown.notAdmitted}</div>
                <p className="text-xs text-gray-500">{stats.statusBreakdown.notAdmittedPercentage}%</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleCardClick('Canceled')}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Canceled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.statusBreakdown.canceled}</div>
                <p className="text-xs text-gray-500">{stats.statusBreakdown.canceledPercentage}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search leads by name, number, or class..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Admitted">Admitted</SelectItem>
                <SelectItem value="Not Admitted">Not Admitted</SelectItem>
                <SelectItem value="Canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading leads...</p>
            </div>
          ) : filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{lead.name}</div>
                          {lead.englishName && (
                            <div className="text-sm text-gray-500">{lead.englishName}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{lead.number}</TableCell>
                      <TableCell>{lead.class}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'Admitted'
                              ? 'bg-green-100 text-green-800'
                              : lead.status === 'Not Admitted'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {lead.studentData ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Student
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <UserX className="h-3 w-3 mr-1" />
                            Lead
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsLeadModalOpen(true);
                            }}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Users size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leads found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search criteria.' 
                  : 'Get started by adding your first marketing lead.'}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Lead Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLead ? 'Edit Marketing Lead' : 'Add New Marketing Lead'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <Input
                    name="name"
                    value={newLead.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <Input
                    name="number"
                    value={newLead.number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Class</label>
                  <Select
                    value={newLead.class}
                    onValueChange={(value) => setNewLead(prev => ({ ...prev, class: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_OPTIONS.map((className) => (
                        <SelectItem key={className} value={className}>
                          {className}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={newLead.status}
                    onValueChange={(value) => setNewLead(prev => ({ ...prev, status: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not Admitted">Not Admitted</SelectItem>
                      <SelectItem value="Admitted">Admitted</SelectItem>
                      <SelectItem value="Canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">English Name</label>
                  <Input
                    name="englishName"
                    value={newLead.englishName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Father's Name</label>
                  <Input
                    name="fatherName"
                    value={newLead.fatherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mother's Name</label>
                  <Input
                    name="motherName"
                    value={newLead.motherName}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Photo URL</label>
                  <Input
                    name="photoUrl"
                    value={newLead.photoUrl}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Academic Year</label>
                  <Input
                    name="academicYear"
                    value={newLead.academicYear}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Section</label>
                  <Input
                    name="section"
                    value={newLead.section}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Shift</label>
                  <Input
                    name="shift"
                    value={newLead.shift}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={newLead.description}
                  onChange={handleTextareaChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingLead ? 'Update Lead' : 'Add Lead')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Lead Details Modal */}
        <Dialog open={isLeadModalOpen} onOpenChange={setIsLeadModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lead Details</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <p className="text-lg font-medium">{selectedLead.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                    <p className="text-lg">{selectedLead.number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Class</label>
                    <p className="text-lg">{selectedLead.class}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedLead.status === 'Admitted'
                          ? 'bg-green-100 text-green-800'
                          : selectedLead.status === 'Not Admitted'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {selectedLead.status}
                    </span>
                  </div>
                  {selectedLead.englishName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">English Name</label>
                      <p className="text-lg">{selectedLead.englishName}</p>
                    </div>
                  )}
                  {selectedLead.fatherName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Father's Name</label>
                      <p className="text-lg">{selectedLead.fatherName}</p>
                    </div>
                  )}
                  {selectedLead.motherName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Mother's Name</label>
                      <p className="text-lg">{selectedLead.motherName}</p>
                    </div>
                  )}
                  {selectedLead.academicYear && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Academic Year</label>
                      <p className="text-lg">{selectedLead.academicYear}</p>
                    </div>
                  )}
                  {selectedLead.section && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Section</label>
                      <p className="text-lg">{selectedLead.section}</p>
                    </div>
                  )}
                  {selectedLead.shift && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Shift</label>
                      <p className="text-lg">{selectedLead.shift}</p>
                    </div>
                  )}
                </div>
                {selectedLead.description && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Description</label>
                    <p className="text-lg">{selectedLead.description}</p>
                  </div>
                )}
                {selectedLead.studentData && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-green-600 mb-2">Student Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Student ID</label>
                        <p className="text-lg">{selectedLead.studentData.id}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600">Student Class</label>
                        <p className="text-lg">{selectedLead.studentData.class}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Marketing;