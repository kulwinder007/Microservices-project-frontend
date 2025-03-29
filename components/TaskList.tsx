'use client';

import { Task } from '@/app/tasks/page';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onStatusUpdate: (taskId: string, status: 'pending' | 'completed') => void;
}

export default function TaskList({ tasks, onStatusUpdate }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No tasks found
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={task.status === 'completed' ? 'secondary' : 'default'}>
                  {task.status}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStatusUpdate(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                >
                  Toggle Status
                </Button>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              Due: {format(new Date(task.dueDate), 'PPP')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}