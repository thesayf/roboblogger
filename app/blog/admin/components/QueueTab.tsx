"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Clock,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Zap,
  MoreVertical,
  Play,
  Trash2,
  Edit,
  RefreshCw,
  Calendar,
} from "lucide-react";

interface Topic {
  _id: string;
  topic: string;
  status: string;
  generationStatus?: string;
  scheduledAt?: string;
  priority: string;
  tags: string[];
  generatedPost?: string;
  error?: string;
  attempts?: number;
  lastAttempt?: string;
}

interface QueueTabProps {
  topics: Topic[];
  isLoadingTopics: boolean;
  selectedTopics: string[];
  setSelectedTopics: (topics: string[]) => void;
  refreshTopics: () => void;
}

export function QueueTab({
  topics,
  isLoadingTopics,
  selectedTopics,
  setSelectedTopics,
  refreshTopics,
}: QueueTabProps) {
  const router = useRouter();
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleTopicId, setRescheduleTopicId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const toggleTopicSelection = (topicId: string) => {
    setSelectedTopics(
      selectedTopics.includes(topicId)
        ? selectedTopics.filter((id) => id !== topicId)
        : [...selectedTopics, topicId]
    );
  };

  const selectAllPendingTopics = () => {
    const pendingTopicIds = topics
      .filter((t) => t.status === "pending")
      .map((t) => t._id);
    setSelectedTopics(pendingTopicIds);
  };

  const clearSelection = () => {
    setSelectedTopics([]);
  };

  const handleBatchGeneration = async () => {
    if (selectedTopics.length === 0) return;

    try {
      setIsBatchGenerating(true);
      const response = await fetch("/api/blog/topics/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicIds: selectedTopics }),
      });

      if (response.ok) {
        refreshTopics();
        clearSelection();
      }
    } catch (error) {
      console.error("Batch generation error:", error);
    } finally {
      setIsBatchGenerating(false);
    }
  };

  const handleGenerateTopic = async (topicId: string) => {
    try {
      const response = await fetch(`/api/blog/topics/${topicId}/generate`, {
        method: "POST",
      });

      if (response.ok) {
        refreshTopics();
      }
    } catch (error) {
      console.error("Generation error:", error);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure you want to delete this topic?")) return;

    try {
      const response = await fetch(`/api/blog/topics/${topicId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        refreshTopics();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleRescheduleTopic = async () => {
    if (!rescheduleTopicId || !rescheduleDate) return;

    try {
      setIsRescheduling(true);
      const response = await fetch(`/api/blog/topics/${rescheduleTopicId}/reschedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scheduledAt: new Date(rescheduleDate).toISOString() 
        }),
      });

      if (response.ok) {
        refreshTopics();
        setShowRescheduleDialog(false);
        setRescheduleTopicId(null);
        setRescheduleDate("");
      }
    } catch (error) {
      console.error("Reschedule error:", error);
    } finally {
      setIsRescheduling(false);
    }
  };

  const openRescheduleDialog = (topicId: string) => {
    setRescheduleTopicId(topicId);
    setRescheduleDate(new Date().toISOString().slice(0, 16));
    setShowRescheduleDialog(true);
  };

  const getStatusBadge = (topic: Topic) => {
    if (topic.generationStatus === "failed") {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Failed
        </Badge>
      );
    }
    if (topic.generationStatus === "generating") {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Generating
        </Badge>
      );
    }
    if (topic.generatedPost) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" />
          Generated
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
        Pending
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Blog Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedTopics.length > 0 && (
                <div className="flex items-center gap-2 mr-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    {selectedTopics.length} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </Button>
                </div>
              )}

              {selectedTopics.length > 0 && (
                <Button
                  onClick={handleBatchGeneration}
                  disabled={isBatchGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isBatchGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate {selectedTopics.length}
                    </>
                  )}
                </Button>
              )}

              {topics.filter((t) => t.status === "pending").length > 0 &&
                selectedTopics.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={selectAllPendingTopics}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Select All Pending
                  </Button>
                )}

              <Button
                variant="outline"
                onClick={() => router.push("/blog/admin/bulk")}
              >
                <Zap className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTopics ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading topics...</span>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No topics in queue.</p>
              <Button
                className="mt-4"
                onClick={() => router.push("/blog/admin/bulk")}
              >
                Add topics to queue
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {topics.map((topic) => (
                <div
                  key={topic._id}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors ${
                    selectedTopics.includes(topic._id)
                      ? "bg-blue-50 border-blue-300"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {topic.status === "pending" && !topic.generatedPost && (
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic._id)}
                      onChange={() => toggleTopicSelection(topic._id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                  )}

                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{topic.topic}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(topic.scheduledAt)}
                      </span>
                      {topic.error && (
                        <span className="text-red-600">
                          Error: {topic.error}
                        </span>
                      )}
                      {topic.attempts && topic.attempts > 0 && (
                        <span>Attempts: {topic.attempts}</span>
                      )}
                    </div>
                    {topic.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {topic.tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(topic)}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {topic.generatedPost ? (
                          <DropdownMenuItem
                            onClick={() => router.push(`/blog/admin/edit/${topic.generatedPost}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Post
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleGenerateTopic(topic._id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Generate Now
                          </DropdownMenuItem>
                        )}
                        
                        {(topic.generationStatus === "failed" || !topic.scheduledAt) && (
                          <DropdownMenuItem
                            onClick={() => openRescheduleDialog(topic._id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem
                          onClick={() => handleDeleteTopic(topic._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Topic</DialogTitle>
            <DialogDescription>
              Set a new date and time for this topic to be generated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                New Schedule Date/Time
              </label>
              <Input
                type="datetime-local"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowRescheduleDialog(false)}
              disabled={isRescheduling}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleTopic}
              disabled={isRescheduling || !rescheduleDate}
            >
              {isRescheduling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}