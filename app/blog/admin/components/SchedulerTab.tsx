"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, CheckCircle, AlertCircle } from "lucide-react";

interface SchedulerTabProps {
  topicStats: {
    total: number;
    pending: number;
    generated: number;
    failed: number;
  };
}

export function SchedulerTab({ topicStats }: SchedulerTabProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduler Configuration
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Queue Statistics */}
          <div>
            <h3 className="text-lg font-medium mb-4">Queue Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Topics</span>
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {topicStats.total}
                </p>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-600">Pending</span>
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-yellow-900 mt-2">
                  {topicStats.pending}
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Generated</span>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-green-900 mt-2">
                  {topicStats.generated}
                </p>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Failed</span>
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </div>
                <p className="text-2xl font-bold text-red-900 mt-2">
                  {topicStats.failed}
                </p>
              </div>
            </div>
          </div>

          {/* Scheduler Info */}
          <div>
            <h3 className="text-lg font-medium mb-4">Scheduler Configuration</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">Active</Badge>
                  <span className="text-sm text-blue-900 font-medium">
                    Blog Generation Scheduler
                  </span>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>• Automatic retry on failure (max 3 attempts)</div>
                  <div>• Exponential backoff (5min, 10min, 20min)</div>
                  <div>• Persistent job storage in MongoDB</div>
                  <div>• Concurrent generation support</div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Generation Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Concurrent Jobs</p>
                  <p className="text-sm text-gray-600">
                    Number of blog posts that can be generated simultaneously
                  </p>
                </div>
                <Badge variant="secondary">3</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Retry Attempts</p>
                  <p className="text-sm text-gray-600">
                    Maximum retry attempts for failed generations
                  </p>
                </div>
                <Badge variant="secondary">3</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Job Timeout</p>
                  <p className="text-sm text-gray-600">
                    Maximum time allowed for each generation job
                  </p>
                </div>
                <Badge variant="secondary">10 minutes</Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}