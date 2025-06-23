import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '../../../src/components/ui/use-toast';
import { Button } from '../../../src/components/ui/button';
import { Input } from '../../../src/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../src/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../src/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../src/components/ui/alert-dialog';
import classesData from '@/lib/classes.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: 'Academic' | 'Development';
}

const fetchTransactions = async () => {
  const response = await axios.get(`${BACKEND_URL}/transactions`);
  return response.data.transactions.map((t: any) => ({
    id: t.id || '',
    date: t.date || '',
    description: t.description || '',
    amount: t.amount.toString() || '0',
    type: t.type || 'income',
    category: t.category || 'Academic',
  }));
};

const CLASS_OPTIONS = (classesData as { name: string }[]).map(cls => cls.name);

const FundTracker = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State for new transaction with current date as default
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0], // Current date
    description: '',
    amount: '',
    type: 'income' as const,
    category: 'Academic' as const,
  });

  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filter state for transactions table
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    month: '',
    category: 'ALL' as 'ALL' | 'Academic' | 'Development',
  });

  // React Query for fetching transactions
  const { data: transactions = [], isLoading, error } = useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (data: any) => axios.post(`${BACKEND_URL}/transactions`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setNewTransaction({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'income', category: 'Academic' });
      toast({ title: 'Success', description: 'Transaction added successfully!' });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => axios.put(`${BACKEND_URL}/transactions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setEditTransaction(null);
      toast({ title: 'Success', description: 'Transaction updated successfully!' });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`${BACKEND_URL}/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setDeleteId(null);
      toast({ title: 'Success', description: 'Transaction deleted successfully!' });
    },
    onError: (error: any) => toast({ title: 'Error', description: error.message, variant: 'destructive' }),
  });

  // Memoized filtered transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (filter.startDate || filter.endDate) {
      result = result.filter(t => {
        const date = new Date(t.date);
        const start = filter.startDate ? new Date(filter.startDate) : null;
        const end = filter.endDate ? new Date(filter.endDate) : null;
        return (!start || date >= start) && (!end || date <= end);
      });
    }
    if (filter.month) {
      result = result.filter(t => new Date(t.date).toISOString().slice(0, 7) === filter.month);
    }
    if (filter.category !== 'ALL') {
      result = result.filter(t => t.category === filter.category);
    }
    return result;
  }, [transactions, filter]);

  // Memoized totals based on filtered transactions
  const { totalIncome, totalExpense, netBalance } = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
    return { totalIncome: income, totalExpense: expense, netBalance: income - expense };
  }, [filteredTransactions]);

  const addTransaction = () => {
    if (!newTransaction.date || !newTransaction.description || !newTransaction.amount) {
      toast({ title: 'Error', description: 'Please fill in all fields.', variant: 'destructive' });
      return;
    }
    addMutation.mutate({ ...newTransaction, amount: parseFloat(newTransaction.amount) });
  };

  const updateTransaction = () => {
    if (!editTransaction) return;
    updateMutation.mutate({ id: editTransaction.id, data: { ...editTransaction, amount: parseFloat(editTransaction.amount) } });
  };

  const deleteTransaction = (id: string) => {
    deleteMutation.mutate(id);
  };

