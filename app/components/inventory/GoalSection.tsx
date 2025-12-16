'use client';

import React, { useState, useEffect } from 'react';
import { Goal } from '@/app/types/inventory';
import { goalAPI } from '@/app/api/inventory-client';
import GoalItem from './GoalItem';
import InputField from './InputField';

interface GoalSectionProps {
  user: any;
  isAtGoalLevel: boolean;
  goalLevelPosition: number;
  isTypingGoal: boolean;
  goalInput: string;
  inputStep: 'name' | 'deadline' | null;
  tempGoalName: string;
  tempGoalDeadline: string;
  onGoalsChange: (goals: Goal[]) => void;
  onPositionChange: (position: number) => void;
  onTypingChange: (isTyping: boolean) => void;
  onInputChange: (input: string) => void;
  onInputStepChange: (step: 'name' | 'deadline' | null) => void;
  onTempNameChange: (name: string) => void;
  onTempDeadlineChange: (deadline: string) => void;
}

export default function GoalSection({
  user,
  isAtGoalLevel,
  goalLevelPosition,
  isTypingGoal,
  goalInput,
  inputStep,
  tempGoalName,
  tempGoalDeadline,
  onGoalsChange,
  onPositionChange,
  onTypingChange,
  onInputChange,
  onInputStepChange,
  onTempNameChange,
  onTempDeadlineChange
}: GoalSectionProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState(true);
  const [grabbedGoalIndex, setGrabbedGoalIndex] = useState<number | null>(null);
  const [grabbedGoalOriginalIndex, setGrabbedGoalOriginalIndex] = useState<number | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [editingGoalIndex, setEditingGoalIndex] = useState<number | null>(null);
  const [editGoalName, setEditGoalName] = useState('');
  const [editGoalDeadline, setEditGoalDeadline] = useState('');
  const [editFieldFocus, setEditFieldFocus] = useState<'name' | 'deadline'>('name');

  // Load goals from database on mount
  useEffect(() => {
    const loadGoals = async () => {
      if (!user?.id) {
        setIsLoadingGoals(false);
        return;
      }

      try {
        console.log('[GoalSection] Loading goals for user:', user.id);
        const response = await fetch('/api/you');
        if (response.ok) {
          const data = await response.json();

          if (data.goals && Array.isArray(data.goals)) {
            const formattedGoals = data.goals.map((goal: any) => ({
              id: goal.id || goal._id,
              name: goal.content || goal.name,
              deadline: goal.deadline ? new Date(goal.deadline).toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric'
              }) : undefined,
              isExpanded: false
            }));
            console.log('[GoalSection] Formatted goals:', formattedGoals);
            setGoals(formattedGoals);
            onGoalsChange(formattedGoals);
          }
        }
      } catch (error) {
        console.error('[GoalSection] Error loading goals:', error);
      } finally {
        setIsLoadingGoals(false);
      }
    };

    loadGoals();
  }, [user]);

  // Handle goal creation
  const createGoal = async (name: string, deadline?: string, position?: number) => {
    const tempId = `temp-${Date.now()}`;
    const newGoal: Goal = {
      id: tempId,
      name,
      isExpanded: false,
      deadline
    };

    // Update local state first
    let updatedGoals: Goal[];
    if (position === 0) {
      updatedGoals = [newGoal, ...goals];
    } else if (position === undefined || position >= goals.length) {
      updatedGoals = [...goals, newGoal];
    } else {
      updatedGoals = [...goals];
      updatedGoals.splice(position, 0, newGoal);
    }

    setGoals(updatedGoals);
    onGoalsChange(updatedGoals);

    // Save to database
    try {
      const data = await goalAPI.create({
        name,
        deadline: deadline ? new Date(deadline) : undefined,
        order: position || goals.length
      });

      if (data.goal) {
        // Update with real ID
        const finalGoals = updatedGoals.map(g =>
          g.id === tempId ? { ...g, id: data.goal._id || data.goal.id } : g
        );
        setGoals(finalGoals);
        onGoalsChange(finalGoals);
      }
    } catch (error) {
      console.error('[GoalSection] Failed to save goal:', error);
    }
  };

  // Handle goal deletion
  const deleteGoal = async (goalId: string, index: number) => {
    const updatedGoals = goals.filter((_, i) => i !== index);
    setGoals(updatedGoals);
    onGoalsChange(updatedGoals);

    try {
      await goalAPI.delete(goalId);
    } catch (error) {
      console.error('[GoalSection] Failed to delete goal:', error);
    }
  };

  // Handle goal editing
  const updateGoal = async (index: number, name: string, deadline: string) => {
    const updatedGoal = {
      ...goals[index],
      name,
      deadline
    };

    const updatedGoals = [...goals];
    updatedGoals[index] = updatedGoal;
    setGoals(updatedGoals);
    onGoalsChange(updatedGoals);

    try {
      await goalAPI.update(updatedGoal.id, {
        content: name,
        deadline: deadline ? new Date(deadline) : undefined,
        order: index
      });
    } catch (error) {
      console.error('[GoalSection] Failed to update goal:', error);
    }
  };

  // Handle goal reordering
  const reorderGoals = async (fromIndex: number, toIndex: number) => {
    const newGoals = [...goals];
    const [movedGoal] = newGoals.splice(fromIndex, 1);
    newGoals.splice(toIndex, 0, movedGoal);
    setGoals(newGoals);
    onGoalsChange(newGoals);

    try {
      await goalAPI.reorder(
        newGoals.map((goal, index) => ({ id: goal.id, order: index }))
      );
    } catch (error) {
      console.error('[GoalSection] Failed to save goal order:', error);
    }
  };

  // Export methods for parent to use
  React.useImperativeHandle(
    React.useRef(null),
    () => ({
      handleEdit: (index: number) => {
        if (goals[index]) {
          setIsEditingGoal(true);
          setEditingGoalIndex(index);
          setEditGoalName(goals[index].name);
          setEditGoalDeadline(goals[index].deadline || '');
          setEditFieldFocus('name');
        }
      },
      handleDelete: (index: number) => {
        if (goals[index]) {
          deleteGoal(goals[index].id, index);
        }
      },
      handleGrab: (index: number) => {
        setGrabbedGoalIndex(index);
        setGrabbedGoalOriginalIndex(index);
      },
      handleRelease: () => {
        if (grabbedGoalIndex !== null && grabbedGoalOriginalIndex !== null &&
            grabbedGoalIndex !== grabbedGoalOriginalIndex) {
          reorderGoals(grabbedGoalOriginalIndex, grabbedGoalIndex);
        }
        setGrabbedGoalIndex(null);
        setGrabbedGoalOriginalIndex(null);
      },
      handleMoveGrabbedGoal: (direction: 'up' | 'down') => {
        if (grabbedGoalIndex !== null) {
          if (direction === 'down' && grabbedGoalIndex < goals.length - 1) {
            const newIndex = grabbedGoalIndex + 1;
            const newGoals = [...goals];
            [newGoals[grabbedGoalIndex], newGoals[newIndex]] = [newGoals[newIndex], newGoals[grabbedGoalIndex]];
            setGoals(newGoals);
            onGoalsChange(newGoals);
            setGrabbedGoalIndex(newIndex);
          } else if (direction === 'up' && grabbedGoalIndex > 0) {
            const newIndex = grabbedGoalIndex - 1;
            const newGoals = [...goals];
            [newGoals[grabbedGoalIndex], newGoals[newIndex]] = [newGoals[newIndex], newGoals[grabbedGoalIndex]];
            setGoals(newGoals);
            onGoalsChange(newGoals);
            setGrabbedGoalIndex(newIndex);
          }
        }
      },
      isGrabbing: () => grabbedGoalIndex !== null,
      isEditing: () => isEditingGoal,
      createGoal,
      goals
    }),
    [goals, grabbedGoalIndex, grabbedGoalOriginalIndex, isEditingGoal]
  );

  if (isLoadingGoals) {
    return <div className="py-2 text-gray-400 text-sm font-mono">Loading goals...</div>;
  }

  if (goals.length === 0) {
    // Empty state
    return (
      <div className="py-2">
        {isAtGoalLevel ? (
          <InputField
            label="GOAL 01"
            value={goalInput}
            placeholder="MM/DD/YYYY"
            inputStep={inputStep}
            tempName={tempGoalName}
          />
        ) : (
          <div className="text-gray-400 text-sm font-mono">
            No goals yet
          </div>
        )}
      </div>
    );
  }

  // Calculate display numbers and positions
  let displayOffset = 0;
  if (isAtGoalLevel && goalLevelPosition === -2) {
    displayOffset = 1; // Top input takes GOAL 01
  }

  return (
    <div className="space-y-4">
      {/* Top input for new goal */}
      {isAtGoalLevel && goalLevelPosition === -2 && (
        <InputField
          label="GOAL 01"
          value={goalInput}
          placeholder="MM/DD/YYYY"
          inputStep={inputStep}
          tempName={tempGoalName}
        />
      )}

      {/* Render existing goals */}
      {goals.map((goal, index) => {
        const hasInsertAfter = isAtGoalLevel && goalLevelPosition === -(index + 3);
        const displayNumber = index + 1 + displayOffset;

        return (
          <div key={goal.id}>
            <GoalItem
              goal={goal}
              index={index}
              displayNumber={displayNumber}
              isSelected={isAtGoalLevel && goalLevelPosition === index}
              isGrabbed={grabbedGoalIndex === index}
              isEditing={isEditingGoal && editingGoalIndex === index}
              editName={editGoalName}
              editDeadline={editGoalDeadline}
              editFieldFocus={editFieldFocus}
            />

            {/* Insert input after this goal */}
            {hasInsertAfter && (
              <InputField
                label={`GOAL ${String(displayNumber + 1).padStart(2, '0')}`}
                value={goalInput}
                placeholder="MM/DD/YYYY"
                inputStep={inputStep}
                tempName={tempGoalName}
                className="mt-2 pl-4"
              />
            )}
          </div>
        );
      })}

      {/* Bottom input for new goal */}
      {isAtGoalLevel && goalLevelPosition === -1 && (
        <InputField
          label={`GOAL ${String(goals.length + 1).padStart(2, '0')}`}
          value={goalInput}
          placeholder="MM/DD/YYYY"
          inputStep={inputStep}
          tempName={tempGoalName}
        />
      )}
    </div>
  );
}