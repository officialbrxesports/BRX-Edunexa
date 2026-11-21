"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Download,
  FilePlus,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Printer,
  Redo2,
  Search,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { API_URL } from "../../lib/api";
import { printHtml } from "../../lib/admissionPrint";

/* =====================================================
   Notes: a small Word-style editor.
   Notes are stored per person in /documents (the same
   place the older /editor page uses), so old notes
   show up here too.
===================================================== */

type NoteSummary = { id: string; title: string; updatedAt: string };
type NoteDetail = NoteSummary & { content: string };
type SaveState = "saved" | "saving" | "unsaved" | "error";

const TEMPLATES: { name: string; title: string; html: string }[] = [
  {
    name: "Notice",
    title: "Notice",
    html:
      "<h1>Notice</h1><p><strong>Date:</strong> [date]</p><p><strong>To:</strong> [students / parents / staff]</p>" +
      "<p>This is to inform everyone that [details].</p><p>For any questions, please contact the office.</p>",
  },
  {
    name: "Homework",
    title: "Homework",
    html:
      "<h1>Homework</h1><p><strong>Class / Batch:</strong> [class]</p><p><strong>Subject:</strong> [subject]</p>" +
      "<p><strong>Submit by:</strong> [date]</p><ol><li>[Question or task 1]</li><li>[Question or task 2]</li></ol>",
  },
  {
    name: "Lesson plan",
    title: "Lesson plan",
    html:
      "<h1>Lesson plan</h1><p><strong>Topic:</strong> [topic]</p><p><strong>Class:</strong> [class] &nbsp; <strong>Period:</strong> [period]</p>" +
      "<h2>Objectives</h2><ul><li>[objective]</li></ul><h2>Activities</h2><ul><li>[activity]</li></ul>" +
      "<h2>Assessment</h2><p>[how learning will be checked]</p>",
  },
  {
    name: "Meeting minutes",
    title: "Meeting minutes",
    html:
      "<h1>Meeting minutes</h1><p><strong>Date:</strong> [date] &nbsp; <strong>Time:</strong> [time]</p>" +
      "<p><strong>Present:</strong> [names]</p><h2>Points discussed</h2><ol><li>[point]</li></ol>" +
      "<h2>Decisions and owners</h2><ul><li>[decision] - [owner]</li></ul>",
  },
];

const BLANK = "<p></p>";

