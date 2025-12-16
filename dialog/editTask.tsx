import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Task, PreviewSchedule } from "@/app/context/models";
import { useAppContext } from "@/app/context/AppContext";
import toast from "react-hot-toast";

interface EditTaskDialogProps {
  task: Task;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  isPreviewMode: boolean;
}

const updatePreviewStorage = (updatedSchedule: PreviewSchedule) => {
  localStorage.setItem("schedule", JSON.stringify(updatedSchedule));
};

export function EditTaskDialog({
  task,
  onClose,
  onSave,
  isPreviewMode,
}: EditTaskDialogProps) {
  const { setPreviewSchedule } = useAppContext();
  // We assume the Task type includes "duration" (number) and "isCustomDuration" (boolean)
  const [formData, setFormData] = React.useState<Task>(task);
  const [errors, setErrors] = React.useState({
    name: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" ? Number(value) : value,
    }));

    // Clear name error when user types in name field
    if (name === "name" && value.trim() !== "") {
      setErrors((prev) => ({ ...prev, name: false }));
    }
  };

  // For the duration select, we use a custom name ("durationSelect")
  const handleSelectChange = (name: string, value: string) => {
    if (name === "durationSelect") {
      if (value === "custom") {
        setFormData((prev) => ({
          ...prev,
          duration: 0,
          isCustomDuration: true,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          duration: parseInt(value),
          isCustomDuration: false,
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors((prev) => ({ ...prev, name: true }));
      toast.error("Task name is required");
      return;
    }

    if (isPreviewMode) {
      try {
        const previewSchedule = JSON.parse(
          localStorage.getItem("schedule") ||
            JSON.stringify({
              currentTime: new Date().toLocaleTimeString(),
              scheduleRationale: "",
              userStartTime: "",
              userEndTime: "",
              blocks: [],
            })
        );
        const blockIndex = previewSchedule.blocks.findIndex((block: any) =>
          block.tasks.some((t: Task) => t._id === task._id)
        );
        if (blockIndex === -1) {
          console.error("Could not find block containing task");
          toast.error("Failed to update task: Could not find containing block");
          return;
        }
        const updatedBlocks = [...previewSchedule.blocks];
        updatedBlocks[blockIndex] = {
          ...updatedBlocks[blockIndex],
          tasks: updatedBlocks[blockIndex].tasks.map((t: Task) => {
            if (t._id === task._id) {
              return {
                ...formData,
                _id: task._id,
                block: updatedBlocks[blockIndex]._id,
                blockId: updatedBlocks[blockIndex]._id,
              };
            }
            return t;
          }),
        };
        const updatedSchedule = {
          ...previewSchedule,
          blocks: updatedBlocks,
        };
        localStorage.setItem("schedule", JSON.stringify(updatedSchedule));
        setPreviewSchedule(updatedSchedule);
        toast.success("Task updated in preview");
      } catch (error) {
        console.error("Error updating task in preview mode:", error);
        toast.error("Failed to update task in preview mode");
      }
    } else {
      try {
        onSave(formData);
        toast.success("Task updated successfully");
      } catch (error) {
        console.error("Error saving task:", error);
        toast.error("Failed to save task changes");
        return;
      }
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Task</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="name">
              Task Name <span className="text-red-500">*</span>
            </Label>
            {errors.name && (
              <span className="text-xs text-red-500">
                Task name is required
              </span>
            )}
          </div>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={
              errors.name ? "border-red-500 focus-visible:ring-red-500" : ""
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Add a description (optional)"
          />
        </div>

        {/* Duration section with Select for preset durations and custom input */}
        <div className="space-y-2">
          <Label htmlFor="durationSelect">Duration (minutes)</Label>
          <div className="space-y-2">
            <Select
              value={
                formData.isCustomDuration
                  ? "custom"
                  : formData.duration?.toString() || "0"
              }
              onValueChange={(value) =>
                handleSelectChange("durationSelect", value)
              }
            >
              <SelectTrigger id="durationSelect" className="w-full">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Can be done in parallel</SelectItem>
                <SelectItem value="5">5 minutes</SelectItem>
                <SelectItem value="10">10 minutes</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="custom">Custom duration...</SelectItem>
              </SelectContent>
            </Select>
            {formData.isCustomDuration && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="480"
                  name="duration"
                  value={formData.duration || ""}
                  onChange={handleChange}
                  className="flex-1"
                  placeholder="Enter duration in minutes"
                />
                <span className="text-sm text-gray-500 w-16">minutes</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            className={`${
              errors.name
                ? "bg-blue-400 hover:bg-blue-500"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </>
  );
}
