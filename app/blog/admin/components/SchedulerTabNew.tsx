"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Calendar, 
  RefreshCw, 
  PlayCircle,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Loader2,
  StopCircle,
  RotateCcw
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Topic {
  _id: string;
  topic: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generationPhase?: 'initializing' | 'searching' | 'writing_content' | 'generating_images' | 'saving';
  scheduledAt?: string;
  processingStartedAt?: string;
  retryCount?: number;
  errorMessage?: string;
  failureReason?: string;
  updatedAt: string;
}

interface SchedulerTabProps {
  topics: Topic[];
  isLoadingTopics: boolean;
  onRefresh: () => void;
}

export function SchedulerTab({ topics, isLoadingTopics, onRefresh }: SchedulerTabProps) {
  const [serverTime, setServerTime] = useState<Date>(new Date());
  const [timezone, setTimezone] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingTopics, setProcessingTopics] = useState<Set<string>>(new Set());

  // Update server time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setServerTime(new Date());
    }, 1000);

    // Get timezone info
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);

    return () => clearInterval(interval);
  }, []);

  // Filter topics by status
  const pendingTopics = topics.filter(t => t.status === 'pending');
  const scheduledTopics = pendingTopics.filter(t => t.scheduledAt);
  const generatingTopics = topics.filter(t => t.status === 'generating');
  const recentlyCompleted = topics
    .filter(t => t.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  const failedTopics = topics.filter(t => t.status === 'failed');

  // Topics due for processing
  const dueTopics = scheduledTopics.filter(t => {
    const scheduledTime = new Date(t.scheduledAt!);
    return scheduledTime <= serverTime;
  });

  // Upcoming topics
  const upcomingTopics = scheduledTopics.filter(t => {
    const scheduledTime = new Date(t.scheduledAt!);
    return scheduledTime > serverTime;
  }).sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  const triggerCron = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/cron/process-scheduled-topics');
      const data = await response.json();
      
      if (data.success) {
        alert(`Cron executed successfully:\n${data.results?.processed || 0} topics processed\n${data.results?.triggered?.length || 0} generation jobs started`);
        onRefresh();
      } else {
        alert('Cron execution failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to trigger cron: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const generateTopic = async (topicId: string) => {
    setProcessingTopics(prev => new Set(prev).add(topicId));
    try {
      const response = await fetch(`/api/blog/topics/${topicId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        alert('Topic generation started successfully');
        onRefresh();
      } else {
        const error = await response.text();
        alert(`Failed to generate topic: ${error}`);
      }
    } catch (error) {
      alert('Failed to generate topic: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  const resetTopic = async (topicId: string) => {
    setProcessingTopics(prev => new Set(prev).add(topicId));
    try {
      const response = await fetch(`/api/blog/topics/${topicId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'pending',
          retryCount: 0
        })
      });
      
      if (response.ok) {
        alert('Topic reset successfully');
        onRefresh();
      } else {
        const error = await response.text();
        alert(`Failed to reset topic: ${error}`);
      }
    } catch (error) {
      alert('Failed to reset topic: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessingTopics(prev => {
        const newSet = new Set(prev);
        newSet.delete(topicId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (topic: Topic) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      generating: { label: 'Generating', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Failed', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[topic.status];
    return (
      <Badge className={config.className}>
        {config.label}
        {topic.retryCount && topic.retryCount > 0 && (
          <span className="ml-1">({topic.retryCount} retries)</span>
        )}
      </Badge>
    );
  };

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'HH:mm:ss');
  };

  const formatScheduledDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div className="space-y-6">
      {/* System Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Status
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={triggerCron}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <PlayCircle className="h-4 w-4 mr-2" />
                )}
                Trigger Cron
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isLoadingTopics}
              >
                {isLoadingTopics ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Server Time</div>
              <div className="text-lg font-mono font-medium">
                {format(serverTime, 'HH:mm:ss')}
              </div>
              <div className="text-sm text-gray-500">
                {format(serverTime, 'dd/MM/yyyy')} ({timezone})
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">Cron Schedule</div>
              <div className="text-lg font-medium text-blue-900">
                Every 5 minutes
              </div>
              <div className="text-sm text-blue-500">*/5 * * * *</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">API Status</div>
              <div className="text-lg font-medium text-green-900 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Operational
              </div>
              <div className="text-sm text-green-500">Vercel Cron Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Processing */}
      {(generatingTopics.length > 0 || dueTopics.length > 0) && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Timer className="h-5 w-5 animate-pulse" />
              Active Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            {generatingTopics.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Currently Generating</h4>
                <div className="space-y-2">
                  {generatingTopics.map((topic) => (
                    <div key={topic._id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{topic.topic}</div>
                        {topic.generationPhase && (
                          <div className="text-sm text-blue-600 font-medium">
                            Status: {topic.generationPhase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                        )}
                        {topic.processingStartedAt && (
                          <div className="text-sm text-gray-600">
                            Started {formatDistanceToNow(new Date(topic.processingStartedAt), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resetTopic(topic._id)}
                          disabled={processingTopics.has(topic._id)}
                          title="Cancel generation"
                        >
                          <StopCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dueTopics.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Due for Processing ({dueTopics.length})
                </h4>
                <div className="space-y-2">
                  {dueTopics.map((topic) => (
                    <div key={topic._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{topic.topic}</div>
                        <div className="text-sm text-gray-600">
                          Scheduled for {formatScheduledTime(topic.scheduledAt!)} - 
                          {' '}{formatDistanceToNow(new Date(topic.scheduledAt!), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => generateTopic(topic._id)}
                          disabled={processingTopics.has(topic._id)}
                          title="Generate now"
                        >
                          {processingTopics.has(topic._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Topics */}
      {upcomingTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Scheduled Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingTopics.slice(0, 10).map((topic) => (
                <div key={topic._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{topic.topic}</div>
                    <div className="text-sm text-gray-600">
                      {formatScheduledDate(topic.scheduledAt!)} at {formatScheduledTime(topic.scheduledAt!)}
                      {' - '}{formatDistanceToNow(new Date(topic.scheduledAt!), { addSuffix: true })}
                    </div>
                  </div>
                  {getStatusBadge(topic)}
                </div>
              ))}
              {upcomingTopics.length > 10 && (
                <div className="text-sm text-gray-500 text-center mt-2">
                  And {upcomingTopics.length - 10} more...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed Topics */}
      {failedTopics.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              Failed Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {failedTopics.map((topic) => (
                <div key={topic._id} className="p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{topic.topic}</div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(topic)}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetTopic(topic._id)}
                        disabled={processingTopics.has(topic._id)}
                        title="Reset topic"
                      >
                        {processingTopics.has(topic._id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => generateTopic(topic._id)}
                        disabled={processingTopics.has(topic._id)}
                        title="Retry generation"
                      >
                        {processingTopics.has(topic._id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlayCircle className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {topic.errorMessage && (
                    <div className="text-sm text-red-700 mt-1">
                      <span className="font-medium">Error:</span> {topic.errorMessage}
                    </div>
                  )}
                  {topic.failureReason && (
                    <div className="text-sm text-red-700 mt-1">
                      <span className="font-medium">Reason:</span> {topic.failureReason}
                    </div>
                  )}
                  {!topic.errorMessage && !topic.failureReason && (
                    <div className="text-sm text-red-700 mt-1">
                      <span className="font-medium">Status:</span> Failed (no details available)
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    Failed {formatDistanceToNow(new Date(topic.updatedAt), { addSuffix: true })}
                    {topic.retryCount === 3 && ' • Max retries reached'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Completions */}
      {recentlyCompleted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Recently Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentlyCompleted.map((topic) => (
                <div key={topic._id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{topic.topic}</div>
                    <div className="text-sm text-gray-600">
                      Completed {formatDistanceToNow(new Date(topic.updatedAt), { addSuffix: true })}
                    </div>
                  </div>
                  {getStatusBadge(topic)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{pendingTopics.length}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{generatingTopics.length}</div>
              <div className="text-sm text-blue-600">Generating</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {topics.filter(t => t.status === 'completed').length}
              </div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{failedTopics.length}</div>
              <div className="text-sm text-red-600">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}