function errorText(error: unknown, fallback: string) {
  if (error instanceof TypeError) return "Server se connect nahi ho pa raha. Thodi der baad try karo.";
  if (error instanceof Error && error.message) {
    try {
      const parsed = JSON.parse(error.message) as { message?: string | string[] };
      if (parsed.message) {
        return Array.isArray(parsed.message) ? parsed.message.join(" ") : parsed.message;
      }
    } catch {
      /* not JSON, fall through */
    }
    return error.message;
  }
  return fallback;
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/documents${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(body || `Request failed (${response.status})`);
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const PAGE_CSS =
  "body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5;color:#111;margin:24px}" +
  "h1{font-size:22pt}h2{font-size:16pt}h3{font-size:13pt}" +
  "table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:6px;vertical-align:top}" +
  "th{background:#eee}mark{background:#fde68a}";

function ToolButton({
  label,
  icon: Icon,
  active,
  disabled,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active ? true : undefined}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded text-slate-700 hover:bg-slate-100 disabled:opacity-40 ${
        active ? "bg-blue-100 text-blue-800" : ""
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-200" aria-hidden="true" />;
}

export default function NotesEditor() {
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [title, setTitle] = useState("Untitled note");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [words, setWords] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const activeIdRef = useRef<string | null>(null);
  const titleRef = useRef("Untitled note");
  const touchedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [],
  );

  const saveNow = useCallback(async (editorRef: { getHTML: () => string; getText: () => string }): Promise<void> => {
    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    const currentTitle = titleRef.current.trim() || "Untitled note";
    const content = editorRef.getHTML();

    // Do not create an empty note just because the page opened.
    if (!activeIdRef.current && !touchedRef.current && editorRef.getText().trim() === "") return;

    savingRef.current = true;
    setSaveState("saving");

    try {
      if (activeIdRef.current) {
        const saved = await api<NoteDetail>(`/${encodeURIComponent(activeIdRef.current)}`, {
          method: "PATCH",
          body: JSON.stringify({ title: currentTitle, content }),
        });

        setNotes((previous) =>
          previous
            .map((item) =>
              item.id === saved.id ? { ...item, title: saved.title, updatedAt: saved.updatedAt } : item,
            )
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
      } else {
        const saved = await api<NoteDetail>("", {
          method: "POST",
          body: JSON.stringify({ title: currentTitle, content }),
        });

        activeIdRef.current = saved.id;
        setActiveId(saved.id);
        setNotes((previous) => [
          { id: saved.id, title: saved.title, updatedAt: saved.updatedAt },
          ...previous,
        ]);
      }

      setSaveState("saved");
      setError("");
    } catch (err) {
      setSaveState("error");
      setError(errorText(err, "Note save nahi hua."));
    } finally {
      savingRef.current = false;

      if (queuedRef.current) {
        queuedRef.current = false;
        void saveNow(editorRef);
      }
    }
  }, []);

  const editor = useEditor({
    extensions,
    content: BLANK,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "brx-note-content outline-none", spellcheck: "true" },
    },
    onUpdate: ({ editor: current }) => {
      const text = current.getText().trim();

      setWords(text ? text.split(/\s+/).length : 0);
      touchedRef.current = true;
      setSaveState("unsaved");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void saveNow(current), 1500);
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loadList = useCallback(async () => {
    setListLoading(true);

    try {
      const result = await api<NoteSummary[]>("");
      setNotes(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(errorText(err, "Notes load nahi hue. Dobara login karke dekho."));
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  function flash(text: string) {
    setInfo(text);
    window.setTimeout(() => setInfo(""), 3000);
  }

  function resetEditor(nextTitle: string, html: string, id: string | null, touched: boolean) {
    if (timerRef.current) clearTimeout(timerRef.current);

    activeIdRef.current = id;
    setActiveId(id);
    titleRef.current = nextTitle;
    setTitle(nextTitle);
    touchedRef.current = touched;
    setSaveState(touched ? "unsaved" : "saved");
    setConfirmDelete(false);
    setError("");

    editor?.commands.setContent(html || BLANK, { emitUpdate: false });

    const text = editor?.getText().trim() ?? "";
    setWords(text ? text.split(/\s+/).length : 0);

    if (touched && editor) {
      timerRef.current = setTimeout(() => void saveNow(editor), 800);
    }
  }

  async function flushPending() {
    if (!editor) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (saveState === "unsaved") await saveNow(editor);
  }

  async function openNote(id: string) {
    if (id === activeId) return;

    await flushPending();

    try {
      const note = await api<NoteDetail>(`/${encodeURIComponent(id)}`);
      resetEditor(note.title, note.content, note.id, false);
    } catch (err) {
      setError(errorText(err, "Note khul nahi paya."));
    }
  }

  async function newNote(templateName?: string) {
    await flushPending();
    setTemplatesOpen(false);

    const template = TEMPLATES.find((item) => item.name === templateName);

    if (template) {
      resetEditor(template.title, template.html, null, true);
    } else {
      resetEditor("Untitled note", BLANK, null, false);
      editor?.commands.focus();
    }
  }

  async function duplicateNote() {
    if (!editor) return;

    await flushPending();
    resetEditor(`${titleRef.current} (copy)`, editor.getHTML(), null, true);
  }

  async function deleteNote() {
    const id = activeIdRef.current;

    if (!id) {
      resetEditor("Untitled note", BLANK, null, false);
      return;
    }

    try {
      await api<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" });
      setNotes((previous) => previous.filter((item) => item.id !== id));
      resetEditor("Untitled note", BLANK, null, false);
      flash("Note delete ho gaya.");
    } catch (err) {
      setError(errorText(err, "Note delete nahi hua."));
    }
  }

  function onTitleChange(value: string) {
    setTitle(value);
    titleRef.current = value;
    touchedRef.current = true;
    setSaveState("unsaved");

    if (editor) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void saveNow(editor), 1500);
    }
  }

  function fullHtml() {
    const safeTitle = escapeHtml(titleRef.current.trim() || "Untitled note");

    return (
      `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>` +
      `<style>${PAGE_CSS}</style></head><body>${editor?.getHTML() ?? ""}</body></html>`
    );
  }

  function downloadWord() {
    if (!editor) return;

    const name = (titleRef.current.trim() || "note").replace(/[^\w\- ]+/g, "").trim().slice(0, 60) || "note";
    const blob = new Blob(["﻿", fullHtml()], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${name}.doc`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function applyLink() {
    if (!editor) return;

    const raw = linkUrl.trim();

    if (!raw) {
      editor.chain().focus().unsetLink().run();
      setLinkOpen(false);
      return;
    }

    let url: URL;

    try {
      url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    } catch {
      setError("Link sahi nahi hai.");
      return;
    }

    editor.chain().focus().setLink({ href: url.toString() }).run();
    setLinkOpen(false);
    setLinkUrl("");
  }

  const filtered = notes.filter((item) =>
    item.title.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const stateText: Record<SaveState, string> = {
    saved: "Saved",
    saving: "Saving...",
    unsaved: "Unsaved changes",
    error: "Not saved",
  };

  const chain = () => editor?.chain().focus();

  return (
    <div className="flex min-h-[70vh] flex-col gap-4 lg:flex-row">
      {/* ---------- list ---------- */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void newNote()}
            className="flex h-9 flex-1 items-center justify-center gap-1.5 bg-blue-800 px-3 text-xs font-semibold text-white hover:bg-blue-900"
          >
            <FilePlus size={14} />
            New note
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setTemplatesOpen((open) => !open)}
              className="h-9 border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              aria-expanded={templatesOpen}
            >
              Templates
            </button>

            {templatesOpen && (
              <div className="absolute right-0 z-10 mt-1 w-44 border border-slate-200 bg-white shadow">
                {TEMPLATES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => void newNote(item.name)}
                    className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <label className="relative mt-3 block">
          <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
          <input
            id="notes-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes"
            className="h-9 w-full border border-slate-300 pl-8 pr-2 text-sm outline-none focus:border-blue-800"
          />
        </label>

        <ul className="mt-3 max-h-[55vh] overflow-y-auto border border-slate-200">
          {listLoading && <li className="p-3 text-xs text-slate-500">Loading...</li>}

          {!listLoading && filtered.length === 0 && (
            <li className="p-3 text-xs text-slate-500">
              {notes.length === 0 ? "Abhi koi note nahi hai. New note dabao." : "Koi note nahi mila."}
            </li>
          )}

          {filtered.map((item) => (
            <li key={item.id} className="border-b border-slate-100 last:border-b-0">
              <button
                type="button"
                onClick={() => void openNote(item.id)}
                className={`block w-full px-3 py-2 text-left hover:bg-slate-50 ${
                  item.id === activeId ? "bg-blue-50" : ""
                }`}
              >
                <span className="block truncate text-sm font-semibold text-slate-800">{item.title}</span>
                <span className="block text-[11px] text-slate-500">
                  {new Date(item.updatedAt).toLocaleString()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* ---------- editor ---------- */}
      <section className="min-w-0 flex-1 border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <input
            id="note-title"
            value={title}
            maxLength={160}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label="Note title"
            className="h-9 min-w-0 flex-1 border border-slate-300 px-3 text-sm font-semibold outline-none focus:border-blue-800"
          />

          <span
            className={`text-xs ${
              saveState === "error" ? "text-red-700" : saveState === "saved" ? "text-emerald-700" : "text-slate-500"
            }`}
            role="status"
          >
            {stateText[saveState]}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 p-1.5">
          <ToolButton label="Undo" icon={Undo2} disabled={!editor?.can().undo()} onClick={() => chain()?.undo().run()} />
          <ToolButton label="Redo" icon={Redo2} disabled={!editor?.can().redo()} onClick={() => chain()?.redo().run()} />
          <Divider />
          <ToolButton label="Paragraph" icon={Pilcrow} active={editor?.isActive("paragraph")} onClick={() => chain()?.setParagraph().run()} />
          <ToolButton label="Heading 1" icon={Heading1} active={editor?.isActive("heading", { level: 1 })} onClick={() => chain()?.toggleHeading({ level: 1 }).run()} />
          <ToolButton label="Heading 2" icon={Heading2} active={editor?.isActive("heading", { level: 2 })} onClick={() => chain()?.toggleHeading({ level: 2 }).run()} />
          <ToolButton label="Heading 3" icon={Heading3} active={editor?.isActive("heading", { level: 3 })} onClick={() => chain()?.toggleHeading({ level: 3 }).run()} />
          <Divider />
          <ToolButton label="Bold" icon={Bold} active={editor?.isActive("bold")} onClick={() => chain()?.toggleBold().run()} />
          <ToolButton label="Italic" icon={Italic} active={editor?.isActive("italic")} onClick={() => chain()?.toggleItalic().run()} />
          <ToolButton label="Underline" icon={UnderlineIcon} active={editor?.isActive("underline")} onClick={() => chain()?.toggleUnderline().run()} />
          <ToolButton label="Strikethrough" icon={Strikethrough} active={editor?.isActive("strike")} onClick={() => chain()?.toggleStrike().run()} />
          <ToolButton label="Highlight" icon={Highlighter} active={editor?.isActive("highlight")} onClick={() => chain()?.toggleHighlight({ color: "#fde68a" }).run()} />
          <label className="flex h-8 items-center gap-1 px-1 text-xs text-slate-600" title="Text colour">
            A
            <input
              id="note-color"
              type="color"
              defaultValue="#111111"
              aria-label="Text colour"
              onChange={(event) => chain()?.setColor(event.target.value).run()}
              className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
            />
          </label>
          <Divider />
          <ToolButton label="Bullet list" icon={List} active={editor?.isActive("bulletList")} onClick={() => chain()?.toggleBulletList().run()} />
          <ToolButton label="Numbered list" icon={ListOrdered} active={editor?.isActive("orderedList")} onClick={() => chain()?.toggleOrderedList().run()} />
          <Divider />
          <ToolButton label="Align left" icon={AlignLeft} active={editor?.isActive({ textAlign: "left" })} onClick={() => chain()?.setTextAlign("left").run()} />
          <ToolButton label="Align centre" icon={AlignCenter} active={editor?.isActive({ textAlign: "center" })} onClick={() => chain()?.setTextAlign("center").run()} />
          <ToolButton label="Align right" icon={AlignRight} active={editor?.isActive({ textAlign: "right" })} onClick={() => chain()?.setTextAlign("right").run()} />
          <ToolButton label="Justify" icon={AlignJustify} active={editor?.isActive({ textAlign: "justify" })} onClick={() => chain()?.setTextAlign("justify").run()} />
          <Divider />
          <ToolButton label="Link" icon={LinkIcon} active={editor?.isActive("link")} onClick={() => setLinkOpen((open) => !open)} />
          <ToolButton label="Insert table" icon={TableIcon} onClick={() => chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          <ToolButton label="Horizontal line" icon={Minus} onClick={() => chain()?.setHorizontalRule().run()} />
        </div>

        {editor?.isActive("table") && (
          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 bg-blue-50 p-1.5 text-xs">
            {[
              ["Add row", () => chain()?.addRowAfter().run()],
              ["Add column", () => chain()?.addColumnAfter().run()],
              ["Delete row", () => chain()?.deleteRow().run()],
              ["Delete column", () => chain()?.deleteColumn().run()],
              ["Delete table", () => chain()?.deleteTable().run()],
            ].map(([label, action]) => (
              <button
                key={label as string}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={action as () => void}
                className="border border-blue-200 bg-white px-2 py-1 font-semibold text-blue-900 hover:bg-blue-100"
              >
                {label as string}
              </button>
            ))}
          </div>
        )}

        {linkOpen && (
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 p-2">
            <input
              id="note-link"
              value={linkUrl}
              onChange={(event) => setLinkUrl(event.target.value)}
              placeholder="https://example.com"
              aria-label="Link address"
              className="h-8 min-w-0 flex-1 border border-slate-300 px-2 text-sm outline-none focus:border-blue-800"
            />
            <button type="button" onClick={applyLink} className="h-8 bg-blue-800 px-3 text-xs font-semibold text-white">
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().unsetLink().run();
                setLinkOpen(false);
              }}
              className="h-8 border border-slate-300 px-3 text-xs font-semibold text-slate-700"
            >
              Remove link
            </button>
          </div>
        )}

        <div className="max-h-[60vh] min-h-72 overflow-y-auto p-4 sm:p-6">
          <EditorContent editor={editor} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 p-2">
          <span className="text-xs text-slate-500">{words} words</span>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void duplicateNote()}
              className="flex h-8 items-center gap-1.5 border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Copy size={13} /> Duplicate
            </button>
            <button
              type="button"
              onClick={downloadWord}
              className="flex h-8 items-center gap-1.5 border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={13} /> Word (.doc)
            </button>
            <button
              type="button"
              onClick={() => printHtml(fullHtml())}
              className="flex h-8 items-center gap-1.5 border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Printer size={13} /> Print / PDF
            </button>

            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={() => void deleteNote()}
                  className="h-8 bg-red-700 px-2.5 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-8 items-center gap-1.5 border border-red-200 bg-white px-2.5 text-xs font-semibold text-red-700 hover:bg-red-50"
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        </div>

        {(error || info) && (
          <p
            role="status"
            className={`border-t p-2 text-xs ${
              error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {error || info}
          </p>
        )}
      </section>

      <style>{`
        .brx-note-content { min-height: 14rem; line-height: 1.6; color: #111827; }
        .brx-note-content h1 { font-size: 1.75rem; font-weight: 700; margin: 0.8rem 0 0.4rem; }
        .brx-note-content h2 { font-size: 1.35rem; font-weight: 700; margin: 0.8rem 0 0.4rem; }
        .brx-note-content h3 { font-size: 1.1rem; font-weight: 700; margin: 0.7rem 0 0.3rem; }
        .brx-note-content p { margin: 0.4rem 0; }
        .brx-note-content ul { list-style: disc; padding-left: 1.5rem; margin: 0.4rem 0; }
        .brx-note-content ol { list-style: decimal; padding-left: 1.5rem; margin: 0.4rem 0; }
        .brx-note-content a { color: #1d4ed8; text-decoration: underline; }
        .brx-note-content mark { background: #fde68a; }
        .brx-note-content hr { margin: 1rem 0; border-color: #cbd5e1; }
        .brx-note-content table { border-collapse: collapse; width: 100%; margin: 0.6rem 0; }
        .brx-note-content td, .brx-note-content th { border: 1px solid #94a3b8; padding: 6px 8px; vertical-align: top; min-width: 3rem; }
        .brx-note-content th { background: #f1f5f9; font-weight: 700; }
        .brx-note-content .selectedCell { background: #dbeafe; }
      `}</style>
    </div>
  );
}
