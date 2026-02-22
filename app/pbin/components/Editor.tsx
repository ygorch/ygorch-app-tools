'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Quote, Code } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { useCallback, useEffect } from 'react';
import { useLanguage } from '@/app/hooks/useLanguage';

interface EditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (content: any) => void;
  editable?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MenuBar = ({ editor }: { editor: any }) => {
  const addImage = useCallback(() => {
    if (!editor) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        try {
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1280,
            useWebWorker: true,
          });

          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
             if (reader.result) {
                editor.chain().focus().setImage({ src: reader.result as string }).run();
             }
          };
        } catch (error) {
          console.error('Error compressing image:', error);
        }
      }
    };
    input.click();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex gap-2 p-2 mb-4 bg-white/5 border border-white/10 rounded-lg flex-wrap sticky top-24 z-10 backdrop-blur-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded transition-colors ${editor.isActive('bold') ? 'bg-orange-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
        title="Bold"
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded transition-colors ${editor.isActive('italic') ? 'bg-orange-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
        title="Italic"
      >
        <Italic size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-orange-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
        title="Bullet List"
      >
        <List size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-orange-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-orange-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
        title="Blockquote"
      >
        <Quote size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-2 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-orange-500 text-white' : 'text-white/70 hover:bg-white/10'}`}
        title="Code Block"
      >
        <Code size={18} />
      </button>
      <button
        onClick={addImage}
        className="p-2 rounded transition-colors text-white/70 hover:bg-white/10"
        title="Add Image"
      >
        <ImageIcon size={18} />
      </button>
    </div>
  );
};

export default function Editor({ content, onChange, editable = true }: EditorProps) {
  const { t } = useLanguage();

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageExtension.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: t.pasteBin?.placeholder || 'Start typing...',
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-orange max-w-none focus:outline-none min-h-[300px]',
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && content && Object.keys(content).length > 0) {
      if (editor.isEmpty) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  return (
    <div className="w-full">
      {editable && <MenuBar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