const generateVoucher = (transaction: Transaction) => {
  const exportDate = new Date().toLocaleString();
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>MySchool-মাইস্কুল - Voucher</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              .header, .details td {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              border: 2px solid #2c3e50;
              padding: 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              border-bottom: 2px dashed #3498db;
              padding-bottom: 10px;
              margin-bottom: 20px;
              background-color: #f8f9fa;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
              color: #2c3e50;
            }
            .header p {
              margin: 5px 0 0;
              font-size: 14px;
              color: #555;
            }
            .details table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            .details td {
              padding: 8px;
              border: 1px solid #ddd;
              background-color: #fff;
            }
            .details td:first-child {
              font-weight: 600;
              width: 30%;
              background-color: #f8f9fa;
              color: #2c3e50;
            }
            .signature {
              margin-top: 40px;
              text-align: right;
            }
            .signature p {
              margin: 5px 0;
              font-size: 14px;
              color: #333;
            }
            .signature-line {
              border-top: 1px solid #2c3e50;
              width: 200px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 12px;
              color: #777;
              border-top: 1px solid #ddd;
              padding-top: 10px;
            }
            @media (max-width: 768px) {
              .container {
                padding: 10px;
              }
              .header h1 {
                font-size: 20px;
              }
              .header p {
                font-size: 12px;
              }
              .details td {
                font-size: 12px;
                padding: 5px;
              }
              .signature-line {
                width: 150px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MySchool-মাইস্কুল</h1>
              <p>Transaction Voucher</p>
            </div>
            <div class="details">
              <table>
                <tr><td>Date:</td><td>${transaction.date || '-'}</td></tr>
                <tr><td>Description:</td><td>${transaction.description || '-'}</td></tr>
                <tr><td>Amount:</td><td>৳${Number(transaction.amount || 0).toFixed(2)}</td></tr>
                <tr><td>Type:</td><td>${transaction.type ? transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1) : '-'}</td></tr>
                <tr><td>Category:</td><td>${transaction.category || '-'}</td></tr>
                <tr><td>Exported on:</td><td>${exportDate}</td></tr>
              </table>
            </div>
            <div class="signature">
              <p>Prepared by: Jakir Hossen</p>
              <p>MySchool Assistant Manager</p>
              <div class="signature-line"></div>
            </div>
            <div class="footer">
              Generated by MySchool-মাইস্কুল Official System • https://myschool-offical.netlify.app
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};


const generateBalanceSheetPDF = () => {
  const exportDate = new Date().toLocaleString();
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>MySchool-মাইস্কুল - Balance Sheet</title>
          <style>
            @media print {
              @page { margin: 2cm; }
              .header, th {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
              line-height: 1.5;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
              border: 1px solid #ddd;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              background: #3498db;
              color: #fff;
              padding: 15px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .header p {
              margin: 5px 0 0;
              font-size: 14px;
            }
            .filters, .summary {
              padding: 15px;
              background: #f8f9fa;
              border-bottom: 1px solid #ddd;
              font-size: 14px;
            }
            .filters p, .summary p {
              margin: 5px 0;
              color: #555;
            }
            .filters p strong, .summary p strong {
              color: #2c3e50;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 13px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
            }
            th {
              background: #2c3e50;
              color: #fff;
              font-weight: 600;
              text-transform: uppercase;
            }
            tr:nth-child(even) {
              background: #f9f9f9;
            }
            tr:hover {
              background: #f1f1f1;
            }
            .signature {
              margin-top: 40px;
              text-align: right;
            }
            .signature p {
              margin: 5px 0;
              font-size: 14px;
              color: #333;
            }
            .signature-line {
              border-top: 1px solid #2c3e50;
              width: 200px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              padding: 10px;
              border-top: 1px solid #ddd;
              color: #777;
              font-size: 12px;
            }
            @media (max-width: 768px) {
              .container { padding: 10px; }
              table, th, td {
                font-size: 11px;
                padding: 8px;
              }
              .header h1 {
                font-size: 20px;
              }
              .header p, .filters p, .summary p {
                font-size: 12px;
              }
              .signature-line {
                width: 150px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MySchool-মাইস্কুল</h1>
              <p>Balance Sheet</p>
            </div>
            <div class="filters">
              <p><strong>Start Date:</strong> ${filter.startDate || 'N/A'}</p>
              <p><strong>End Date:</strong> ${filter.endDate || 'N/A'}</p>
              <p><strong>Month:</strong> ${filter.month || 'N/A'}</p>
              <p><strong>Category:</strong> ${filter.category || 'All'}</p>
            </div>
            <div class="summary">
              <p><strong>Total Income:</strong> ৳${totalIncome.toFixed(2)}</p>
              <p><strong>Total Expenses:</strong> ৳${totalExpense.toFixed(2)}</p>
              <p><strong>Net Balance:</strong> ৳${netBalance.toFixed(2)}</p>
              <p><strong>Exported on:</strong> ${exportDate}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTransactions
                  .map(
                    (t) => `
                  <tr>
                    <td>${t.date || '-'}</td>
                    <td>${t.description || '-'}</td>
                    <td>৳${Number(t.amount || 0).toFixed(2)}</td>
                    <td>${t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : '-'}</td>
                    <td>${t.category || '-'}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>
            <div class="signature">
              <p>Prepared by: Jakir Hossen</p>
              <p>MySchool Assistant Manager</p>
              <div class="signature-line"></div>
            </div>
            <div class="footer">
              Generated by MySchool-মাইস্কুল Official System • https://myschool-offical.netlify.app
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Income</p>
          <p className="text-xl text-green-600">৳{totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-xl text-red-600">৳{totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-500">Net Balance</p>
          <p className="text-xl text-blue-600">৳{netBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Add Transaction */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-medium mb-4">Add New Transaction</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm text-gray-600">Date</label>
            <Input
              type="date"
              value={newTransaction.date}
              onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              className="w-full p-2 border rounded-md resize-none overflow-hidden min-h-[40px] max-h-[200px]"
              placeholder="Enter description"
              value={newTransaction.description}
              onChange={e => {
                setNewTransaction({ ...newTransaction, description: e.target.value });
                e.target.style.height = "40px"; // Reset height
                e.target.style.height = `${e.target.scrollHeight}px`; // Adjust height
              }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600">Amount</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={newTransaction.amount}
              onChange={e => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Type</label>
            <Select
              value={newTransaction.type}
              onValueChange={value => setNewTransaction({ ...newTransaction, type: value as 'income' | 'expense' })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Category</label>
            <Select
              value={newTransaction.category}
              onValueChange={value => setNewTransaction({ ...newTransaction, category: value as 'Academic' | 'Development' })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={addTransaction}
          className="mt-4"
          disabled={isLoading || addMutation.isPending}
        >
          {addMutation.isPending ? 'Adding...' : 'Add Transaction'}
        </Button>
      </div>

      {/* Transactions Table with Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md overflow-x-auto">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-4">Transactions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="text-sm text-gray-600">Start Date</label>
              <Input
                type="date"
                value={filter.startDate}
                onChange={e => setFilter({ ...filter, startDate: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">End Date</label>
              <Input
                type="date"
                value={filter.endDate}
                onChange={e => setFilter({ ...filter, endDate: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Month</label>
              <Input
                type="month"
                value={filter.month}
                onChange={e => setFilter({ ...filter, month: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Category</label>
              <Select
                value={filter.category}
                onValueChange={value => setFilter({ ...filter, category: value as 'ALL' | 'Academic' | 'Development' })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">ALL</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end space-x-2">
              {/* <Button
                onClick={generateAllTransactionsPDF}
                disabled={isLoading || filteredTransactions.length === 0}
              >
                Export Transactions
              </Button> */}
              <Button
                onClick={generateBalanceSheetPDF}
                disabled={isLoading || filteredTransactions.length === 0}
              >
                Exprot Blance Sheet
              </Button>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">Error loading transactions</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(t => (
                <TableRow key={t.id}>
                  {editTransaction && editTransaction.id === t.id ? (
                    <>
                      <TableCell>
                        <Input
                          type="date"
                          value={editTransaction.date}
                          onChange={e => setEditTransaction({ ...editTransaction, date: e.target.value })}
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={editTransaction.description}
                          onChange={e => setEditTransaction({ ...editTransaction, description: e.target.value })}
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={editTransaction.amount}
                          onChange={e => setEditTransaction({ ...editTransaction, amount: e.target.value })}
                          disabled={isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editTransaction.type}
                          onValueChange={value => setEditTransaction({ ...editTransaction, type: value as 'income' | 'expense' })}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editTransaction.category}
                          onValueChange={value => setEditTransaction({ ...editTransaction, category: value as 'Academic' | 'Development' })}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Academic">Academic</SelectItem>
                            <SelectItem value="Development">Development</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          onClick={updateTransaction}
                          variant="outline"
                          size="sm"
                          disabled={isLoading || updateMutation.isPending}
                        >
                          {updateMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                        <Button
                          onClick={() => setEditTransaction(null)}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{t.date || 'N/A'}</TableCell>
                      <TableCell>{t.description || 'N/A'}</TableCell>
                      <TableCell>৳{Number(t.amount).toFixed(2)}</TableCell>
                      <TableCell>{t.type || 'N/A'}</TableCell>
                      <TableCell>{t.category || 'N/A'}</TableCell>
                      <TableCell className="flex space-x-2">
                        <Button
                          onClick={() => generateVoucher(t)}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          Voucher
                        </Button>
                        <Button
                          onClick={() => setEditTransaction(t)}
                          variant="outline"
                          size="sm"
                          disabled={isLoading}
                        >
                          Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-100"
                              onClick={() => setDeleteId(t.id)}
                              disabled={isLoading || deleteMutation.isPending}
                            >
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the transaction.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setDeleteId(null)} disabled={isLoading}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteId && deleteTransaction(deleteId)}
                                disabled={isLoading || deleteMutation.isPending}
                              >
                                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {filteredTransactions.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 mt-4">No transactions match the filters.</div>
        )}
      </div>
    </div>
  );
};

export default FundTracker;