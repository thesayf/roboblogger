import React, { useRef, useEffect } from 'react';
import { Command } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  commandInput: string;
  onCommandChange: (value: string) => void;
  onExecuteCommand: (command: string) => void;
  onClose: () => void;
}

export default function CommandPalette({
  isOpen,
  commandInput,
  onCommandChange,
  onExecuteCommand,
  onClose,
}: CommandPaletteProps) {
  const commandInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && commandInputRef.current) {
      commandInputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-black text-green-400 p-2 z-50">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        <Command className="h-4 w-4" />
        <input
          ref={commandInputRef}
          type="text"
          value={commandInput}
          onChange={(e) => onCommandChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onExecuteCommand(commandInput);
              onCommandChange('');
            }
            if (e.key === 'Escape') {
              onClose();
              onCommandChange('');
            }
          }}
          className="flex-1 bg-transparent outline-none"
          placeholder="Type command..."
        />
      </div>
    </div>
  );
}