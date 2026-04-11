import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontSize } from '../extensions/FontSize';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Youtube from '@tiptap/extension-youtube';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { 
  Undo, Redo, Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Subscript as SubscriptIcon, Superscript as SuperscriptIcon, Code, 
  Eraser, Type, Highlighter, AlignLeft, AlignCenter, AlignRight, 
  AlignJustify, List, ListOrdered, CheckSquare, Outdent, Indent, 
  Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, 
  Table as TableIcon, Plus, Minus, Grid, Columns, Rows, 
  Split, Merge, Trash2, Minus as HorizontalRuleIcon, CornerDownLeft,
  ChevronDown, Maximize2, Eye, Edit3, X
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const lowlight = createLowlight(common);

export const getEditorExtensions = (placeholder: string = "Write your post content here...") => [
  StarterKit.configure({
    codeBlock: false,
  }),
  Underline,
  TextStyle,
  FontSize,
  Color,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-600 underline cursor-pointer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-xl max-w-full h-auto',
    },
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
  Placeholder.configure({
    placeholder,
  }),
  CharacterCount,
  Subscript,
  Superscript,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Youtube.configure({
    width: 640,
    height: 480,
  }),
  CodeBlockLowlight.configure({
    lowlight,
  }),
];

interface RichTextEditorProps {
  editor: Editor | null;
  content: string;
  onChange?: (html: string) => void;
  placeholder?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false, 
  children, 
  title 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean; 
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
      isActive ? "bg-gray-200 dark:bg-gray-700 text-primary" : "text-gray-600 dark:text-gray-400",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {children}
  </button>
);

