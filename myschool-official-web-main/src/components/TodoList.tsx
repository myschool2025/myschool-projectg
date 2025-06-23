import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, PlayCircle, AlertCircle, Trash2, Edit2, X, Plus } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { getCurrentUser, User } from "@/lib/auth";

interface Task {
    $id: string;
    userId: string;
    title: string;
    task_description: string;
    date: string;
    status: 'Not Started' | 'In Progress' | 'Delayed' | 'Completed';
    priority: 'High' | 'Medium' | 'Low';
    progress: number;
    task_start_time: string;
    task_end_time: string;
    progress_notes?: string;
    created_at?: string;
    last_updated?: string;
}

const TodoListDashboard = () => {
    const { toast } = useToast();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'Medium' as 'High' | 'Medium' | 'Low',
        progressNotes: '',
        progress: 0,
        startTime: '',
        endTime: '',
        status: 'Not Started' as 'Not Started' | 'In Progress' | 'Delayed' | 'Completed'
    });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [taskDialogOpen, setTaskDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Utility function to format time string
    const formatTime = (time: string): string => {
        if (!time) return 'N/A';
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 'N/A';
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);

                if (!user) {
                    toast({ variant: "destructive", title: "Error", description: "User not authenticated" });
                    return;
                }

                await fetchTasks(user);
            } catch (error: any) {
                toast({ variant: "destructive", title: "Error", description: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    const fetchTasks = async (user: User) => {
        try {
            const tasksCollection = collection(db, 'tasks');
            const tasksQuery = query(tasksCollection, where('userId', '==', user.id));
            const tasksSnapshot = await getDocs(tasksQuery);
            const fetchedTasks = tasksSnapshot.docs.map(doc => ({
                $id: doc.id,
                ...doc.data(),
            })) as Task[];
            setTasks(fetchedTasks);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message });
        }
    };

    // Task form handling
    const handleInputChange = (field: string, value: any) => {
        setNewTask(prev => ({ ...prev, [field]: value }));
    };

    const resetTaskForm = () => {
        setNewTask({
            title: '',
            description: '',
            priority: 'Medium',
            progressNotes: '',
            progress: 0,
            startTime: '',
            endTime: '',
            status: 'Not Started'
        });
        setEditingTask(null);
    };

    const validateTaskForm = () => {
        if (!newTask.title.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Task title is required" });
            return false;
        }
        if (!newTask.description.trim()) {
            toast({ variant: "destructive", title: "Error", description: "Task description is required" });
            return false;
        }
        return true;
    };

    const handleAddOrUpdateTask = async () => {
        if (!validateTaskForm() || !currentUser) return;

        setIsProcessing(true);
        const currentDate = new Date();
        const taskData = {
            userId: currentUser.id,
            title: newTask.title.trim(),
            task_description: newTask.description.trim(),
            date: selectedDate,
            status: newTask.status,
            priority: newTask.priority,
            progress_notes: newTask.progressNotes.trim(),
            progress: newTask.progress,
            created_at: editingTask?.created_at || currentDate.toISOString(),
            last_updated: currentDate.toISOString(),
            task_start_time: newTask.startTime,
            task_end_time: newTask.endTime,
        };

        try {
            if (editingTask) {
                const taskRef = doc(db, 'tasks', editingTask.$id);
                await updateDoc(taskRef, taskData);
                toast({ title: 'Success', description: 'Task updated successfully' });
            } else {
                const docRef = await addDoc(collection(db, 'tasks'), taskData);
                taskData.$id = docRef.id;
                toast({ title: 'Success', description: 'Task added successfully' });
            }

            setTasks((prev) =>
                editingTask
                    ? prev.map((t) => (t.$id === editingTask.$id ? { ...taskData, $id: editingTask.$id } : t))
                    : [...prev, { ...taskData, $id: taskData.$id }]
            );

            setTaskDialogOpen(false);
            resetTaskForm();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to add or update task',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!currentUser) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'User not authenticated',
            });
            return;
        }

        setIsProcessing(true);
        try {
            await deleteDoc(doc(db, 'tasks', taskId));
            setTasks((prev) => prev.filter((t) => t.$id !== taskId));
            toast({ title: 'Success', description: 'Task deleted successfully' });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.message || 'Failed to delete task',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setNewTask({
            title: task.title,
            description: task.task_description,
            priority: task.priority,
            progressNotes: task.progress_notes || '',
            progress: task.progress || 0,
            startTime: task.task_start_time,
            endTime: task.task_end_time,
            status: task.status
        });
        setTaskDialogOpen(true);
    };

    // Filtered tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const taskDate = task.date.split('T')[0];
            return taskDate === selectedDate &&
                (statusFilter === 'all' || task.status === statusFilter);
        });
    }, [tasks, selectedDate, statusFilter]);

    // UI Helper Functions
    const getStatusStyles = (status: string) => {
        const styles = {
            'Not Started': { color: 'bg-blue-100 text-blue-800', icon: <Clock size={16} className="text-blue-500" /> },
            'In Progress': { color: 'bg-yellow-100 text-yellow-800', icon: <PlayCircle size={16} className="text-yellow-500" /> },
            'Delayed': { color: 'bg-red-100 text-red-800', icon: <AlertCircle size={16} className="text-red-500" /> },
            'Completed': { color: 'bg-green-100 text-green-800', icon: <CheckCircle2 size={16} className="text-green-500" /> }
        };
        return styles[status as keyof typeof styles] || styles['Not Started'];
    };

    const getPriorityStyles = (priority: string) => {
        return {
            'High': 'bg-red-100 text-red-700',
            'Medium': 'bg-yellow-100 text-yellow-700',
            'Low': 'bg-green-100 text-green-700'
        }[priority] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-semibold text-blue-600">My Tasks</h1>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="border-blue-200 rounded-lg"
                            disabled={loading || isProcessing}
                        />
                        <Button
                            onClick={() => {
                                resetTaskForm();
                                setTaskDialogOpen(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            disabled={loading || isProcessing}
                        >
                            <Plus size={16} className="mr-2" />
                            Add Task
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-lg shadow-sm">
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                        disabled={loading || isProcessing}
                    >
                        <SelectTrigger className="w-full sm:w-40 border-blue-200 rounded-lg">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Not Started">Not Started</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Delayed">Delayed</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Task List */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredTasks.map(task => (
                        <div key={task.$id} className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className={`${getStatusStyles(task.status).color} rounded-full p-2`}>
                                        {getStatusStyles(task.status).icon}
                                    </span>
                                    <div>
                                        <h3 className="text-base font-medium text-gray-800">{task.title}</h3>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={`${getPriorityStyles(task.priority)} rounded-md px-2 py-1 text-xs`}>
                                        {task.priority}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTask(task)}
                                        className="text-blue-600 hover:bg-blue-100"
                                        disabled={loading || isProcessing}
                                    >
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTask(task.$id)}
                                        className="text-red-600 hover:bg-red-100"
                                        disabled={loading || isProcessing}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-3">
                                <p className="text-sm text-gray-600 line-clamp-2">{task.task_description}</p>
                                <div className="mt-2 flex justify-between items-center text-sm text-gray-600">
                                    <span>
                                        {task.task_start_time && task.task_end_time
                                            ? `${formatTime(task.task_start_time)} - ${formatTime(task.task_end_time)}`
                                            : 'No time set'}
                                    </span>
                                    <span>{task.progress}%</span>
                                </div>
                                <Progress
                                    value={task.progress}
                                    className="h-2 mt-2 bg-blue-100"
                                />
                            </div>
                        </div>
                    ))}
                    {filteredTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            No tasks found for the selected filters.
                        </div>
                    )}
                </div>

                {/* Task Dialog */}
                {taskDialogOpen && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg relative">
                            {isProcessing && (
                                <div className="absolute inset-0 bg-gray-200/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600"></div>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-blue-600">
                                    {editingTask ? 'Edit Task' : 'New Task'}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setTaskDialogOpen(false)}
                                    className="text-gray-500 hover:bg-gray-100"
                                    disabled={isProcessing}
                                >
                                    <X size={20} />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <Input
                                    placeholder="Task Title"
                                    value={newTask.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    className="border-blue-200 rounded-lg"
                                    disabled={isProcessing}
                                />

                                <Textarea
                                    placeholder="Task Description"
                                    value={newTask.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    className="min-h-[100px] border-blue-200 rounded-lg"
                                    disabled={isProcessing}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        value={newTask.priority}
                                        onValueChange={(value) => handleInputChange('priority', value)}
                                        disabled={isProcessing}
                                    >
                                        <SelectTrigger className="border-blue-200 rounded-lg">
                                            <SelectValue placeholder="Priority" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="High">High</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="Low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={newTask.status}
                                        onValueChange={(value) => handleInputChange('status', value)}
                                        disabled={isProcessing}
                                    >
                                        <SelectTrigger className="border-blue-200 rounded-lg">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Not Started">Not Started</SelectItem>
                                            <SelectItem value="In Progress">In Progress</SelectItem>
                                            <SelectItem value="Delayed">Delayed</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="time"
                                        value={newTask.startTime}
                                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                                        className="border-blue-200 rounded-lg"
                                        placeholder="Start Time"
                                        disabled={isProcessing}
                                    />
                                    <Input
                                        type="time"
                                        value={newTask.endTime}
                                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                                        className="border-blue-200 rounded-lg"
                                        placeholder="End Time"
                                        disabled={isProcessing}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Progress ({newTask.progress}%)</label>
                                    <Input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={newTask.progress}
                                        onChange={(e) => handleInputChange('progress', parseInt(e.target.value))}
                                        className="w-full"
                                        disabled={isProcessing}
                                    />
                                </div>

                                <Textarea
                                    placeholder="Progress Notes"
                                    value={newTask.progressNotes}
                                    onChange={(e) => handleInputChange('progressNotes', e.target.value)}
                                    className="min-h-[80px] border-blue-200 rounded-lg"
                                    disabled={isProcessing}
                                />
                            </div>

                            <div className="mt-6 flex gap-2">
                                <Button
                                    onClick={handleAddOrUpdateTask}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? 'Processing...' : editingTask ? 'Update Task' : 'Create Task'}
                                </Button>
                                <Button
                                    onClick={() => setTaskDialogOpen(false)}
                                    variant="outline"
                                    className="flex-1 border-blue-200 text-blue-600 rounded-lg"
                                    disabled={isProcessing}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {loading && (
                    <div className="fixed inset-0 bg-gray-200/50 flex items-center justify-center z-50">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TodoListDashboard;