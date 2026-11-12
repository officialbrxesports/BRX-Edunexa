"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
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
import {
  Save, FolderOpen, Download, Printer, Undo2, Redo2, Bold, Italic,
  Underline, Strikethrough, Palette, Highlighter, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Heading1, Heading2,
  Table2, ImagePlus, Link2, RotateCcw, RotateCw, Search, SpellCheck,
  ZoomIn, ZoomOut, Trash2, Merge, Split, Plus, Minus,
  Copy, ClipboardPaste, PanelTop, Layout, Eye, Quote,
  Minus as DividerIcon, Pilcrow, Rows3, Columns3, Maximize2,
  FileText, Check, X, Eraser, Indent, Outdent,
} from "lucide-react";

const CONTENT_KEY = "brx-ai-editor-content-v4";
const TITLE_KEY = "brx-ai-editor-title-v4";

type RibbonTab = "Home" | "Insert" | "Layout" | "Review" | "View";

const FontAttributes = Extension.create({
  name: "brxFontAttributes",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element: HTMLElement) => element.style.fontSize || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.fontSize ? { style: `font-size:${attrs.fontSize}` } : {},
        },
        fontFamily: {
          default: null,
          parseHTML: (element: HTMLElement) => element.style.fontFamily || null,
          renderHTML: (attrs: Record<string, unknown>) =>
            attrs.fontFamily ? { style: `font-family:${attrs.fontFamily}` } : {},
        },
      },
    }];
  },
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "420px",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("width") || element.style.width || "420px",
        renderHTML: (attrs: Record<string, unknown>) => ({ width: attrs.width }),
      },
      rotation: {
        default: "0deg",
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-rotation") || "0deg",
        renderHTML: (attrs: Record<string, unknown>) => ({
          "data-rotation": attrs.rotation,
        }),
      },
    };
  },
}).configure({ inline: false, allowBase64: true });

