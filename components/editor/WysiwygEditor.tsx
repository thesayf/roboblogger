"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import { useEffect, useCallback, useRef } from 'react';
import { EditorToolbar } from './EditorToolbar';
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
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export default WysiwygEditor;
