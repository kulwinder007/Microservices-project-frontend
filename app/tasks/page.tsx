'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle, LogOut } from 'lucide-react';
import TaskList from '@/components/TaskList';
import CreateTaskDialog from '@/components/CreateTaskDialog';
import { fetchTasks, createTask, updateTaskStatus, validateSession } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'completed';
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await validateSession();
      if (!session) {
        router.push('/');
        return;
      }
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
      }
      loadTasks();
    } catch (error) {
      router.push('/');
    }
  };

  const loadTasks = async () => {
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const addTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const newTask = await createTask(taskData);
      setTasks([...tasks, newTask]);
      toast({
        title: 'Success',
        description: 'Task created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (taskId: string, status: 'pending' | 'completed'): Promise<void> => {
    try {
      await updateTaskStatus(taskId, status);
      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      toast({
        title: 'Success',
        description: 'Task status updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  const getDueSoonTasks = () => {
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
    return tasks.filter(task => 
      new Date(task.dueDate) <= twoDaysFromNow && 
      new Date(task.dueDate) >= new Date() &&
      task.status === 'pending'
    );
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Task Overview</h1>
        <div className="flex items-center gap-4">
          <span className="text-lg">Welcome, {userName}</span>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Task
        </Button>
      </div>

      <div className="grid gap-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Tasks Due in 2 Days</h2>
          <TaskList tasks={getDueSoonTasks()} onStatusUpdate={handleStatusUpdate} />
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">All Tasks</h2>
          <TaskList tasks={tasks} onStatusUpdate={handleStatusUpdate} />
        </section>
      </div>

      <CreateTaskDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTaskCreate={addTask}
      />
    </div>
  );
}