function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  disabled = false,
  children,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`group relative flex h-9 min-w-9 items-center justify-center gap-1.5 border px-2 transition-colors ${
        active
          ? "border-blue-300 bg-blue-100 text-blue-800"
          : "border-transparent bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      <Icon size={17} strokeWidth={1.9} />
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 hidden -translate-x-1/2 whitespace-nowrap border border-slate-300 bg-slate-900 px-2 py-1 text-[11px] font-normal text-white shadow group-hover:block">
        {label}
      </span>
    </button>
  );
}

function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-19 flex-col justify-between border-r border-slate-200 px-2 py-1.5 last:border-r-0">
      <div className="flex flex-wrap items-center gap-1">{children}</div>
      <span className="pt-1 text-center text-[10px] text-slate-500">{label}</span>
    </div>
  );
}

function SelectControl({
  label, value, onChange, children, className = "",
}: {
  label: string; value: string; onChange: (value: string) => void;
  children: ReactNode; className?: string;
}) {
  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-9 border border-slate-300 bg-white px-2 text-xs text-slate-700 outline-none focus:border-blue-500 ${className}`}
    >
      {children}
    </select>
  );
}

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState<RibbonTab>("Home");
  const [title, setTitle] = useState("My Document");
  const [status, setStatus] = useState("");
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [zoom, setZoom] = useState("100");
  const [rows, setRows] = useState("3");
  const [columns, setColumns] = useState("3");
  const [findText, setFindText] = useState("");
  const [pictureWidth, setPictureWidth] = useState("420px");

  const extensions = useMemo(() => [
    StarterKit,
    TextStyle,
    FontAttributes,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    ResizableImage,
    Table.configure({ resizable: true, HTMLAttributes: { class: "brx-table" } }),
    TableRow,
    TableHeader,
    TableCell,
  ], []);

  const editor = useEditor({
    extensions,
    content: "<h1>Welcome to BRX AI Editor</h1><p>Start writing your document here.</p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "brx-editor-content min-h-[1000px] bg-white px-12 py-12 text-base leading-7 text-slate-800 outline-none",
        spellcheck: "true",
      },
    },
  });

  // Load once when the editor becomes available; no React state update in this effect.
  useEffect(() => {
    if (!editor) return;
    const saved = window.localStorage.getItem(CONTENT_KEY);
    if (saved) editor.commands.setContent(saved);
    const savedTitle = window.localStorage.getItem(TITLE_KEY);
    if (savedTitle) {
      const titleInput = document.querySelector<HTMLInputElement>("[data-document-title]");
      if (titleInput) titleInput.value = savedTitle;
    }
  }, [editor]);

  function notify(message: string) {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 2600);
  }

  function saveDocument() {
    if (!editor) return;
    try {
      localStorage.setItem(CONTENT_KEY, editor.getHTML());
      localStorage.setItem(TITLE_KEY, title);
      notify("Document saved in this browser.");
    } catch {
      notify("Save failed. Try reducing large images.");
    }
  }

  function downloadHtml() {
    if (!editor) return;
    const safeTitle = title.trim() || "Document";
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safeTitle}</title>
<style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;line-height:1.7}
table{border-collapse:collapse;width:100%}td,th{border:1px solid #777;padding:8px}
img{max-width:100%;height:auto}th{background:#e5efff}</style></head><body>${editor.getHTML()}</body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeTitle.replace(/[\\/:*?"<>|]/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notify("HTML file downloaded.");
  }

  function openDocument(file?: File) {
    if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      if (file.name.toLowerCase().endsWith(".txt")) {
        const escaped = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;")
          .replace(/>/g, "&gt;").replace(/\r?\n/g, "<br>");
        editor.commands.setContent(`<p>${escaped}</p>`);
      } else {
        const parsed = new DOMParser().parseFromString(raw, "text/html");
        editor.commands.setContent(parsed.body.innerHTML || "<p></p>");
      }
      setTitle(file.name.replace(/\.[^.]+$/, ""));
      notify("Document opened.");
    };
    reader.readAsText(file);
  }

  function insertPicture(file?: File) {
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) return notify("Choose an image file.");
    if (file.size > 3 * 1024 * 1024) return notify("Image must be smaller than 3 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      editor.chain().focus().setImage({
        src: String(reader.result), alt: file.name, width: "420px", rotation: "0deg",
      } as never).run();
      notify("Picture inserted.");
    };
    reader.readAsDataURL(file);
  }

  function addHyperlink() {
    if (!editor) return;
    const value = window.prompt("Enter website address:");
    if (!value) return;
    const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    editor.chain().focus().setLink({ href, target: "_blank" }).run();
  }

  function insertTable() {
    editor?.chain().focus().insertTable({
      rows: Number(rows), cols: Number(columns), withHeaderRow: true,
    }).run();
  }

  function applyFontSize(value: string) {
    setFontSize(value);
    editor?.chain().focus().setMark("textStyle", { fontSize: value }).run();
  }

  function applyFontFamily(value: string) {
    setFontFamily(value);
    editor?.chain().focus().setMark("textStyle", { fontFamily: value }).run();
  }

  function applyPictureWidth(value: string) {
    setPictureWidth(value);
    editor?.chain().focus().updateAttributes("image", { width: value }).run();
  }

  function rotatePicture(degrees: number) {
    if (!editor) return;
    const current = String(editor.getAttributes("image").rotation || "0deg");
    const next = (Number.parseInt(current, 10) + degrees + 360) % 360;
    editor.chain().focus().updateAttributes("image", { rotation: `${next}deg` }).run();
  }

  function findInDocument() {
    if (!editor || !findText.trim()) return;
    const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n");
    const found = text.toLocaleLowerCase().includes(findText.trim().toLocaleLowerCase());
    notify(found ? `Found: ${findText}` : `Not found: ${findText}`);
  }

  const wordCount = editor
    ? editor.getText().trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-800">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-blue-800 px-4 py-2.5 text-white">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center bg-white text-blue-800"><FileText size={21} /></div>
          <div>
            <h1 className="text-lg font-bold leading-5">BRX AI Editor</h1>
            <p className="text-[11px] text-blue-100">EduNexa · Document workspace</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <input
            data-document-title
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Document title"
            className="h-9 w-44 border border-blue-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500"
          />
          <IconButton icon={Save} label="Save" onClick={saveDocument} />
          <label title="Open document" className="flex h-9 w-9 cursor-pointer items-center justify-center border border-transparent text-white hover:bg-blue-700">
            <FolderOpen size={18} />
            <input type="file" accept=".html,.htm,.txt" className="hidden" onChange={(e) => { openDocument(e.target.files?.[0]); e.currentTarget.value = ""; }} />
          </label>
          <IconButton icon={Download} label="Download HTML" onClick={downloadHtml} />
          <IconButton icon={Printer} label="Print / Save as PDF" onClick={() => window.print()} />
        </div>
      </header>

      <nav className="flex flex-wrap border-b border-slate-300 bg-white px-2">
        {(["Home", "Insert", "Layout", "Review", "View"] as RibbonTab[]).map((tab) => (
          <button
            type="button" key={tab} onClick={() => setActiveTab(tab)}
            className={`border-b-[3px] px-5 py-2.5 text-sm font-medium ${
              activeTab === tab ? "border-blue-700 bg-blue-50 text-blue-800" : "border-transparent text-slate-600 hover:bg-slate-50"
            }`}
          >{tab}</button>
        ))}
      </nav>

      <section className="border-b border-slate-300 bg-white">
        {activeTab === "Home" && (
          <div className="flex flex-wrap">
            <RibbonGroup label="Clipboard">
              <IconButton icon={Undo2} label="Undo" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor} />
              <IconButton icon={Redo2} label="Redo" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor} />
              <IconButton icon={Copy} label="Copy (Ctrl+C)" onClick={() => notify("Use Ctrl+C to copy selected text.")} />
              <IconButton icon={ClipboardPaste} label="Paste (Ctrl+V)" onClick={() => notify("Use Ctrl+V to paste from clipboard.")} />
            </RibbonGroup>
            <RibbonGroup label="Font">
              <SelectControl label="Font family" value={fontFamily} onChange={applyFontFamily}>
                {["Arial", "Calibri", "Georgia", "Times New Roman", "Verdana", "Courier New"].map((f) => <option key={f}>{f}</option>)}
              </SelectControl>
              <SelectControl label="Font size" value={fontSize} onChange={applyFontSize}>
                {["8px","9px","10px","11px","12px","14px","16px","18px","20px","24px","28px","32px","36px","48px","72px"].map((s) => <option key={s}>{s}</option>)}
              </SelectControl>
              <IconButton icon={Bold} label="Bold" active={!!editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()} />
              <IconButton icon={Italic} label="Italic" active={!!editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()} />
              <IconButton icon={Underline} label="Underline" active={!!editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()} />
              <IconButton icon={Strikethrough} label="Strikethrough" active={!!editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()} />
              <label title="Text color" className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-blue-50"><Palette size={17} /><input type="color" aria-label="Text color" className="sr-only" onChange={(e) => editor?.chain().focus().setColor(e.target.value).run()} /></label>
              <label title="Highlight color" className="flex h-9 w-9 cursor-pointer items-center justify-center hover:bg-blue-50"><Highlighter size={17} /><input type="color" aria-label="Highlight color" defaultValue="#fff176" className="sr-only" onChange={(e) => editor?.chain().focus().toggleHighlight({ color: e.target.value }).run()} /></label>
              <IconButton icon={Eraser} label="Clear formatting" onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()} />
            </RibbonGroup>
            <RibbonGroup label="Paragraph">
              <IconButton icon={Heading1} label="Heading 1" active={!!editor?.isActive("heading", { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} />
              <IconButton icon={Heading2} label="Heading 2" active={!!editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} />
              <IconButton icon={Pilcrow} label="Normal paragraph" onClick={() => editor?.chain().focus().setParagraph().run()} />
              <IconButton icon={AlignLeft} label="Align left" onClick={() => editor?.chain().focus().setTextAlign("left").run()} />
              <IconButton icon={AlignCenter} label="Align center" onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
              <IconButton icon={AlignRight} label="Align right" onClick={() => editor?.chain().focus().setTextAlign("right").run()} />
              <IconButton icon={AlignJustify} label="Justify" onClick={() => editor?.chain().focus().setTextAlign("justify").run()} />
              <IconButton icon={List} label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()} />
              <IconButton icon={ListOrdered} label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} />
              <IconButton icon={Quote} label="Block quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} />
              <IconButton icon={DividerIcon} label="Horizontal divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
            </RibbonGroup>
          </div>
        )}

        {activeTab === "Insert" && (
          <div className="flex flex-wrap">
            <RibbonGroup label="Table">
              <SelectControl label="Rows" value={rows} onChange={setRows}>{["2","3","4","5","6","8","10"].map((n) => <option key={n}>{n}</option>)}</SelectControl>
              <SelectControl label="Columns" value={columns} onChange={setColumns}>{["2","3","4","5","6","8"].map((n) => <option key={n}>{n}</option>)}</SelectControl>
              <IconButton icon={Table2} label="Insert table" onClick={insertTable} />
              <IconButton icon={Plus} label="Add row after" onClick={() => editor?.chain().focus().addRowAfter().run()} />
              <IconButton icon={Rows3} label="Add row before" onClick={() => editor?.chain().focus().addRowBefore().run()} />
              <IconButton icon={Columns3} label="Add column after" onClick={() => editor?.chain().focus().addColumnAfter().run()} />
              <IconButton icon={Trash2} label="Delete row" onClick={() => editor?.chain().focus().deleteRow().run()} />
              <IconButton icon={Minus} label="Delete column" onClick={() => editor?.chain().focus().deleteColumn().run()} />
              <IconButton icon={Merge} label="Merge cells" onClick={() => editor?.chain().focus().mergeCells().run()} />
              <IconButton icon={Split} label="Split cell" onClick={() => editor?.chain().focus().splitCell().run()} />
              <IconButton icon={X} label="Delete table" onClick={() => editor?.chain().focus().deleteTable().run()} />
            </RibbonGroup>
            <RibbonGroup label="Illustrations">
              <label title="Insert picture" className="flex h-9 w-9 cursor-pointer items-center justify-center text-slate-700 hover:bg-blue-50"><ImagePlus size={18} /><input type="file" accept="image/*" className="hidden" onChange={(e) => { insertPicture(e.target.files?.[0]); e.currentTarget.value = ""; }} /></label>
              <IconButton icon={Link2} label="Insert hyperlink" onClick={addHyperlink} />
              <IconButton icon={DividerIcon} label="Insert divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()} />
            </RibbonGroup>
          </div>
        )}

        {activeTab === "Layout" && (
          <div className="flex flex-wrap">
            <RibbonGroup label="Page setup">
              <IconButton icon={Layout} label="Page margins (print dialog)" onClick={() => { notify("Adjust margins in the Print dialog."); window.print(); }} />
              <IconButton icon={PanelTop} label="Print setup" onClick={() => window.print()} />
            </RibbonGroup>
            <RibbonGroup label="Indent">
              <IconButton icon={Outdent} label="Decrease list indent" onClick={() => editor?.chain().focus().liftListItem("listItem").run()} />
              <IconButton icon={Indent} label="Increase list indent" onClick={() => editor?.chain().focus().sinkListItem("listItem").run()} />
            </RibbonGroup>
          </div>
        )}

        {activeTab === "Review" && (
          <div className="flex flex-wrap">
            <RibbonGroup label="Proofing">
              <span className="px-2 text-xs text-slate-600">Words: {wordCount}</span>
              <IconButton icon={SpellCheck} label="Spellcheck information" onClick={() => notify("Browser spellcheck is enabled. Right-click underlined words.")} />
            </RibbonGroup>
            <RibbonGroup label="Find">
              <input value={findText} onChange={(e) => setFindText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") findInDocument(); }} placeholder="Find text..." className="h-9 w-36 border border-slate-300 px-2 text-xs outline-none focus:border-blue-500" />
              <IconButton icon={Search} label="Find in document" onClick={findInDocument} />
              <IconButton icon={X} label="Clear search" onClick={() => setFindText("")} />
            </RibbonGroup>
          </div>
        )}

        {activeTab === "View" && (
          <div className="flex flex-wrap">
            <RibbonGroup label="Zoom">
              <IconButton icon={ZoomOut} label="Zoom out" onClick={() => setZoom(String(Math.max(60, Number(zoom) - 10)))} />
              <SelectControl label="Zoom level" value={zoom} onChange={setZoom}>{["60","75","80","90","100","110","125","150","175","200"].map((n) => <option key={n}>{n}</option>)}</SelectControl>
              <IconButton icon={ZoomIn} label="Zoom in" onClick={() => setZoom(String(Math.min(200, Number(zoom) + 10)))} />
            </RibbonGroup>
            <RibbonGroup label="Document view">
              <IconButton icon={PanelTop} label="Go to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
              <IconButton icon={Eye} label="Print preview" onClick={() => window.print()} />
            </RibbonGroup>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1 border-t border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="px-1 text-[10px] font-bold tracking-wide text-slate-500">TABLE</span>
          <IconButton icon={Rows3} label="Row before" onClick={() => editor?.chain().focus().addRowBefore().run()} />
          <IconButton icon={Plus} label="Row after" onClick={() => editor?.chain().focus().addRowAfter().run()} />
          <IconButton icon={Columns3} label="Column before" onClick={() => editor?.chain().focus().addColumnBefore().run()} />
          <IconButton icon={Plus} label="Column after" onClick={() => editor?.chain().focus().addColumnAfter().run()} />
          <IconButton icon={Check} label="Toggle header row" onClick={() => editor?.chain().focus().toggleHeaderRow().run()} />
          <span className="ml-2 px-1 text-[10px] font-bold tracking-wide text-slate-500">PICTURE</span>
          <SelectControl label="Selected picture width" value={pictureWidth} onChange={applyPictureWidth}>
            {["120px","180px","240px","300px","360px","420px","500px","600px","720px","100%"].map((w) => <option key={w}>{w}</option>)}
          </SelectControl>
          <IconButton icon={RotateCcw} label="Rotate left" onClick={() => rotatePicture(-90)} />
          <IconButton icon={RotateCw} label="Rotate right" onClick={() => rotatePicture(90)} />
          <IconButton icon={Maximize2} label="Picture full width" onClick={() => applyPictureWidth("100%")} />
          <IconButton icon={Trash2} label="Delete selected item" onClick={() => editor?.chain().focus().deleteSelection().run()} />
        </div>
      </section>

      <section className="mx-auto w-full max-w-300 px-3 py-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>Document · {title}</span><span>{wordCount} words · {zoom}%</span>
        </div>
        <div className="overflow-x-auto border border-slate-300 bg-white shadow-sm">
          <div style={{ zoom: `${zoom}%` }}><EditorContent editor={editor} /></div>
        </div>
      </section>

      {status && <div role="status" className="fixed bottom-5 right-5 z-50 border border-blue-300 bg-white px-4 py-3 text-sm text-blue-900 shadow-lg">{status}</div>}

      <style jsx global>{`
        .brx-editor-content h1{margin:1.2rem 0;font-size:2rem;font-weight:700;line-height:1.25}
        .brx-editor-content h2{margin:1rem 0;font-size:1.5rem;font-weight:700;line-height:1.3}
        .brx-editor-content h3{margin:.8rem 0;font-size:1.2rem;font-weight:700}
        .brx-editor-content p{margin:.45rem 0}
        .brx-editor-content ul{list-style:disc;padding-left:2rem}
        .brx-editor-content ol{list-style:decimal;padding-left:2rem}
        .brx-editor-content blockquote{margin:1rem 0;border-left:4px solid #2563eb;padding-left:1rem;color:#475569}
        .brx-editor-content table{width:100%;margin:1rem 0;border-collapse:collapse;table-layout:fixed}
        .brx-editor-content th,.brx-editor-content td{position:relative;min-width:80px;border:1px solid #94a3b8;padding:8px;vertical-align:top}
        .brx-editor-content th{background:#dbeafe;font-weight:700}
        .brx-editor-content .selectedCell:after{position:absolute;z-index:2;inset:0;background:rgba(59,130,246,.14);content:"";pointer-events:none}
        .brx-editor-content img{display:inline-block;max-width:100%;height:auto;cursor:pointer}
        .brx-editor-content img[data-rotation="90deg"]{transform:rotate(90deg)}
        .brx-editor-content img[data-rotation="180deg"]{transform:rotate(180deg)}
        .brx-editor-content img[data-rotation="270deg"]{transform:rotate(270deg)}
        .brx-editor-content a{color:#1d4ed8;text-decoration:underline}
        .brx-editor-content hr{margin:1.5rem 0;border:0;border-top:2px solid #cbd5e1}
        @media print{
          header,nav,main>section:first-of-type,.fixed{display:none!important}
          body,main{background:#fff!important}
          .brx-editor-content{min-height:auto!important;padding:0!important}
        }
      `}</style>
    </main>
  );
}
