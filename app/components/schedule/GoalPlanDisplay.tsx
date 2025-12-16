import React from 'react';
import { Target, Calendar, Clock, CheckCircle, Folder, ListTodo, CalendarDays, Repeat } from 'lucide-react';

interface GoalPlanData {
  plan: {
    title: string;
    duration: string;
    description: string;
    goal: {
      content: string;
      deadline: string;
      color?: string;
    };
    projects: Array<{
      name: string;
      dueDate?: string;
      tasks: Array<{
        title: string;
        duration: number;
        dueDate?: string;
      }>;
    }>;
    routines: Array<{
      name: string;
      days: string[];
      startTime: string;
      duration: number;
      startDate: string;
      endDate: string;
      tasks: Array<{
        title: string;
        duration: number;
      }>;
    }>;
    tasks: Array<{
      title: string;
      duration: number;
      dueDate?: string;
    }>;
    events: Array<{
      name: string;
      date: string;
      time: string;
      duration: number;
    }>;
  };
  summary: string;
  stats: {
    totalItems: number;
    goals: number;
    projects: number;
    projectTasks: number;
    routines: number;
    standaloneTasks: number;
    events: number;
  };
}

interface GoalPlanDisplayProps {
  data: GoalPlanData;
  message?: string;
}

export default function GoalPlanDisplay({ data, message }: GoalPlanDisplayProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Plan Header */}
      <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 text-purple-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">{data.plan.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{data.plan.description}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {data.plan.duration}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline: {formatDate(data.plan.goal.deadline)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Goal */}
      <div className="mb-4">
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-yellow-600" />
            <span className="font-medium text-sm">Primary Goal</span>
          </div>
          <p className="mt-1 text-gray-700">{data.plan.goal.content}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-semibold">{data.stats.projects}</div>
          <div className="text-xs text-gray-500">Projects</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-semibold">{data.stats.routines}</div>
          <div className="text-xs text-gray-500">Routines</div>
        </div>
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-lg font-semibold">{data.stats.events}</div>
          <div className="text-xs text-gray-500">Check-ins</div>
        </div>
      </div>

      {/* Projects Section */}
      {data.plan.projects.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Folder className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold text-sm text-gray-700">Projects</h3>
          </div>
          <div className="space-y-2">
            {data.plan.projects.map((project, idx) => (
              <div key={idx} className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-800">{project.name}</div>
                    {project.dueDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Due: {formatDate(project.dueDate)}
                      </div>
                    )}
                    {project.tasks.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {project.tasks.map((task, taskIdx) => (
                          <div key={taskIdx} className="flex items-center gap-2 text-xs text-gray-600 ml-4">
                            <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                            <span className="flex-1">{task.title}</span>
                            <span className="text-gray-400">{task.duration}m</span>
                            {task.dueDate && (
                              <span className="text-gray-400">{formatDate(task.dueDate)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Routines Section */}
      {data.plan.routines.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Repeat className="h-4 w-4 text-green-600" />
            <h3 className="font-semibold text-sm text-gray-700">Routines</h3>
          </div>
          <div className="space-y-2">
            {data.plan.routines.map((routine, idx) => (
              <div key={idx} className="border border-green-200 bg-green-50 rounded-lg p-3">
                <div className="font-medium text-sm text-gray-800">{routine.name}</div>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-600">
                  <span>{routine.days.join(', ')}</span>
                  <span>@ {formatTime(routine.startTime)}</span>
                  <span>{routine.duration} min</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(routine.startDate)} - {formatDate(routine.endDate)}
                </div>
                {routine.tasks.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {routine.tasks.map((task, taskIdx) => (
                      <div key={taskIdx} className="flex items-center gap-2 text-xs text-gray-600 ml-4">
                        <span className="w-1 h-1 bg-green-400 rounded-full"></span>
                        <span className="flex-1">{task.title}</span>
                        <span className="text-gray-400">{task.duration}m</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standalone Tasks Section */}
      {data.plan.tasks.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <ListTodo className="h-4 w-4 text-purple-600" />
            <h3 className="font-semibold text-sm text-gray-700">Additional Tasks</h3>
          </div>
          <div className="space-y-1">
            {data.plan.tasks.map((task, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                <span className="flex-1">{task.title}</span>
                <span className="text-xs text-gray-500">{task.duration}m</span>
                {task.dueDate && (
                  <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Section */}
      {data.plan.events.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-orange-600" />
            <h3 className="font-semibold text-sm text-gray-700">Check-in Events</h3>
          </div>
          <div className="space-y-2">
            {data.plan.events.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded">
                <div>
                  <div className="text-sm font-medium">{event.name}</div>
                  <div className="text-xs text-gray-600">
                    {formatDate(event.date)} at {formatTime(event.time)}
                  </div>
                </div>
                <span className="text-xs text-gray-500">{event.duration}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {data.summary && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">{data.summary}</p>
        </div>
      )}

      {/* Confirmation Message */}
      {message && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-center">
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      )}
    </div>
  );
}