"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { useEffect, useRef, useState } from 'react';
import { EditorToolbar } from './EditorToolbar';
import { Code, Eye } from 'lucide-react';
import './editor.css';

interface WysiwygEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  className?: string;
}

export function WysiwygEditor({
  value,
  onChange,
  placeholder = "Start writing your content...",
  className = ""
}: WysiwygEditorProps) {
  const isInternalUpdate = useRef(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'source'>('visual');
  const [sourceValue, setSourceValue] = useState(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      // Debounce the onChange to reduce API calls
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        isInternalUpdate.current = true;
        const markdown = editor.storage.markdown.getMarkdown();
        setSourceValue(markdown);
        onChange(markdown);
      }, 300);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  // Update editor content when value prop changes externally
  useEffect(() => {
    if (editor && !isInternalUpdate.current) {
      const currentContent = editor.storage.markdown.getMarkdown();
      if (value !== currentContent) {
        editor.commands.setContent(value || '');
        setSourceValue(value || '');
      }
    }
    isInternalUpdate.current = false;
  }, [value, editor]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Handle switching from source to visual mode
  const handleModeSwitch = (mode: 'visual' | 'source') => {
    if (mode === 'visual' && viewMode === 'source' && editor) {
      // Switching from source to visual - update the editor with source content
      editor.commands.setContent(sourceValue);
      onChange(sourceValue);
    } else if (mode === 'source' && viewMode === 'visual' && editor) {
      // Switching from visual to source - get current markdown
      const markdown = editor.storage.markdown.getMarkdown();
      setSourceValue(markdown);
    }
    setViewMode(mode);
  };

  // Handle source textarea changes
  const handleSourceChange = (newValue: string) => {
    setSourceValue(newValue);
    // Debounce the onChange
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  if (!editor) {
    return (
      <div className={`wysiwyg-editor ${className}`}>
        <div className="editor-toolbar animate-pulse bg-gray-100 h-12" />
        <div className="min-h-[200px] p-4 bg-white animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`wysiwyg-editor ${className}`}>
      {/* Mode Toggle Tabs */}
      <div className="flex items-center justify-between border-b bg-slate-50">
        <div className="flex">
          <button
            type="button"
            onClick={() => handleModeSwitch('visual')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'visual'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-4 h-4" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('source')}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'source'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Code className="w-4 h-4" />
            Markdown
          </button>
        </div>
      </div>

      {/* Visual Mode */}
      {viewMode === 'visual' && (
        <>
          <EditorToolbar editor={editor} />
          <EditorContent editor={editor} />
        </>
      )}

      {/* Source/Markdown Mode */}
      {viewMode === 'source' && (
        <div className="source-editor">
          <textarea
            value={sourceValue}
            onChange={(e) => handleSourceChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[250px] p-4 font-mono text-sm text-gray-800 bg-white border-0 resize-y focus:outline-none focus:ring-0"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );
}

export default WysiwygEditor;