const ColorPicker = ({ 
  color, 
  onChange, 
  label, 
  icon: Icon 
}: { 
  color: string; 
  onChange: (color: string) => void; 
  label: string;
  icon: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
    '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
    '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
    '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
    '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
    '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
    '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
    '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center gap-1"
        title={label}
      >
        <Icon className="h-4 w-4" />
        <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color || 'transparent' }} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl z-20 w-48">
            <div className="grid grid-cols-10 gap-1 mb-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setIsOpen(false);
                  }}
                  className="w-4 h-4 rounded-sm border border-gray-200 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="#000000"
                className="flex-grow text-xs p-1 border border-gray-200 dark:border-gray-800 rounded bg-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onChange((e.target as HTMLInputElement).value);
                    setIsOpen(false);
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded"
              >
                Clear
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const FontSizeControl = ({ editor }: { editor: any }) => {
  const [fontSize, setFontSize] = useState(16);

  const MIN_SIZE = 1;
  const MAX_SIZE = 100;

  const applySize = (size: number) => {
    const clamped = Math.min(Math.max(size, MIN_SIZE), MAX_SIZE);
    setFontSize(clamped);
    editor.chain().focus().setFontSize(`${clamped}px`).run();
  };

  const decrease = () => applySize(fontSize - 1);
  const increase = () => applySize(fontSize + 1);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) applySize(val);
  };

  // Long press support for mobile — hold + or - to 
  // keep incrementing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = (action: () => void) => {
    action();
    intervalRef.current = setInterval(action, 100);
  };

  const stopHold = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Sync displayed size when editor selection changes
  useEffect(() => {
    if (!editor) return;

    const updateSize = () => {
      const attrs = editor.getAttributes('textStyle');
      if (attrs?.fontSize) {
        const size = parseInt(attrs.fontSize);
        if (!isNaN(size)) setFontSize(size);
      }
    };

    editor.on('selectionUpdate', updateSize);
    editor.on('transaction', updateSize);

    return () => {
      editor.off('selectionUpdate', updateSize);
      editor.off('transaction', updateSize);
    };
  }, [editor]);

  return (
    <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-1 py-1 select-none">
      {/* Decrease button */}
      <button
        type="button"
        onPointerDown={() => startHold(decrease)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 active:scale-95 transition-all font-black text-base leading-none"
        title="Decrease font size"
      >
        −
      </button>

      {/* Size input */}
      <input
        type="number"
        min={MIN_SIZE}
        max={MAX_SIZE}
        value={isNaN(fontSize) ? 16 : fontSize}
        onChange={handleInput}
        className="w-10 text-center text-xs font-black bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md py-1 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        title="Font size"
      />

      {/* Increase button */}
      <button
        type="button"
        onPointerDown={() => startHold(increase)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 active:scale-95 transition-all font-black text-base leading-none"
        title="Increase font size"
      >
        +
      </button>
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  editor,
  content, 
  onChange, 
  placeholder = "Write your post content here..." 
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const addImage = useCallback(() => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `posts/images/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    }
  };

  const openLinkModal = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
    setShowLinkModal(true);
  }, [editor]);

  const saveLink = useCallback(() => {
    if (linkUrl === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkModal(false);
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
  }, [editor]);

  const addYoutubeVideo = useCallback(() => {
    const url = window.prompt('Enter YouTube URL');
    if (url) {
      editor?.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
      {/* Preview Toggle */}
      <div className="flex justify-end p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50">
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isPreview ? (
            <>
              <Edit3 className="h-4 w-4" />
              Edit Mode
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Preview Mode
            </>
          )}
        </button>
      </div>

      {!isPreview ? (
        <>
          {/* Toolbar — Sticky & Horizontally Scrollable on Mobile */}
          <div className="sticky top-0 z-30 p-1 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex flex-nowrap gap-1 overflow-x-auto scrollbar-hide">
            {/* GROUP 1 — HISTORY */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                <Undo className="h-4 w-4" />
              </MenuButton>
              <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                <Redo className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* GROUP 2 — FORMAT / BLOCK TYPE */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <select
                className="h-8 text-xs bg-transparent border-none focus:ring-0 cursor-pointer"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'p') editor.chain().focus().setParagraph().run();
                  else if (val === 'h1') editor.chain().focus().toggleHeading({ level: 1 }).run();
                  else if (val === 'h2') editor.chain().focus().toggleHeading({ level: 2 }).run();
                  else if (val === 'h3') editor.chain().focus().toggleHeading({ level: 3 }).run();
                  else if (val === 'h4') editor.chain().focus().toggleHeading({ level: 4 }).run();
                  else if (val === 'blockquote') editor.chain().focus().toggleBlockquote().run();
                  else if (val === 'codeBlock') editor.chain().focus().toggleCodeBlock().run();
                }}
                value={
                  editor.isActive('heading', { level: 1 }) ? 'h1' :
                  editor.isActive('heading', { level: 2 }) ? 'h2' :
                  editor.isActive('heading', { level: 3 }) ? 'h3' :
                  editor.isActive('heading', { level: 4 }) ? 'h4' :
                  editor.isActive('blockquote') ? 'blockquote' :
                  editor.isActive('codeBlock') ? 'codeBlock' : 'p'
                }
              >
                <option value="p">Paragraph</option>
                <option value="h1">Heading 1</option>
                <option value="h2">Heading 2</option>
                <option value="h3">Heading 3</option>
                <option value="h4">Heading 4</option>
                <option value="blockquote">Blockquote</option>
                <option value="codeBlock">Code Block</option>
              </select>
            </div>

            {/* GROUP 2.5 — FONT SIZE */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <FontSizeControl editor={editor} />
            </div>

            {/* GROUP 3 — TEXT STYLE */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <MenuButton 
                onClick={() => editor.chain().focus().toggleBold().run()} 
                isActive={editor.isActive('bold')} 
                title="Bold"
              >
                <Bold className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleItalic().run()} 
                isActive={editor.isActive('italic')} 
                title="Italic"
              >
                <Italic className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleUnderline().run()} 
                isActive={editor.isActive('underline')} 
                title="Underline"
              >
                <UnderlineIcon className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleStrike().run()} 
                isActive={editor.isActive('strike')} 
                title="Strikethrough"
              >
                <Strikethrough className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleSubscript().run()} 
                isActive={editor.isActive('subscript')} 
                title="Subscript"
              >
                <SubscriptIcon className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleSuperscript().run()} 
                isActive={editor.isActive('superscript')} 
                title="Superscript"
              >
                <SuperscriptIcon className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleCode().run()} 
                isActive={editor.isActive('code')} 
                title="Inline Code"
              >
                <Code className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().unsetAllMarks().run()} 
                title="Clear Formatting"
              >
                <Eraser className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* GROUP 4 — TEXT & HIGHLIGHT COLOR */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <ColorPicker 
                color={editor.getAttributes('textStyle').color} 
                onChange={(color) => editor.chain().focus().setColor(color).run()} 
                label="Text Color"
                icon={Type}
              />
              <ColorPicker 
                color={editor.getAttributes('highlight').color} 
                onChange={(color) => editor.chain().focus().toggleHighlight({ color }).run()} 
                label="Highlight Color"
                icon={Highlighter}
              />
            </div>

            {/* GROUP 5 — ALIGNMENT */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <MenuButton 
                onClick={() => editor.chain().focus().setTextAlign('left').run()} 
                isActive={editor.isActive({ textAlign: 'left' })} 
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().setTextAlign('center').run()} 
                isActive={editor.isActive({ textAlign: 'center' })} 
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().setTextAlign('right').run()} 
                isActive={editor.isActive({ textAlign: 'right' })} 
                title="Align Right"
              >
                <AlignRight className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().setTextAlign('justify').run()} 
                isActive={editor.isActive({ textAlign: 'justify' })} 
                title="Justify"
              >
                <AlignJustify className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* GROUP 6 — LISTS & INDENTATION */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <MenuButton 
                onClick={() => editor.chain().focus().toggleBulletList().run()} 
                isActive={editor.isActive('bulletList')} 
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                isActive={editor.isActive('orderedList')} 
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().toggleTaskList().run()} 
                isActive={editor.isActive('taskList')} 
                title="Task List"
              >
                <CheckSquare className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().sinkListItem('taskItem').run()} 
                disabled={!editor.can().sinkListItem('taskItem')}
                title="Indent"
              >
                <Indent className="h-4 w-4" />
              </MenuButton>
              <MenuButton 
                onClick={() => editor.chain().focus().liftListItem('taskItem').run()} 
                disabled={!editor.can().liftListItem('taskItem')}
                title="Outdent"
              >
                <Outdent className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* GROUP 7 — LINKS & MEDIA */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <MenuButton 
                onClick={openLinkModal} 
                isActive={editor.isActive('link')} 
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </MenuButton>
              <div className="relative">
                <MenuButton onClick={() => {}} title="Insert Image">
                  <label className="cursor-pointer">
                    <ImageIcon className="h-4 w-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </MenuButton>
              </div>
              <MenuButton 
                onClick={addYoutubeVideo} 
                title="Embed YouTube Video"
              >
                <YoutubeIcon className="h-4 w-4" />
              </MenuButton>
            </div>

            {/* GROUP 8 — TABLE */}
            <div className="flex items-center border-r border-gray-200 dark:border-gray-800 pr-1 mr-1 flex-shrink-0">
              <MenuButton 
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} 
                title="Insert Table"
              >
                <TableIcon className="h-4 w-4" />
              </MenuButton>
              <MenuButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Column Before"><Plus className="h-3 w-3" /><Columns className="h-4 w-4" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Column After"><Columns className="h-4 w-4" /><Plus className="h-3 w-3" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Column"><Minus className="h-3 w-3" /><Columns className="h-4 w-4" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before"><Plus className="h-3 w-3" /><Rows className="h-4 w-4" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After"><Rows className="h-4 w-4" /><Plus className="h-3 w-3" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row"><Minus className="h-3 w-3" /><Rows className="h-4 w-4" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().mergeCells().run()} title="Merge Cells"><Merge className="h-4 w-4" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().splitCell().run()} title="Split Cell"><Split className="h-4 w-4" /></MenuButton>
              <MenuButton onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table"><Trash2 className="h-4 w-4 text-red-500" /></MenuButton>
            </div>

            {/* GROUP 9 — EXTRAS */}
            <div className="flex items-center flex-shrink-0">
              <MenuButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
                <HorizontalRuleIcon className="h-4 w-4" />
              </MenuButton>
              <MenuButton onClick={() => editor.chain().focus().setHardBreak().run()} title="Hard Break">
                <CornerDownLeft className="h-4 w-4" />
              </MenuButton>
            </div>
          </div>

          {/* Editor Area — Fixed Height & Scrollable */}
          <div className="overflow-y-auto h-[350px] md:h-[450px] lg:h-[500px] bg-white dark:bg-gray-950 relative">
            {/* Link Modal */}
            {showLinkModal && (
              <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl animate-in slide-in-from-top duration-200">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Insert/Edit Link</h4>
                    <button onClick={() => setShowLinkModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                      <X className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                      className="flex-grow px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveLink();
                        if (e.key === 'Escape') setShowLinkModal(false);
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={removeLink}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Remove Link
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowLinkModal(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveLink}
                        className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:bg-blue-900 transition-colors"
                      >
                        Save Link
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 prose prose-sm sm:prose-base max-w-none dark:prose-invert focus:outline-none min-h-full">
              <EditorContent editor={editor} />
            </div>
          </div>

          {/* Word count bar — always visible at bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-400 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <div className="flex gap-4">
              <span>{editor.storage.characterCount.characters()} characters</span>
              <span>{editor.storage.characterCount.words()} words</span>
            </div>
          </div>
        </>
      ) : (
        /* Preview Area — Fixed Height & Scrollable */
        <div className="overflow-y-auto h-[350px] md:h-[450px] lg:h-[500px] bg-white dark:bg-gray-950">
          <div 
            className="p-4 prose prose-lg max-w-none prose-blue dark:prose-invert prose-img:rounded-xl prose-a:text-blue-600 prose-headings:font-bold"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}
    </div>
  );
};
