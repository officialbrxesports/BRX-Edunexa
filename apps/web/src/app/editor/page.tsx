
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import AIWritingPanel from "@/modules/ai-writing/components/AIWritingPanel";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  CloudUpload,
  Columns3,
  Copy,
  Download,
  Sparkles,
  FilePlus,
  FileText,
  FolderOpen,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  MoreHorizontal,
  Palette,
  Pilcrow,
  Printer,
  Redo2,
  Save,
  Search,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const CONTENT_KEY = "brx-ai-editor-content-v4";
const TITLE_KEY = "brx-ai-editor-title-v4";

type TabName =
  | "Home"
  | "Insert"
  | "Format"
  | "Layout"
  | "Review"
  | "View";

type CloudDocument = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type CloudDocumentDetail = CloudDocument & {
  content: string;
};

async function documentsApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}/documents${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Request failed (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "_").trim() || "Document";
}

function RibbonButton({
  label,
  onClick,
  children,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded px-2 text-sm transition ${
        active
          ? "bg-blue-100 text-blue-800"
          : "text-slate-700 hover:bg-blue-50"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function RibbonGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-fit flex-col justify-between border-r border-slate-200 px-3 py-1 last:border-r-0">
      <div className="flex flex-wrap items-center gap-1">{children}</div>
      <span className="mt-1 text-center text-[10px] text-slate-400">
        {label}
      </span>
    </div>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 text-[10px] text-slate-500 ${className}`}>
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 rounded border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function EditorPage() {
  const [title, setTitle] = useState("Untitled Document");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<TabName>("Home");
  const [cloudDocuments, setCloudDocuments] = useState<CloudDocument[]>([]);
  const [showDocuments, setShowDocuments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [showAIWriting, setShowAIWriting] = useState(false);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("16px");
  const [zoom, setZoom] = useState(100);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [margin, setMargin] = useState("normal");
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [showNavigation, setShowNavigation] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [wordStats, setWordStats] = useState({ words: 0, characters: 0 });

  const documentIdRef = useRef<string | null>(null);
  const titleRef = useRef(title);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const notifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      },
    }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: true }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "brx-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: "<h1>Welcome to BRX AI Editor</h1><p>Start writing here.</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "brx-editor-content outline-none",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const text = currentEditor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;

      setWordStats({
        words,
        characters: text.length,
      });
    },
  });

  const notify = useCallback((text: string) => {
    setMessage(text);

    if (notifyTimer.current) {
      clearTimeout(notifyTimer.current);
    }

    notifyTimer.current = setTimeout(() => {
      setMessage("");
    }, 3500);
  }, []);
  useLayoutEffect(() => {
    if (!editor) return;

    const savedTitle = localStorage.getItem(TITLE_KEY);
    const savedContent = localStorage.getItem(CONTENT_KEY);

    if (savedTitle) {
      titleRef.current = savedTitle;

      // Intentional: restore the saved title from localStorage.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTitle(savedTitle);
    }

    if (savedContent) {
      editor.commands.setContent(savedContent, {
        emitUpdate: false,
      });

      const text = editor.getText();

      setWordStats({
        words: text.trim().split(/\s+/).filter(Boolean).length,
        characters: text.length,
      });
    }
  }, [editor]);

  useEffect(() => {
    return () => {
      if (notifyTimer.current) clearTimeout(notifyTimer.current);
    };
  }, []);

  const saveLocally = useCallback(() => {
    if (!editor) return;

    try {
      localStorage.setItem(CONTENT_KEY, editor.getHTML());
      localStorage.setItem(TITLE_KEY, titleRef.current);
      notify("Document saved in this browser.");
    } catch {
      notify("Local save failed. The document may be too large.");
    }
  }, [editor, notify]);

  const saveToCloud = useCallback(async () => {
    if (!editor || saving) return;

    setSaving(true);

    try {
      const content = editor.getHTML();

      if (new Blob([content]).size > 1_800_000) {
        notify("Document is too large for cloud saving. Remove large images.");
        return;
      }

      const currentTitle = titleRef.current.trim() || "Untitled Document";
      const currentId = documentIdRef.current;

      let saved: CloudDocumentDetail;

      if (currentId) {
        saved = await documentsApi<CloudDocumentDetail>(
          `/${encodeURIComponent(currentId)}`,
          {
            method: "PATCH",
            body: JSON.stringify({ title: currentTitle, content }),
          },
        );
      } else {
        saved = await documentsApi<CloudDocumentDetail>("", {
          method: "POST",
          body: JSON.stringify({ title: currentTitle, content }),
        });
      }

      documentIdRef.current = saved.id;
      setDocumentId(saved.id);

      localStorage.setItem(CONTENT_KEY, content);
      localStorage.setItem(TITLE_KEY, currentTitle);

      setCloudDocuments((previous) => [
        saved,
        ...previous.filter((item) => item.id !== saved.id),
      ]);

      notify("Saved to BRX Cloud.");
    } catch (error) {
      console.error("BRX cloud save error:", error);
      notify("Cloud save failed. Check login, API and database.");
    } finally {
      setSaving(false);
    }
  }, [editor, notify, saving]);

  const loadCloudDocuments = useCallback(async () => {
    setLoading(true);

    try {
      const result = await documentsApi<CloudDocument[]>("");
      setCloudDocuments(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("BRX documents list error:", error);
      notify("Could not load cloud documents. Please log in.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const openCloudDocument = useCallback(
    async (id: string) => {
      if (!editor) return;

      try {
        const document = await documentsApi<CloudDocumentDetail>(
          `/${encodeURIComponent(id)}`,
        );

        documentIdRef.current = document.id;
        setDocumentId(document.id);
        titleRef.current = document.title;
        setTitle(document.title);

        editor.commands.setContent(document.content || "<p></p>", {
          emitUpdate: true,
        });

        localStorage.setItem(CONTENT_KEY, document.content);
        localStorage.setItem(TITLE_KEY, document.title);

        setShowDocuments(false);
        notify("Cloud document opened.");
      } catch (error) {
        console.error("BRX document open error:", error);
        notify("Could not open this document.");
      }
    },
    [editor, notify],
  );

  const createNewDocument = useCallback(() => {
    if (
      editor &&
      editor.getText().trim() &&
      !window.confirm("Create a new document? Save your current work first.")
    ) {
      return;
    }

    documentIdRef.current = null;
    setDocumentId(null);
    titleRef.current = "Untitled Document";
    setTitle("Untitled Document");

    editor?.commands.setContent("<h1>Untitled Document</h1><p></p>");

    localStorage.removeItem(CONTENT_KEY);
    localStorage.removeItem(TITLE_KEY);
    setShowDocuments(false);
    notify("New document created.");
  }, [editor, notify]);

  const deleteCloudDocument = useCallback(
    async (id: string) => {
      if (!window.confirm("Delete this cloud document?")) return;

      try {
        await documentsApi<void>(`/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        setCloudDocuments((previous) =>
          previous.filter((item) => item.id !== id),
        );

        if (documentIdRef.current === id) {
          documentIdRef.current = null;
          setDocumentId(null);
        }

        notify("Cloud document deleted.");
      } catch (error) {
        console.error("BRX document delete error:", error);
        notify("Could not delete this document.");
      }
    },
    [notify],
  );

  function openLocalFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    if (file.size > 5 * 1024 * 1024) {
      notify("File is too large. Maximum size is 5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "");

      if (file.name.toLowerCase().endsWith(".txt")) {
        editor.commands.setContent(`<p>${escapeHtml(text).replace(/\r?\n/g, "<br>")}</p>`);
      } else {
        const parsed = new DOMParser().parseFromString(text, "text/html");
        editor.commands.setContent(parsed.body.innerHTML || "<p></p>");
      }

      documentIdRef.current = null;
      setDocumentId(null);

      const newTitle = file.name.replace(/\.[^.]+$/, "");
      titleRef.current = newTitle;
      setTitle(newTitle);

      notify("Local document opened.");
    };

    reader.onerror = () => notify("Could not read this file.");
    reader.readAsText(file);
    event.target.value = "";
  }

  function insertImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    if (!file.type.startsWith("image/")) {
      notify("Please choose an image.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("Image must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      editor.chain().focus().setImage({
        src: String(reader.result),
        alt: file.name,
      }).run();

      notify("Image inserted.");
    };

    reader.onerror = () => notify("Could not load this image.");
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function addLink() {
    if (!editor) return;

    const address = window.prompt("Enter website address:");
    if (!address) return;

    let url: URL;

    try {
      url = new URL(
        /^https?:\/\//i.test(address) ? address : `https://${address}`,
      );
    } catch {
      notify("Please enter a valid website address.");
      return;
    }

    if (!["http:", "https:"].includes(url.protocol)) {
      notify("Only HTTP and HTTPS links are supported.");
      return;
    }

    editor.chain().focus().setLink({
      href: url.toString(),
      target: "_blank",
      rel: "noopener noreferrer",
    }).run();
  }

  function insertDate() {
    if (!editor) return;
    editor.chain().focus().insertContent(new Date().toLocaleDateString()).run();
  }

  function insertHorizontalLine() {
    editor?.chain().focus().setHorizontalRule().run();
  }

  function insertTable() {
    editor?.chain().focus().insertTable({
      rows: 3,
      cols: 3,
      withHeaderRow: true,
    }).run();
  }

  function downloadHtml() {
    if (!editor) return;

    const safeTitle = title.trim() || "Document";
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(safeTitle)}</title>
<style>
body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;line-height:1.7}
table{border-collapse:collapse;width:100%}
td,th{border:1px solid #777;padding:8px}
img{max-width:100%;height:auto}
blockquote{border-left:4px solid #2563eb;padding-left:16px}
</style>
</head>
<body>${editor.getHTML()}</body>
</html>`;

    const url = URL.createObjectURL(
      new Blob([html], { type: "text/html;charset=utf-8" }),
    );

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(safeTitle)}.html`;
    anchor.click();
    URL.revokeObjectURL(url);

    notify("HTML file downloaded.");
  }

  function downloadText() {
    if (!editor) return;

    const blob = new Blob([editor.getText()], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(title)}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("Text file downloaded.");
  }

  function applyFontSize(value: string) {
    setFontSize(value);
    if (!editor) return;

    editor.chain().focus().setMark("textStyle", {
      fontSize: value,
    }).run();
  }

  function applyFontFamily(value: string) {
    setFontFamily(value);
    if (!editor) return;

    editor.chain().focus().setMark("textStyle", {
      fontFamily: value,
    }).run();
  }

  function applyLineSpacing(value: string) {
    setLineSpacing(value);
    if (!editor) return;

    editor.chain().focus().updateAttributes("paragraph", {
      style: `line-height: ${value}`,
    }).run();
  }

  function findNext() {
    if (!editor || !searchText.trim()) return;

    const text = editor.state.doc.textBetween(
      0,
      editor.state.doc.content.size,
      "\n",
    );
    const position = editor.state.selection.to;

    let index = text.indexOf(searchText, position);

    if (index < 0) index = text.indexOf(searchText);

    if (index < 0) {
      notify("Text not found.");
      return;
    }

    editor.chain().focus().setTextSelection({
      from: index + 1,
      to: index + 1 + searchText.length,
    }).run();
  }

  function replaceCurrent() {
    if (!editor || !searchText) return;

    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, "");

    if (selected !== searchText) {
      findNext();
      return;
    }

    editor.chain().focus().insertContent(replaceText).run();
    notify("Text replaced.");
  }

  function replaceAll() {
    if (!editor || !searchText) return;

    const matches: { from: number; to: number }[] = [];
    const needle = searchText.toLowerCase();

    editor.state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;

      const source = node.text;
      const lower = source.toLowerCase();
      let start = 0;

      while (true) {
        const found = lower.indexOf(needle, start);
        if (found < 0) break;

        matches.push({
          from: pos + found,
          to: pos + found + searchText.length,
        });

        start = found + searchText.length;
      }
    });

    if (!matches.length) {
      notify("No matching text found.");
      return;
    }

    const transaction = editor.state.tr;

    for (const match of matches.reverse()) {
      transaction.insertText(replaceText, match.from, match.to);
    }

    editor.view.dispatch(transaction);
    notify(`${matches.length} replacement(s) made.`);
  }

  const tabs: TabName[] = [
    "Home",
    "Insert",
    "Format",
    "Layout",
    "Review",
    "View",
  ];

  const pageWidth = pageSize === "A4" ? 794 : 816;
  const pageHeight = pageSize === "A4" ? 1123 : 1056;

  const marginValue =
    margin === "narrow"
      ? "24px"
      : margin === "wide"
        ? "80px"
        : "48px";

  const activeEditor = Boolean(editor);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      {/* Top application bar */}
      <header className="sticky top-0 z-40 bg-[#174ea6] text-white shadow">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <FileText size={23} />
            </div>
            <div>
              <h1 className="text-lg font-bold">BRX AI Editor</h1>
              <p className="text-[11px] text-blue-100">
                EduNexa Document Workspace
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              value={title}
              onChange={(event) => {
                titleRef.current = event.target.value;
                setTitle(event.target.value);
              }}
              aria-label="Document title"
              className="h-9 w-48 rounded border border-blue-300 bg-white px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
            />

            <button
              className="top-action"
              onClick={saveLocally}
              type="button"
            >
              <Save size={16} /> Save
            </button>

            <button
              className="top-action"
              onClick={() => void saveToCloud()}
              disabled={saving}
              type="button"
            >
              <CloudUpload size={16} />
              {saving ? "Saving..." : "Cloud Save"}
            </button>

            <button
              type="button"
              className="top-action"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowAIWriting((value) => !value)}
            >
              <Sparkles size={16} />
              AI Writing
            </button>

            <button
              className="top-action"
              onClick={createNewDocument}
              type="button"
            >
              <FilePlus size={16} /> New
            </button>

            <button
              className="top-action"
              onClick={() => {
                setShowDocuments((value) => !value);
                void loadCloudDocuments();
              }}
              type="button"
            >
              <FolderOpen size={16} /> Documents
            </button>
          </div>
        </div>

        {/* Ribbon tabs */}
        <nav className="flex gap-1 overflow-x-auto border-t border-white/15 px-3">
          {tabs.map((tab) => (
            <button
              type="button"
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-[3px] px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-white bg-white/15 text-white"
                  : "border-transparent text-blue-100 hover:bg-white/10"
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            className="ml-auto flex items-center gap-1 whitespace-nowrap px-3 text-xs text-blue-100 hover:bg-white/10"
            onClick={() => setShowNavigation((value) => !value)}
          >
            <Search size={15} /> Find
          </button>
        </nav>
      </header>

      {/* Ribbon controls */}
      <section className="sticky top-29 z-30 border-b border-slate-300 bg-white shadow-sm">
        <div className="flex min-h-23 items-stretch gap-1 overflow-x-auto px-2 py-2">
          {activeTab === "Home" && (
            <>
              <RibbonGroup label="Clipboard">
                <RibbonButton
                  label="Copy selected text"
                  onClick={() => {
                    const selected = window.getSelection()?.toString();
                    if (selected) {
                      void navigator.clipboard.writeText(selected);
                      notify("Selection copied.");
                    }
                  }}
                >
                  <Copy size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Undo"
                  onClick={() => editor?.chain().focus().undo().run()}
                >
                  <Undo2 size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Redo"
                  onClick={() => editor?.chain().focus().redo().run()}
                >
                  <Redo2 size={17} />
                </RibbonButton>
              </RibbonGroup>

              <RibbonGroup label="Font">
                <SelectControl
                  label="Font family"
                  value={fontFamily}
                  onChange={applyFontFamily}
                  className="w-32"
                  options={[
                    { label: "Arial", value: "Arial" },
                    { label: "Calibri", value: "Calibri" },
                    { label: "Times New Roman", value: "Times New Roman" },
                    { label: "Georgia", value: "Georgia" },
                    { label: "Verdana", value: "Verdana" },
                    { label: "Courier New", value: "Courier New" },
                    { label: "Trebuchet MS", value: "Trebuchet MS" },
                  ]}
                />
                <SelectControl
                  label="Size"
                  value={fontSize}
                  onChange={applyFontSize}
                  className="w-20"
                  options={[
                    "10px", "11px", "12px", "14px", "16px", "18px",
                    "20px", "22px", "24px", "28px", "32px", "36px",
                    "48px", "72px",
                  ].map((size) => ({ label: size, value: size }))}
                />
                <RibbonButton
                  label="Bold"
                  active={editor?.isActive("bold")}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <Bold size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Italic"
                  active={editor?.isActive("italic")}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Underline"
                  active={editor?.isActive("underline")}
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                >
                  <UnderlineIcon size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Strikethrough"
                  active={editor?.isActive("strike")}
                  onClick={() => editor?.chain().focus().toggleStrike().run()}
                >
                  <Strikethrough size={17} />
                </RibbonButton>
                <label className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center rounded hover:bg-blue-50" title="Font color">
                  <Palette size={17} />
                  <input
                    type="color"
                    className="h-2 w-5 cursor-pointer"
                    onChange={(event) =>
                      editor?.chain().focus().setColor(event.target.value).run()
                    }
                  />
                </label>
                <label className="flex h-9 w-9 cursor-pointer flex-col items-center justify-center rounded hover:bg-blue-50" title="Text highlight">
                  <Highlighter size={17} />
                  <input
                    type="color"
                    defaultValue="#fff176"
                    className="h-2 w-5 cursor-pointer"
                    onChange={(event) =>
                      editor?.chain().focus().toggleHighlight({
                        color: event.target.value,
                      }).run()
                    }
                  />
                </label>
              </RibbonGroup>

              <RibbonGroup label="Paragraph">
                <RibbonButton
                  label="Bulleted list"
                  active={editor?.isActive("bulletList")}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  <List size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Numbered list"
                  active={editor?.isActive("orderedList")}
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                >
                  <ListOrdered size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Align left"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                >
                  <AlignLeft size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Align center"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                >
                  <AlignCenter size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Align right"
                  onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                >
                  <AlignRight size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Justify"
                  onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                >
                  <AlignJustify size={17} />
                </RibbonButton>
              </RibbonGroup>

              <RibbonGroup label="Styles">
                <RibbonButton
                  label="Normal paragraph"
                  onClick={() => editor?.chain().focus().setParagraph().run()}
                >
                  <Pilcrow size={17} />
                </RibbonButton>
                <RibbonButton
                  label="Heading 1"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                >
                  <Heading1 size={19} />
                </RibbonButton>
                <RibbonButton
                  label="Heading 2"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                >
                  <Heading2 size={19} />
                </RibbonButton>
                <RibbonButton
                  label="Heading 3"
                  onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                >
                  <Heading3 size={19} />
                </RibbonButton>
                <RibbonButton
                  label="Block quote"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                >
                  <MoreHorizontal size={19} />
                </RibbonButton>
              </RibbonGroup>
            </>
          )}

          {activeTab === "Insert" && (
            <>
              <RibbonGroup label="Pages">
                <RibbonButton
                  label="Insert page break"
                  onClick={insertHorizontalLine}
                >
                  <FilePlus size={18} /> Page break
                </RibbonButton>
                <RibbonButton label="Insert date" onClick={insertDate}>
                  <FileText size={18} /> Date
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Tables">
                <RibbonButton label="Insert 3 by 3 table" onClick={insertTable}>
                  <TableIcon size={18} /> Table
                </RibbonButton>
                <RibbonButton
                  label="Add row after"
                  onClick={() => editor?.chain().focus().addRowAfter().run()}
                >
                  + Row
                </RibbonButton>
                <RibbonButton
                  label="Add column after"
                  onClick={() => editor?.chain().focus().addColumnAfter().run()}
                >
                  + Column
                </RibbonButton>
                <RibbonButton
                  label="Delete table"
                  onClick={() => editor?.chain().focus().deleteTable().run()}
                >
                  <Trash2 size={17} />
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Illustrations">
                <RibbonButton
                  label="Insert image"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <ImagePlus size={18} /> Image
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Links">
                <RibbonButton label="Insert hyperlink" onClick={addLink}>
                  <LinkIcon size={18} /> Link
                </RibbonButton>
                <RibbonButton
                  label="Remove hyperlink"
                  onClick={() => editor?.chain().focus().unsetLink().run()}
                >
                  <X size={17} /> Remove link
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Text">
                <RibbonButton label="Horizontal line" onClick={insertHorizontalLine}>
                  <Minus size={18} /> Line
                </RibbonButton>
              </RibbonGroup>
            </>
          )}

          {activeTab === "Format" && (
            <>
              <RibbonGroup label="Text formatting">
                <SelectControl
                  label="Font"
                  value={fontFamily}
                  onChange={applyFontFamily}
                  className="w-36"
                  options={[
                    "Arial", "Calibri", "Times New Roman", "Georgia",
                    "Verdana", "Courier New",
                  ].map((name) => ({ label: name, value: name }))}
                />
                <SelectControl
                  label="Font size"
                  value={fontSize}
                  onChange={applyFontSize}
                  className="w-20"
                  options={[
                    "10px", "12px", "14px", "16px", "18px", "20px",
                    "24px", "28px", "32px", "36px", "48px",
                  ].map((size) => ({ label: size, value: size }))}
                />
                <RibbonButton
                  label="Clear marks"
                  onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                >
                  Clear formatting
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Paragraph spacing">
                <SelectControl
                  label="Line spacing"
                  value={lineSpacing}
                  onChange={applyLineSpacing}
                  className="w-28"
                  options={[
                    { label: "Single", value: "1" },
                    { label: "1.15", value: "1.15" },
                    { label: "1.5", value: "1.5" },
                    { label: "Double", value: "2" },
                  ]}
                />
                <RibbonButton
                  label="Indent paragraph"
                  onClick={() => editor?.chain().focus().sinkListItem("listItem").run()}
                >
                  Indent
                </RibbonButton>
                <RibbonButton
                  label="Outdent paragraph"
                  onClick={() => editor?.chain().focus().liftListItem("listItem").run()}
                >
                  Outdent
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Text effects">
                <RibbonButton
                  label="Subscript is not enabled"
                  onClick={() => notify("Subscript requires an additional editor extension.")}
                >
                  x₂
                </RibbonButton>
                <RibbonButton
                  label="Superscript is not enabled"
                  onClick={() => notify("Superscript requires an additional editor extension.")}
                >
                  x²
                </RibbonButton>
                <RibbonButton
                  label="Toggle block quote"
                  onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                >
                  Quote
                </RibbonButton>
              </RibbonGroup>
            </>
          )}

          {activeTab === "Layout" && (
            <>
              <RibbonGroup label="Page setup">
                <SelectControl
                  label="Paper size"
                  value={pageSize}
                  onChange={setPageSize}
                  className="w-28"
                  options={[
                    { label: "A4", value: "A4" },
                    { label: "Letter", value: "Letter" },
                  ]}
                />
                <SelectControl
                  label="Orientation"
                  value={orientation}
                  onChange={setOrientation}
                  className="w-32"
                  options={[
                    { label: "Portrait", value: "portrait" },
                    { label: "Landscape", value: "landscape" },
                  ]}
                />
                <SelectControl
                  label="Margins"
                  value={margin}
                  onChange={setMargin}
                  className="w-28"
                  options={[
                    { label: "Normal", value: "normal" },
                    { label: "Narrow", value: "narrow" },
                    { label: "Wide", value: "wide" },
                  ]}
                />
              </RibbonGroup>
              <RibbonGroup label="Paragraph">
                <RibbonButton
                  label="Align left"
                  onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                >
                  <AlignLeft size={18} />
                </RibbonButton>
                <RibbonButton
                  label="Center"
                  onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                >
                  <AlignCenter size={18} />
                </RibbonButton>
                <RibbonButton
                  label="Justify"
                  onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                >
                  <AlignJustify size={18} />
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Columns">
                <RibbonButton
                  label="Columns layout information"
                  onClick={() => notify("Multi-column page layout is not enabled in this version.")}
                >
                  <Columns3 size={18} /> Columns
                </RibbonButton>
              </RibbonGroup>
            </>
          )}

          {activeTab === "Review" && (
            <>
              <RibbonGroup label="Proofing">
                <RibbonButton
                  label="Word count"
                  onClick={() =>
                    notify(`${wordStats.words} words · ${wordStats.characters} characters`)
                  }
                >
                  <FileText size={18} /> Word count
                </RibbonButton>
                <RibbonButton
                  label="Spell check"
                  onClick={() => notify("Browser spell-check is enabled in the editor.")}
                >
                  ABC ✓
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Find and replace">
                <RibbonButton
                  label="Open find and replace"
                  onClick={() => setShowNavigation((value) => !value)}
                >
                  <Search size={18} /> Find / Replace
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Document">
                <RibbonButton
                  label="Save a review copy"
                  onClick={() => void saveToCloud()}
                >
                  <CloudUpload size={18} /> Save review
                </RibbonButton>
              </RibbonGroup>
            </>
          )}

          {activeTab === "View" && (
            <>
              <RibbonGroup label="Zoom">
                <RibbonButton
                  label="Zoom out"
                  onClick={() => setZoom((value) => Math.max(50, value - 10))}
                >
                  <ZoomOut size={18} />
                </RibbonButton>
                <span className="px-2 text-xs font-semibold">{zoom}%</span>
                <RibbonButton
                  label="Zoom in"
                  onClick={() => setZoom((value) => Math.min(150, value + 10))}
                >
                  <ZoomIn size={18} />
                </RibbonButton>
                <RibbonButton label="Reset zoom" onClick={() => setZoom(100)}>
                  100%
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Navigation">
                <RibbonButton
                  label="Toggle navigation panel"
                  active={showNavigation}
                  onClick={() => setShowNavigation((value) => !value)}
                >
                  <Search size={18} /> Navigation
                </RibbonButton>
              </RibbonGroup>
              <RibbonGroup label="Display">
                <RibbonButton
                  label="Print preview"
                  onClick={() => window.print()}
                >
                  <Printer size={18} /> Print view
                </RibbonButton>
              </RibbonGroup>
            </>
          )}
        </div>
      </section>

      {/* Navigation and find/replace */}
      {showNavigation && (
        <section className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-5xl flex-wrap items-end gap-2">
            <label className="flex min-w-44 flex-1 flex-col gap-1 text-xs text-slate-500">
              Find
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                className="h-9 rounded border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                placeholder="Find text..."
              />
            </label>
            <label className="flex min-w-44 flex-1 flex-col gap-1 text-xs text-slate-500">
              Replace with
              <input
                value={replaceText}
                onChange={(event) => setReplaceText(event.target.value)}
                className="h-9 rounded border border-slate-300 px-3 text-sm text-slate-800 outline-none focus:border-blue-500"
                placeholder="Replacement text..."
              />
            </label>
            <button className="secondary-action" onClick={findNext} type="button">
              Find next
            </button>
            <button className="secondary-action" onClick={replaceCurrent} type="button">
              Replace
            </button>
            <button className="secondary-action" onClick={replaceAll} type="button">
              Replace all
            </button>
            <button
              className="secondary-action"
              onClick={() => setShowNavigation(false)}
              type="button"
              aria-label="Close find panel"
            >
              <X size={16} />
            </button>
          </div>
        </section>
      )}

      {/* Cloud documents panel */}
      {showDocuments && (
        <section className="border-b border-slate-300 bg-white p-4">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">My Cloud Documents</h2>
                <p className="text-xs text-slate-500">
                  Documents saved to your EduNexa account
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDocuments(false)}
                aria-label="Close documents"
                className="rounded p-2 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-slate-500">Loading documents...</p>
            ) : cloudDocuments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No cloud documents found. Create a document and click Cloud Save.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {cloudDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 hover:border-blue-300"
                  >
                    <button
                      type="button"
                      onClick={() => void openCloudDocument(document.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block truncate text-sm font-medium text-blue-800">
                        {document.title}
                      </span>
                      <span className="text-xs text-slate-500">
                        {document.updatedAt
                          ? new Date(document.updatedAt).toLocaleString()
                          : "Saved document"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteCloudDocument(document.id)}
                      aria-label={`Delete ${document.title}`}
                      className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Main editor area */}
      <div className="mx-auto flex max-w-375 gap-4 px-3 py-5">
        <section className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-700">{title}</span>
              <span>•</span>
              <span>{documentId ? "Cloud document" : "New document"}</span>
              {saving && <span className="text-blue-700">Saving...</span>}
            </div>
            <div>
              {wordStats.words} words · {wordStats.characters} characters
            </div>
          </div>

          <div
            className="mx-auto overflow-auto border border-slate-300 bg-white shadow-sm"
            style={{
              width: `${(orientation === "portrait" ? pageWidth : pageHeight) * (zoom / 100)}px`,
              maxWidth: "100%",
              minHeight: `${(orientation === "portrait" ? pageHeight : pageWidth) * (zoom / 100)}px`,
            }}
          >
            <div
              className="brx-page"
              style={{
                minHeight: `${orientation === "portrait" ? pageHeight : pageWidth}px`,
                padding: marginValue,
                fontFamily,
                fontSize,
                lineHeight: lineSpacing,
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top left",
                width: `${100 / (zoom / 100)}%`,
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>

          {!activeEditor && (
            <p className="mt-3 text-center text-sm text-slate-500">
              Starting editor...
            </p>
          )}
        </section>
      </div>

      {showAIWriting && editor && (
        <AIWritingPanel
          editor={editor}
          onClose={() => setShowAIWriting(false)}
        />
      )}
      
      {/* Bottom status bar */}
      <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 border-t border-slate-300 bg-white px-4 py-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span>BRX AI Editor</span>
          <span>{wordStats.words} words</span>
          <span>{pageSize} · {orientation}</span>
          <span className="flex items-center gap-1">
            <Check size={13} className="text-green-600" /> Editor ready
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(50, value - 10))}
            className="rounded p-1 hover:bg-slate-100"
            aria-label="Zoom out"
          >
            <ZoomOut size={15} />
          </button>
          <span>{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(150, value + 10))}
            className="rounded p-1 hover:bg-slate-100"
            aria-label="Zoom in"
          >
            <ZoomIn size={15} />
          </button>
        </div>
      </footer>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".html,.htm,.txt"
        className="hidden"
        onChange={openLocalFile}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={insertImage}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".html,.htm,.txt"
        className="hidden"
        onChange={openLocalFile}
      />

      {/* File and export controls */}
      <div className="fixed bottom-16 right-4 z-30 flex flex-col gap-2">
        <button
          type="button"
          className="floating-action"
          title="Download HTML"
          onClick={downloadHtml}
        >
          <Download size={18} /> HTML
        </button>
        <button
          type="button"
          className="floating-action"
          title="Download text"
          onClick={downloadText}
        >
          <FileText size={18} /> TXT
        </button>
        <button
          type="button"
          className="floating-action"
          title="Print or save as PDF"
          onClick={() => window.print()}
        >
          <Printer size={18} /> PDF
        </button>
      </div>

      {message && (
        <div
          role="status"
          className="fixed bottom-28 right-4 z-50 flex max-w-sm items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 text-sm text-blue-900 shadow-xl"
        >
          <Check size={17} className="shrink-0 text-green-600" />
          {message}
        </div>
      )}

      <style jsx global>{`
        .top-action {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,.4);
          border-radius: 6px;
          background: rgba(255,255,255,.12);
          padding: 6px 10px;
          color: white;
          font-size: 12px;
          cursor: pointer;
        }
        .top-action:hover {
          background: rgba(255,255,255,.22);
        }
        .top-action:disabled {
          cursor: not-allowed;
          opacity: .55;
        }
        .secondary-action {
          display: inline-flex;
          min-height: 36px;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: white;
          padding: 6px 12px;
          color: #334155;
          font-size: 12px;
        }
        .secondary-action:hover {
          border-color: #93c5fd;
          background: #eff6ff;
        }
        .floating-action {
          display: flex;
          min-width: 90px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: white;
          padding: 9px 12px;
          color: #334155;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(15,23,42,.1);
        }
        .floating-action:hover {
          background: #eff6ff;
          border-color: #93c5fd;
        }
        .brx-editor-content {
          min-height: 900px;
          color: #1e293b;
          outline: none;
          overflow-wrap: anywhere;
        }
        .brx-editor-content:focus {
          outline: none;
        }
        .brx-editor-content h1 {
          margin: 1.2rem 0;
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.25;
        }
        .brx-editor-content h2 {
          margin: 1rem 0;
          font-size: 1.5rem;
          font-weight: 700;
        }
        .brx-editor-content h3 {
          margin: .9rem 0;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .brx-editor-content p {
          margin: .45rem 0;
        }
        .brx-editor-content ul {
          list-style: disc;
          padding-left: 2rem;
        }
        .brx-editor-content ol {
          list-style: decimal;
          padding-left: 2rem;
        }
        .brx-editor-content blockquote {
          margin: 1rem 0;
          border-left: 4px solid #2563eb;
          padding-left: 1rem;
          color: #475569;
        }
        .brx-editor-content hr {
          margin: 1.5rem 0;
          border: 0;
          border-top: 2px solid #cbd5e1;
        }
        .brx-editor-content table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .brx-editor-content td,
        .brx-editor-content th {
          min-width: 80px;
          border: 1px solid #94a3b8;
          padding: 8px;
          vertical-align: top;
        }
        .brx-editor-content th {
          background: #dbeafe;
          font-weight: 700;
        }
        .brx-editor-content img {
          max-width: 100%;
          height: auto;
        }
        .brx-editor-content a {
          color: #1d4ed8;
          text-decoration: underline;
        }
        .brx-editor-content mark {
          border-radius: 2px;
          padding: 0 2px;
        }
        .brx-editor-content [style*="text-align: center"] {
          text-align: center;
        }
        .brx-editor-content [style*="text-align: right"] {
          text-align: right;
        }
        .brx-editor-content [style*="text-align: justify"] {
          text-align: justify;
        }
        @media print {
          body {
            background: white !important;
          }
          header,
          footer,
          main > section,
          .fixed,
          nav {
            display: none !important;
          }
          .brx-page {
            transform: none !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .brx-editor-content {
            min-height: auto !important;
          }
        }
      `}</style>
    </main>
  );
}
