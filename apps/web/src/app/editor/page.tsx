
"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, CSSProperties, ReactNode } from "react";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
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
import { Extension, Mark, Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import SendNoteModal from "../../components/dashboard/SendNoteModal";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  BookOpen,
  Bold,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardPaste,
  CloudUpload,
  Columns2,
  Copy,
  Download,
  Eraser,
  Eye,
  FilePlus,
  FileText,
  FolderOpen,
  Globe2,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Lock,
  Minus,
  Omega,
  PaintRoller,
  Palette,
  Pilcrow,
  Printer,
  Quote,
  RectangleVertical,
  Redo2,
  Replace,
  Save,
  Scissors,
  Search,
  Square,
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
  | "Design"
  | "Layout"
  | "References"
  | "Review"
  | "View"
  | "Table"
  | "Picture";

type FileView = "new" | "open" | "save" | "export" | "print";
type ViewMode = "print" | "web" | "read";

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

const Subscript = Mark.create({
  name: "subscript",
  excludes: "superscript",
  parseHTML() {
    return [{ tag: "sub" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sub", mergeAttributes(HTMLAttributes), 0];
  },
});

const Superscript = Mark.create({
  name: "superscript",
  excludes: "subscript",
  parseHTML() {
    return [{ tag: "sup" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["sup", mergeAttributes(HTMLAttributes), 0];
  },
});

const PageBreak = TiptapNode.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "page-break" })];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.insertContent({ type: this.name }),
    };
  },
});

const SYMBOLS = [
  "©", "®", "™", "°", "±", "×", "÷", "≠", "≤", "≥", "≈", "∞", "√", "∑", "π", "Ω",
  "α", "β", "γ", "θ", "λ", "μ", "→", "←", "↑", "↓", "✓", "✗", "★", "•", "§", "¶",
  "₹", "€", "£", "¥", "½", "¼", "¾", "²", "³",
];

const DOC_TEMPLATES: { name: string; title: string; html: string }[] = [
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
  {
    name: "Letter",
    title: "Letter",
    html:
      "<p>[Your name]<br>[Address]</p><p>[Date]</p><p>To,<br>[Recipient name]<br>[Recipient address]</p>" +
      "<p><strong>Subject: [subject]</strong></p><p>Dear [name],</p><p>[Body of the letter]</p><p>Yours sincerely,<br>[Your name]</p>",
  },
  {
    name: "Leave application",
    title: "Leave application",
    html:
      "<p>Date: [date]</p><p>To,<br>The Principal / Head,<br>[Institution name]</p><p><strong>Subject: Application for leave</strong></p>" +
      "<p>Respected Sir / Madam,</p><p>I request leave from [start date] to [end date] because [reason]. Kindly grant me leave for this period.</p>" +
      "<p>Thank you.</p><p>Yours faithfully,<br>[Name], [Class / Designation]</p>",
  },
];

const Indent = Extension.create({
  name: "indent",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          indent: {
            default: 0,
            parseHTML: (element: HTMLElement) =>
              Number(element.getAttribute("data-indent")) || 0,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.indent
                ? {
                    "data-indent": String(attributes.indent),
                    style: `margin-left: ${Number(attributes.indent) * 36}pt`,
                  }
                : {},
          },
        },
      },
    ];
  },
});

const TextStyleAttrs = Extension.create({
  name: "textStyleAttrs",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => element.style.fontSize || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
          },
          fontFamily: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              element.style.fontFamily.replace(/['"]/g, "") || null,
            renderHTML: (attributes: Record<string, unknown>) =>
              attributes.fontFamily
                ? { style: `font-family: ${attributes.fontFamily}` }
                : {},
          },
        },
      },
    ];
  },
});

type PainterSource = {
  from: number;
  to: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  highlight: string | null;
  textStyle: Record<string, string>;
};

const FONT_LIST = [
  "Arial", "Calibri", "Times New Roman", "Georgia", "Verdana",
  "Courier New", "Trebuchet MS", "Tahoma", "Cambria",
];

const TEXT_COLORS = [
  "#000000", "#595959", "#c00000", "#ff0000", "#ffc000", "#ffff00",
  "#00b050", "#00b0f0", "#0070c0", "#7030a0", "#2b579a", "#ffffff",
];

const HIGHLIGHTS = [
  "#ffff00", "#00ff00", "#00ffff", "#ff00ff", "#bdd7ee", "#ff9999",
  "#d9d9d9", "#ffd966", "#c6e0b4", "#f8cbad", "#d9c3f0", "#fff176",
];

const HEADING_COLORS = [
  "#000000", "#2b579a", "#1e7145", "#c00000", "#7030a0", "#c55a11",
  "#44546a", "#7b2d26", "#0070c0", "#595959", "#00b050", "#bf8f00",
];

const PAGE_COLORS = [
  { label: "White", value: "#ffffff" },
  { label: "Cream", value: "#fffbeb" },
  { label: "Light grey", value: "#f1f5f9" },
  { label: "Light blue", value: "#eff6ff" },
  { label: "Light green", value: "#f0fdf4" },
  { label: "Light pink", value: "#fdf2f8" },
];

const THEMES = [
  { name: "Office", body: "Arial", heading: "Arial", color: null as string | null },
  { name: "Classic", body: "Times New Roman", heading: "Times New Roman", color: "#000000" },
  { name: "Modern", body: "Calibri", heading: "Calibri", color: "#2b579a" },
  { name: "Elegant", body: "Georgia", heading: "Georgia", color: "#7b2d26" },
  { name: "Fresh", body: "Verdana", heading: "Verdana", color: "#1e7145" },
  { name: "Formal", body: "Trebuchet MS", heading: "Trebuchet MS", color: "#44546a" },
];

const RIBBON_BLUE = "#2b579a";

function BigButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={title ?? label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex min-w-[54px] flex-col items-center justify-start gap-0.5 rounded px-1.5 pb-0.5 pt-1 text-[11px] leading-[13px] text-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-[#c7e0f4] ring-1 ring-[#7fb2e0]" : "hover:bg-[#dcebf7]"
      }`}
    >
      <span className="flex h-8 items-center justify-center" style={{ color: RIBBON_BLUE }}>
        {icon}
      </span>
      <span className="max-w-[78px] text-center">{label}</span>
    </button>
  );
}

function SmallButton({
  label,
  icon,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  label?: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={title ?? label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-6 min-w-6 items-center justify-center gap-1.5 rounded px-1 text-[11px] text-slate-800 transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active ? "bg-[#c7e0f4] ring-1 ring-[#7fb2e0]" : "hover:bg-[#dcebf7]"
      }`}
    >
      <span className="flex items-center" style={{ color: RIBBON_BLUE }}>
        {icon}
      </span>
      {label && <span className="whitespace-nowrap">{label}</span>}
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
    <div className="flex shrink-0 flex-col border-r border-[#d4d4d4] px-1.5">
      <div className="flex flex-1 items-stretch gap-0.5 py-1">{children}</div>
      <div className="pb-0.5 text-center text-[11px] leading-3 text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col justify-center gap-0.5">{children}</div>;
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-[#d4d4d4]" />;
}

function SmallSelect({
  label,
  value,
  onChange,
  options,
  width,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  width: number;
}) {
  const list = options.some((option) => option.value === value)
    ? options
    : [{ label: value, value }, ...options];

  return (
    <select
      aria-label={label}
      title={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ width }}
      className="h-6 rounded-sm border border-[#c6c6c6] bg-white px-1 text-[12px] text-slate-800 outline-none hover:border-[#7fb2e0] focus:border-[#2b579a]"
    >
      {list.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function DropMenu({
  variant = "small",
  label,
  icon,
  title,
  minWidth = 200,
  children,
}: {
  variant?: "big" | "small";
  label?: string;
  icon: ReactNode;
  title?: string;
  minWidth?: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    const onScroll = (event: Event) => {
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);

    document.addEventListener("mousedown", onDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  function toggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        left: Math.max(4, Math.min(rect.left, window.innerWidth - minWidth - 8)),
        top: rect.bottom + 2,
      });
    }
    setOpen((value) => !value);
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        title={title ?? label}
        aria-label={title ?? label}
        aria-expanded={open}
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggle}
        className={
          variant === "big"
            ? `flex min-w-[54px] flex-col items-center justify-start gap-0.5 rounded px-1.5 pb-0.5 pt-1 text-[11px] leading-[13px] text-slate-800 transition ${
                open ? "bg-[#c7e0f4] ring-1 ring-[#7fb2e0]" : "hover:bg-[#dcebf7]"
              }`
            : `flex h-6 min-w-6 items-center justify-center gap-1 rounded px-1 text-[11px] text-slate-800 transition ${
                open ? "bg-[#c7e0f4] ring-1 ring-[#7fb2e0]" : "hover:bg-[#dcebf7]"
              }`
        }
      >
        {variant === "big" ? (
          <>
            <span className="flex h-8 items-center justify-center" style={{ color: RIBBON_BLUE }}>
              {icon}
            </span>
            <span className="flex max-w-[78px] items-center justify-center gap-0.5 text-center">
              {label}
              <ChevronDown size={10} />
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center" style={{ color: RIBBON_BLUE }}>
              {icon}
            </span>
            {label && <span className="whitespace-nowrap">{label}</span>}
            <ChevronDown size={10} />
          </>
        )}
      </button>
      {open && (
        <div
          ref={menuRef}
          style={{ left: pos.left, top: pos.top, minWidth }}
          className="fixed z-[70] max-h-[70vh] overflow-y-auto rounded-sm border border-[#c6c6c6] bg-white py-1 text-[12px] text-slate-800 shadow-xl"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </>
  );
}

function MenuItem({
  label,
  hint,
  icon,
  active = false,
  onClick,
  close,
}: {
  label: string;
  hint?: string;
  icon?: ReactNode;
  active?: boolean;
  onClick: () => void;
  close: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => {
        onClick();
        close();
      }}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-[#dcebf7] ${
        active ? "bg-[#e6f0fa]" : ""
      }`}
    >
      <span className="flex w-4 items-center justify-center" style={{ color: RIBBON_BLUE }}>
        {active ? <Check size={14} /> : icon}
      </span>
      <span className="flex-1">
        <span className="block">{label}</span>
        {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
      </span>
    </button>
  );
}

function SwatchGrid({
  colors,
  onPick,
  close,
}: {
  colors: string[];
  onPick: (color: string) => void;
  close: () => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-1 px-2 py-1">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          title={color}
          aria-label={color}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => {
            onPick(color);
            close();
          }}
          className="h-5 w-5 rounded-sm border border-slate-300 hover:ring-2 hover:ring-[#7fb2e0]"
          style={{ background: color }}
        />
      ))}
    </div>
  );
}

function TableGrid({
  onPick,
  close,
}: {
  onPick: (rows: number, cols: number) => void;
  close: () => void;
}) {
  const [hover, setHover] = useState({ rows: 0, cols: 0 });

  return (
    <div className="px-3 py-2">
      <div className="mb-1 text-[11px] text-slate-600">
        {hover.rows > 0 ? `${hover.cols} x ${hover.rows} table` : "Insert table"}
      </div>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: "repeat(10, 16px)" }}
        onMouseLeave={() => setHover({ rows: 0, cols: 0 })}
      >
        {Array.from({ length: 8 }).map((_, row) =>
          Array.from({ length: 10 }).map((__, col) => (
            <button
              key={`${row}-${col}`}
              type="button"
              aria-label={`${col + 1} columns, ${row + 1} rows`}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setHover({ rows: row + 1, cols: col + 1 })}
              onClick={() => {
                onPick(row + 1, col + 1);
                close();
              }}
              className={`h-4 w-4 border ${
                row < hover.rows && col < hover.cols
                  ? "border-[#2b579a] bg-[#c7e0f4]"
                  : "border-slate-300 bg-white"
              }`}
            />
          )),
        )}
      </div>
    </div>
  );
}

function StyleTile({
  label,
  active,
  onClick,
  previewStyle,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  previewStyle: CSSProperties;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={`flex h-[58px] w-[62px] shrink-0 flex-col items-start justify-between overflow-hidden border bg-white px-1.5 py-1 text-left ${
        active
          ? "border-[#2b579a] ring-1 ring-[#2b579a]"
          : "border-[#d4d4d4] hover:border-[#7fb2e0]"
      }`}
    >
      <span className="block max-w-full truncate leading-tight" style={previewStyle}>
        AaBbCcDc
      </span>
      <span className="block w-full truncate text-[10px] text-slate-600">{label}</span>
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex h-6 cursor-pointer items-center gap-1.5 rounded px-1 text-[11px] text-slate-800 hover:bg-[#dcebf7]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

type ImageAttrs = {
  src: string;
  alt?: string | null;
  title?: string | null;
  width: number | null;
  height: number | null;
  layout: string;
  border: string;
  borderColor: string;
  rounded: boolean;
  shadow: boolean;
  fx: string;
};

type PMNode = NodeViewProps["node"];

function cssString(values: Record<string, string>) {
  return Object.entries(values)
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}: ${value}`)
    .join("; ");
}

function layoutCss(layout: string): Record<string, string> {
  switch (layout) {
    case "float-left":
      return { float: "left", margin: "4px 14px 8px 0" };
    case "float-right":
      return { float: "right", margin: "4px 0 8px 14px" };
    case "block-left":
      return { display: "block", margin: "8px auto 8px 0" };
    case "block-center":
      return { display: "block", margin: "8px auto" };
    case "block-right":
      return { display: "block", margin: "8px 0 8px auto" };
    default:
      return { display: "inline-block", verticalAlign: "middle" };
  }
}

function decoCss(attrs: Partial<ImageAttrs>): Record<string, string> {
  const out: Record<string, string> = {};

  if (attrs.border && attrs.border !== "none") {
    out.border = `${attrs.border}px solid ${attrs.borderColor || "#334155"}`;
  }
  if (attrs.rounded) out.borderRadius = "12px";
  if (attrs.shadow) out.boxShadow = "0 4px 14px rgba(0,0,0,0.3)";
  if (attrs.fx && attrs.fx !== "none") out.filter = attrs.fx;

  return out;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const element = document.createElement("img");

    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Could not load the image."));
    element.src = src;
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });

  const element = await loadImageElement(raw);

  if (!element.naturalWidth || !element.naturalHeight) return raw;

  const scale = Math.min(1, 1600 / Math.max(element.naturalWidth, element.naturalHeight));

  if (scale === 1 && raw.length < 600_000) return raw;

  const width = Math.round(element.naturalWidth * scale);
  const height = Math.round(element.naturalHeight * scale);
  const keepAlpha = ["image/png", "image/gif", "image/webp"].includes(file.type);

  const draw = (white: boolean) => {
    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    if (!context) return null;
    if (white) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(element, 0, 0, width, height);

    return canvas;
  };

  if (keepAlpha) {
    const png = draw(false)?.toDataURL("image/png");

    if (png && png.length < 900_000) return png;
  }

  return draw(true)?.toDataURL("image/jpeg", 0.85) ?? raw;
}

async function transformImage(
  src: string,
  operation: "rotate-right" | "rotate-left" | "flip-h" | "flip-v",
): Promise<string> {
  const element = await loadImageElement(src);
  const w = element.naturalWidth;
  const h = element.naturalHeight;
  const canvas = document.createElement("canvas");
  const turn = operation === "rotate-right" || operation === "rotate-left";

  canvas.width = turn ? h : w;
  canvas.height = turn ? w : h;

  const context = canvas.getContext("2d");

  if (!context) return src;

  if (operation === "rotate-right") {
    context.translate(h, 0);
    context.rotate(Math.PI / 2);
  } else if (operation === "rotate-left") {
    context.translate(0, w);
    context.rotate(-Math.PI / 2);
  } else if (operation === "flip-h") {
    context.translate(w, 0);
    context.scale(-1, 1);
  } else {
    context.translate(0, h);
    context.scale(1, -1);
  }

  context.drawImage(element, 0, 0);

  return src.startsWith("data:image/png")
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", 0.9);
}

function ImageView({
  node,
  updateAttributes,
  selected,
  editor,
  deleteNode,
  getPos,
}: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [live, setLive] = useState<{ w: number; h: number | null } | null>(null);
  const attrs = node.attrs as ImageAttrs;
  const width = live ? live.w : attrs.width;
  const height = live ? live.h : attrs.height;

  const wrapStyle = {
    ...layoutCss(attrs.layout),
    position: "relative",
    maxWidth: "100%",
    lineHeight: 0,
  } as CSSProperties;

  const imgStyle = {
    display: "block",
    maxWidth: "100%",
    width: width ?? undefined,
    height: height ?? "auto",
    ...decoCss(attrs),
    outline: selected ? "2px solid #2b579a" : undefined,
    outlineOffset: 1,
  } as CSSProperties;

  function startResize(event: React.PointerEvent, direction: string) {
    event.preventDefault();
    event.stopPropagation();

    const element = imgRef.current;

    if (!element) return;

    const rect = element.getBoundingClientRect();
    const scale = element.offsetWidth ? rect.width / element.offsetWidth : 1;
    const startX = event.clientX;
    const startWidth = element.offsetWidth;
    const ratio = element.offsetHeight / Math.max(1, element.offsetWidth);
    const explicitHeight = attrs.height != null;
    const limit = (editor.view.dom as HTMLElement).clientWidth || 2000;
    const sign = direction.endsWith("e") ? 1 : -1;
    let latest = { w: startWidth, h: explicitHeight ? element.offsetHeight : null as number | null };

    const move = (moveEvent: PointerEvent) => {
      const delta = ((moveEvent.clientX - startX) / (scale || 1)) * sign;
      const next = Math.round(Math.min(limit, Math.max(24, startWidth + delta)));

      latest = { w: next, h: explicitHeight ? Math.round(next * ratio) : null };
      setLive(latest);
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      updateAttributes({ width: latest.w, height: latest.h });
      setLive(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function startMove(event: React.PointerEvent) {
    if (event.button !== 0 || !editor.isEditable) return;

    const startX = event.clientX;
    const startY = event.clientY;
    const startPos = getPos();

    if (typeof startPos !== "number") return;

    editor.chain().setNodeSelection(startPos).run();

    let ghost: HTMLElement | null = null;
    let line: HTMLElement | null = null;
    let label: HTMLElement | null = null;
    let target: number | null = null;
    let mode = attrs.layout;
    let moving = false;

    const place = (clientX: number, clientY: number) => {
      const rect = (editor.view.dom as HTMLElement).getBoundingClientRect();
      const relative = (clientX - rect.left) / Math.max(1, rect.width);

      if (relative < 0.33) mode = "float-left";
      else if (relative > 0.67) mode = "float-right";
      else mode = attrs.layout.startsWith("float") ? "block-center" : attrs.layout;

      const found = editor.view.posAtCoords({ left: clientX, top: clientY });

      target = null;

      if (found) {
        const $pos = editor.state.doc.resolve(found.pos);

        if ($pos.parent.inlineContent) target = found.pos;
      }

      if (ghost) {
        ghost.style.left = `${clientX + 10}px`;
        ghost.style.top = `${clientY + 10}px`;
      }

      if (label) {
        label.textContent =
          mode === "float-left"
            ? "Left: text wraps on the right"
            : mode === "float-right"
              ? "Right: text wraps on the left"
              : mode === "block-center"
                ? "Center: text above and below"
                : "In the text line";
        label.style.left = `${clientX + 10}px`;
        label.style.top = `${clientY + 10 + (ghost?.offsetHeight ?? 0)}px`;
      }

      if (line) {
        if (target !== null) {
          const caret = editor.view.coordsAtPos(target);

          line.style.display = "block";
          line.style.left = `${caret.left}px`;
          line.style.top = `${caret.top}px`;
          line.style.height = `${Math.max(14, caret.bottom - caret.top)}px`;
        } else {
          line.style.display = "none";
        }
      }
    };

    const move = (moveEvent: PointerEvent) => {
      if (!moving) {
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;

        moving = true;

        const element = imgRef.current;

        ghost = document.createElement("img");
        ghost.setAttribute("src", attrs.src);
        ghost.style.cssText =
          "position:fixed;z-index:100;pointer-events:none;opacity:.65;max-width:160px;max-height:120px;border:2px solid #2b579a;background:#fff";
        label = document.createElement("div");
        label.style.cssText =
          "position:fixed;z-index:100;pointer-events:none;background:#2b579a;color:#fff;font:11px sans-serif;padding:2px 6px;border-radius:3px";
        line = document.createElement("div");
        line.style.cssText =
          "position:fixed;z-index:100;pointer-events:none;width:2px;background:#2b579a;display:none";
        document.body.append(ghost, label, line);

        if (element) element.style.opacity = "0.4";
      }

      place(moveEvent.clientX, moveEvent.clientY);
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      ghost?.remove();
      label?.remove();
      line?.remove();

      if (imgRef.current) imgRef.current.style.opacity = "";

      if (!moving || target === null) return;

      const from = getPos();

      if (typeof from !== "number") return;

      const { state } = editor;
      const size = node.nodeSize;
      const dropAt = target;

      if (dropAt >= from && dropAt <= from + size) {
        if (mode !== attrs.layout) updateAttributes({ layout: mode });
        return;
      }

      try {
        const transaction = state.tr.delete(from, from + size);
        const mapped = transaction.mapping.map(dropAt);

        if (!transaction.doc.resolve(mapped).parent.inlineContent) return;

        transaction.insert(
          mapped,
          node.type.create({ ...node.attrs, layout: mode }),
        );
        editor.view.dispatch(transaction.scrollIntoView());
        editor.chain().setNodeSelection(mapped).run();
      } catch {
        // the drop spot is not valid for a picture
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  const handles: [string, CSSProperties][] = [
    ["nw", { left: -6, top: -6, cursor: "nwse-resize" }],
    ["ne", { right: -6, top: -6, cursor: "nesw-resize" }],
    ["sw", { left: -6, bottom: -6, cursor: "nesw-resize" }],
    ["se", { right: -6, bottom: -6, cursor: "nwse-resize" }],
  ];

  const quick: [string, string, string][] = [
    ["inline", "In line", "Keep the picture in the line of text"],
    ["float-left", "Left", "Picture on the left, text wraps on the right"],
    ["float-right", "Right", "Picture on the right, text wraps on the left"],
    ["block-center", "Center", "Picture alone in the middle, text above and below"],
  ];

  return (
    <NodeViewWrapper as="span" style={wrapStyle} className="brx-img-wrap">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={attrs.src}
        alt={attrs.alt ?? ""}
        title={attrs.title ?? undefined}
        draggable={false}
        style={{ ...imgStyle, cursor: editor.isEditable ? "move" : "default" }}
        onMouseDown={(event) => event.preventDefault()}
        onPointerDown={startMove}
      />
      {selected && editor.isEditable && (
        <>
          {handles.map(([direction, style]) => (
            <button
              key={direction}
              type="button"
              aria-label="Resize picture"
              title="Drag to resize"
              className="brx-img-ui"
              style={{
                position: "absolute",
                width: 11,
                height: 11,
                padding: 0,
                background: "#ffffff",
                border: "2px solid #2b579a",
                borderRadius: 2,
                ...style,
              }}
              onPointerDown={(event) => startResize(event, direction)}
            />
          ))}
          <span
            className="brx-img-ui"
            contentEditable={false}
            style={{
              position: "absolute",
              left: 0,
              top: -34,
              display: "flex",
              gap: 2,
              padding: 2,
              background: "#ffffff",
              border: "1px solid #c6c6c6",
              borderRadius: 4,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
              zIndex: 5,
            }}
          >
            {quick.map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                title={hint}
                onClick={() => updateAttributes({ layout: value })}
                style={{
                  padding: "3px 7px",
                  fontSize: 11,
                  color: "#1e293b",
                  borderRadius: 3,
                  background: attrs.layout === value ? "#c7e0f4" : "transparent",
                }}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              title="Crop picture"
              onClick={() => window.dispatchEvent(new Event("brx-crop-image"))}
              style={{ padding: "3px 7px", fontSize: 11, color: "#1e293b" }}
            >
              Crop
            </button>
            <button
              type="button"
              title="Delete picture"
              onClick={() => deleteNode()}
              style={{ padding: "3px 7px", fontSize: 11, color: "#b91c1c" }}
            >
              Delete
            </button>
          </span>
        </>
      )}
    </NodeViewWrapper>
  );
}

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          Number(element.getAttribute("width")) || parseInt(element.style.width, 10) || null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.width ? { width: String(attributes.width) } : {},
      },
      height: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          Number(element.getAttribute("height")) || parseInt(element.style.height, 10) || null,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.height ? { height: String(attributes.height) } : {},
      },
      layout: {
        default: "inline",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-layout") || "inline",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-layout": String(attributes.layout),
          style: cssString({
            ...layoutCss(String(attributes.layout)),
            ...decoCss(attributes as unknown as Partial<ImageAttrs>),
          }),
        }),
      },
      border: {
        default: "none",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-border") || "none",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-border": String(attributes.border),
        }),
      },
      borderColor: {
        default: "#334155",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-bcolor") || "#334155",
        renderHTML: (attributes: Record<string, unknown>) => ({
          "data-bcolor": String(attributes.borderColor),
        }),
      },
      rounded: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-rounded") === "true",
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.rounded ? { "data-rounded": "true" } : {},
      },
      shadow: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-shadow") === "true",
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.shadow ? { "data-shadow": "true" } : {},
      },
      fx: {
        default: "none",
        parseHTML: (element: HTMLElement) => element.getAttribute("data-fx") || "none",
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.fx && attributes.fx !== "none" ? { "data-fx": String(attributes.fx) } : {},
      },
    };
  },
  draggable: false,
  addNodeView() {
    return ReactNodeViewRenderer(ImageView, {
      stopEvent: ({ event }) => {
        const target = event.target as HTMLElement | null;

        return (
          Boolean(target?.closest?.(".brx-img-wrap")) &&
          ["mousedown", "pointerdown", "touchstart", "dragstart"].includes(event.type)
        );
      },
    });
  },
});

function CropDialog({
  src,
  onApply,
  onClose,
}: {
  src: string;
  onApply: (dataUrl: string, widthFraction: number) => void;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const ratioRef = useRef<number | null>(null);
  const [box, setBox] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [ratioName, setRatioName] = useState("free");

  const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  function begin(event: React.PointerEvent, mode: string) {
    event.preventDefault();
    event.stopPropagation();

    const wrap = wrapRef.current;

    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const start = box;

    const move = (moveEvent: PointerEvent) => {
      const dx = (moveEvent.clientX - startX) / rect.width;
      const dy = (moveEvent.clientY - startY) / rect.height;

      if (mode === "move") {
        setBox({
          ...start,
          x: clamp(start.x + dx, 0, 1 - start.w),
          y: clamp(start.y + dy, 0, 1 - start.h),
        });
        return;
      }

      let x1 = start.x;
      let y1 = start.y;
      let x2 = start.x + start.w;
      let y2 = start.y + start.h;

      if (mode.includes("w")) x1 = clamp(start.x + dx, 0, x2 - 0.05);
      if (mode.includes("e")) x2 = clamp(start.x + start.w + dx, x1 + 0.05, 1);
      if (mode.includes("n")) y1 = clamp(start.y + dy, 0, y2 - 0.05);
      if (mode.includes("s")) y2 = clamp(start.y + start.h + dy, y1 + 0.05, 1);

      const ratio = ratioRef.current;

      if (ratio) {
        const heightFraction = ((x2 - x1) * rect.width) / ratio / rect.height;

        if (mode.includes("n")) y1 = y2 - heightFraction;
        else y2 = y1 + heightFraction;

        if (y1 < 0 || y2 > 1) return;
      }

      setBox({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  function chooseRatio(name: string, ratio: number | null) {
    setRatioName(name);
    ratioRef.current = ratio;

    const wrap = wrapRef.current;

    if (!ratio || !wrap) return;

    const area = wrap.clientWidth / wrap.clientHeight;
    const w = Math.min(0.9, (0.9 * ratio) / area);
    const h = (w * area) / ratio;

    setBox({ x: (1 - w) / 2, y: (1 - h) / 2, w, h });
  }

  function apply() {
    const element = imgRef.current;

    if (!element || !element.naturalWidth) return;

    const sw = Math.max(1, Math.round(element.naturalWidth * box.w));
    const sh = Math.max(1, Math.round(element.naturalHeight * box.h));
    const canvas = document.createElement("canvas");

    canvas.width = sw;
    canvas.height = sh;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.drawImage(
      element,
      Math.round(element.naturalWidth * box.x),
      Math.round(element.naturalHeight * box.y),
      sw,
      sh,
      0,
      0,
      sw,
      sh,
    );

    onApply(
      src.startsWith("data:image/png")
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", 0.92),
      box.w,
    );
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const corners: [string, CSSProperties][] = [
    ["nw", { left: -7, top: -7, cursor: "nwse-resize" }],
    ["ne", { right: -7, top: -7, cursor: "nesw-resize" }],
    ["sw", { left: -7, bottom: -7, cursor: "nesw-resize" }],
    ["se", { right: -7, bottom: -7, cursor: "nwse-resize" }],
  ];

  const ratios: [string, string, number | null][] = [
    ["free", "Free", null],
    ["square", "1:1", 1],
    ["43", "4:3", 4 / 3],
    ["34", "3:4", 3 / 4],
    ["169", "16:9", 16 / 9],
    ["916", "9:16", 9 / 16],
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 print:hidden">
      <div className="max-h-full max-w-full overflow-auto rounded bg-white p-4 shadow-2xl">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-[15px] font-semibold text-slate-800">Crop picture</h2>
          {ratios.map(([name, label, ratio]) => (
            <button
              key={name}
              type="button"
              onClick={() => chooseRatio(name, ratio)}
              className={`rounded border px-2 py-1 text-[12px] ${
                ratioName === name
                  ? "border-[#2b579a] bg-[#c7e0f4]"
                  : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div
          ref={wrapRef}
          className="relative mx-auto inline-block select-none overflow-hidden"
          style={{ touchAction: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Picture to crop"
            draggable={false}
            className="block max-h-[60vh] max-w-[80vw]"
          />
          <div
            onPointerDown={(event) => begin(event, "move")}
            style={{
              position: "absolute",
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.w * 100}%`,
              height: `${box.h * 100}%`,
              border: "2px solid #ffffff",
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              cursor: "move",
              touchAction: "none",
            }}
          >
            {corners.map(([direction, style]) => (
              <div
                key={direction}
                onPointerDown={(event) => begin(event, direction)}
                style={{
                  position: "absolute",
                  width: 14,
                  height: 14,
                  background: "#ffffff",
                  border: "2px solid #2b579a",
                  touchAction: "none",
                  ...style,
                }}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Drag the box to move it. Drag a corner to change the size. Ctrl+Z undoes the crop.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setBox({ x: 0, y: 0, w: 1, h: 1 });
              chooseRatio("free", null);
            }}
            className="secondary-action"
          >
            Reset
          </button>
          <button type="button" onClick={onClose} className="secondary-action">
            Cancel
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded bg-[#2b579a] px-4 py-1.5 text-[13px] text-white hover:bg-[#244a82]"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
}

function CropGlyph({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
    </svg>
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
  const [sendOpen, setSendOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fontSize, setFontSize] = useState("12pt");
  const [zoom, setZoom] = useState(100);
  const [pageSize, setPageSize] = useState("A4");
  const [orientation, setOrientation] = useState("portrait");
  const [margin, setMargin] = useState("normal");
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [showNavigation, setShowNavigation] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("");
  const [pageNumbers, setPageNumbers] = useState(false);
  const [pageColor, setPageColor] = useState("#ffffff");
  const [watermark, setWatermark] = useState("none");
  const [columns, setColumns] = useState("1");
  const [focusMode, setFocusMode] = useState(false);
  const [spellcheck, setSpellcheck] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [wordStats, setWordStats] = useState({ words: 0, characters: 0 });
  const [, setTick] = useState(0);
  const [readOnly, setReadOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("print");
  const [painterOn, setPainterOn] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [markerColor, setMarkerColor] = useState("#fff176");
  const [fileOpen, setFileOpen] = useState(false);
  const [fileView, setFileView] = useState<FileView>("new");
  const [ribbonOpen, setRibbonOpen] = useState(true);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showPane, setShowPane] = useState(false);
  const [showMarks, setShowMarks] = useState(false);
  const [themeName, setThemeName] = useState("Office");
  const [headingColor, setHeadingColor] = useState<string | null>(null);
  const [pageBorder, setPageBorder] = useState("none");
  const [tellQuery, setTellQuery] = useState("");
  const [pages, setPages] = useState(1);
  const [cropOpen, setCropOpen] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const painterRef = useRef<PainterSource | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLElement>(null);

  const documentIdRef = useRef<string | null>(null);
  const titleRef = useRef(title);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
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
      ResizableImage.configure({ allowBase64: true, inline: true }),
      Table.configure({
        resizable: true,
        HTMLAttributes: { class: "brx-table" },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Subscript,
      Superscript,
      PageBreak,
      Indent,
      TextStyleAttrs,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: "<h1>Welcome to BRX Notes</h1><p>Start writing here.</p>",
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

  const saveToCloud = useCallback(async (silent = false) => {
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

      if (!silent) notify("Saved to BRX Cloud.");
    } catch (error) {
      console.error("BRX cloud save error:", error);
      notify(
        silent
          ? "Auto-save failed. Use Cloud Save to try again."
          : "Cloud save failed. Check login, API and database.",
      );
    } finally {
      setSaving(false);
    }
  }, [editor, notify, saving]);

  // Auto-save a cloud document 3 seconds after you stop typing, and Ctrl+S.
  const saveRef = useRef(saveToCloud);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveRef.current = saveToCloud;
  }, [saveToCloud]);

  useEffect(() => {
    if (!editor) return;

    const onUpdate = () => {
      if (!autoSave || !documentIdRef.current) return;

      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => void saveRef.current(true), 3000);
    };

    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveRef.current();
      }
    };

    editor.on("update", onUpdate);
    window.addEventListener("keydown", onKey);

    return () => {
      editor.off("update", onUpdate);
      window.removeEventListener("keydown", onKey);
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [editor, autoSave]);

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

    event.target.value = "";

    if (!file || !editor) return;

    if (!file.type.startsWith("image/")) {
      notify("Please choose an image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify("Image must be smaller than 10 MB.");
      return;
    }

    fileToDataUrl(file)
      .then((src) => {
        if (editor.getHTML().length + src.length > 1_900_000) {
          notify("This document is too large to add another picture. Use a smaller picture.");
          return;
        }

        editor.chain().focus().setImage({ src, alt: file.name }).run();
        notify("Picture added. Drag the corners to resize, drag it to move, or use the Picture Format tab.");
      })
      .catch(() => notify("Could not load this image."));
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

  function downloadWord() {
    if (!editor) return;

    const safeTitle = title.trim() || "Document";
    const html =
      `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(safeTitle)}</title>` +
      "<style>body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.5}" +
      "table{border-collapse:collapse;width:100%}td,th{border:1px solid #777;padding:6px}" +
      "div[data-type='page-break']{page-break-after:always}" +
      `</style></head><body>${
        headerText.trim()
          ? `<p style="text-align:center;color:#555;font-size:10pt">${escapeHtml(headerText)}</p>`
          : ""
      }${editor.getHTML()}${
        footerText.trim()
          ? `<p style="text-align:center;color:#555;font-size:10pt">${escapeHtml(footerText)}</p>`
          : ""
      }</body></html>`;

    const url = URL.createObjectURL(
      new Blob(["\ufeff", html], { type: "application/msword" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFilename(safeTitle)}.doc`;
    anchor.click();
    URL.revokeObjectURL(url);

    notify("Word file downloaded.");
  }

  function applyTemplate(name: string) {
    const template = DOC_TEMPLATES.find((item) => item.name === name);

    if (!template || !editor) return;

    if (
      editor.getText().trim() &&
      !window.confirm("Replace the current document with this template? Save your work first.")
    ) {
      return;
    }

    documentIdRef.current = null;
    setDocumentId(null);
    titleRef.current = template.title;
    setTitle(template.title);
    editor.commands.setContent(template.html);
    notify(`${template.name} template opened.`);
  }

  function pasteFromClipboard() {
    navigator.clipboard
      .readText()
      .then((text) => {
        editor
          ?.chain()
          .focus()
          .insertContent(escapeHtml(text).replace(/\r?\n/g, "<br>"))
          .run();
      })
      .catch(() => notify("Paste blocked by the browser. Use Ctrl+V."));
  }

  function insertPageBreak() {
    editor?.chain().focus().insertContent({ type: "pageBreak" }).run();
  }

  function insertTime() {
    editor?.chain().focus().insertContent(new Date().toLocaleTimeString()).run();
  }

  function insertSymbol(symbol: string) {
    if (symbol) editor?.chain().focus().insertContent(symbol).run();
  }

  function insertToc() {
    if (!editor) return;

    const items: { level: number; text: string }[] = [];

    editor.state.doc.descendants((node) => {
      if (node.type.name === "heading" && node.textContent.trim()) {
        items.push({
          level: Number(node.attrs.level) || 1,
          text: node.textContent.trim(),
        });
      }
    });

    if (items.length === 0) {
      notify("Add headings (H1, H2, H3) first, then insert the table of contents.");
      return;
    }

    const lines = items
      .map(
        (item) =>
          `<p>${"&nbsp;".repeat((item.level - 1) * 6)}${escapeHtml(item.text)}</p>`,
      )
      .join("");

    editor
      .chain()
      .focus()
      .insertContent(`<h2>Table of contents</h2>${lines}`)
      .run();
  }

  function changeCase(mode: string) {
    if (!editor || !mode) return;

    const { from, to, empty } = editor.state.selection;

    if (empty) {
      notify("Select some text first.");
      return;
    }

    const text = editor.state.doc.textBetween(from, to, "\n");
    let result = text;

    if (mode === "upper") result = text.toUpperCase();
    else if (mode === "lower") result = text.toLowerCase();
    else if (mode === "title")
      result = text
        .toLowerCase()
        .replace(/(^|\s)(\S)/g, (_m, a: string, b: string) => a + b.toUpperCase());
    else if (mode === "sentence")
      result = text
        .toLowerCase()
        .replace(/(^\s*|[.!?]\s+)(\S)/g, (_m, a: string, b: string) => a + b.toUpperCase());

    editor.chain().focus().insertContentAt({ from, to }, result).run();
  }

  function showStats() {
    if (!editor) return;

    const text = editor.getText();
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const noSpaces = text.replace(/\s/g, "").length;
    const minutes = Math.max(1, Math.round(words / 200));

    notify(
      `${words} words · ${text.length} characters (${noSpaces} without spaces) · ${editor.state.doc.childCount} blocks · about ${minutes} min read`,
    );
  }

  function toggleSpellcheck() {
    const next = !spellcheck;

    setSpellcheck(next);
    editor?.view.dom.setAttribute("spellcheck", String(next));
    notify(next ? "Spell check is on." : "Spell check is off.");
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

  // ---- Word-style ribbon helpers ----
  useEffect(() => {
    if (!editor) return;

    const bump = () => setTick((value) => value + 1);

    editor.on("transaction", bump);

    return () => {
      editor.off("transaction", bump);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!(readOnly || viewMode === "read"));
  }, [editor, readOnly, viewMode]);

  useEffect(() => {
    if (!editor) return;

    const onUp = () => {
      const source = painterRef.current;

      if (!source) return;

      window.setTimeout(() => {
        const { from, to, empty } = editor.state.selection;

        if (empty || (from === source.from && to === source.to)) return;

        const chain = editor.chain().focus().unsetAllMarks();

        if (source.bold) chain.setBold();
        if (source.italic) chain.setItalic();
        if (source.underline) chain.setUnderline();
        if (source.strike) chain.setStrike();
        if (source.highlight) chain.setHighlight({ color: source.highlight });
        if (Object.keys(source.textStyle).length > 0) {
          chain.setMark("textStyle", source.textStyle);
        }

        chain.run();
        painterRef.current = null;
        setPainterOn(false);
        notify("Formatting applied.");
      }, 0);
    };

    document.addEventListener("mouseup", onUp);

    return () => document.removeEventListener("mouseup", onUp);
  }, [editor, notify]);

  function startPainter() {
    if (!editor) return;

    if (painterRef.current) {
      painterRef.current = null;
      setPainterOn(false);
      return;
    }

    const style = editor.getAttributes("textStyle") as Record<string, string | null>;
    const textStyle: Record<string, string> = {};

    for (const key of ["color", "fontSize", "fontFamily"]) {
      if (style[key]) textStyle[key] = style[key] as string;
    }

    const highlight = editor.getAttributes("highlight") as { color?: string };

    painterRef.current = {
      from: editor.state.selection.from,
      to: editor.state.selection.to,
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      underline: editor.isActive("underline"),
      strike: editor.isActive("strike"),
      highlight: editor.isActive("highlight") ? (highlight.color ?? null) : null,
      textStyle,
    };
    setPainterOn(true);
    notify("Format Painter: now select the text to format.");
  }

  function copySelection() {
    const selected = window.getSelection()?.toString();

    if (selected) {
      void navigator.clipboard.writeText(selected);
      notify("Selection copied.");
    }
  }

  const SIZE_LIST = [
    "8pt", "9pt", "10pt", "11pt", "12pt", "14pt", "16pt", "18pt",
    "20pt", "22pt", "24pt", "26pt", "28pt", "36pt", "48pt", "72pt",
  ];

  const currentTextStyle = (editor?.getAttributes("textStyle") ?? {}) as {
    fontFamily?: string | null;
    fontSize?: string | null;
    color?: string | null;
  };
  const shownFont = currentTextStyle.fontFamily || fontFamily;
  const shownSize = currentTextStyle.fontSize || fontSize;

  function applyToolFont(value: string) {
    editor?.chain().focus().setMark("textStyle", { fontFamily: value }).run();
  }

  function applyToolSize(value: string) {
    editor?.chain().focus().setMark("textStyle", { fontSize: value }).run();
  }

  function stepSize(direction: 1 | -1) {
    const index = SIZE_LIST.indexOf(shownSize);
    const base = index >= 0 ? index : SIZE_LIST.indexOf("12pt");
    const next = SIZE_LIST[Math.min(SIZE_LIST.length - 1, Math.max(0, base + direction))];

    applyToolSize(next);
  }

  function applyTextColor(color: string | null) {
    if (!editor) return;

    if (color) {
      editor.chain().focus().setColor(color).run();
      setTextColor(color);
    } else {
      editor.chain().focus().unsetColor().run();
      setTextColor("#000000");
    }
  }

  function applyHighlightColor(color: string | null) {
    if (!editor) return;

    if (color) {
      editor.chain().focus().setHighlight({ color }).run();
      setMarkerColor(color);
    } else {
      editor.chain().focus().unsetHighlight().run();
    }
  }

  function changeIndent(delta: 1 | -1) {
    if (!editor) return;

    if (editor.isActive("listItem")) {
      if (delta > 0) editor.chain().focus().sinkListItem("listItem").run();
      else editor.chain().focus().liftListItem("listItem").run();
      return;
    }

    const type = editor.isActive("heading") ? "heading" : "paragraph";
    const current = Number(editor.getAttributes(type).indent) || 0;
    const next = Math.min(8, Math.max(0, current + delta));

    editor.chain().focus().updateAttributes(type, { indent: next }).run();
  }

  function applyNamedStyle(name: string) {
    if (!editor) return;

    const chain = editor.chain().focus();

    if (name === "normal") {
      chain.setParagraph().setTextAlign("left").run();
    } else if (name === "title") {
      chain.setHeading({ level: 1 }).setTextAlign("center").run();
    } else if (name === "h1") {
      chain.setHeading({ level: 1 }).setTextAlign("left").run();
    } else if (name === "h2") {
      chain.setHeading({ level: 2 }).setTextAlign("left").run();
    } else if (name === "h3") {
      chain.setHeading({ level: 3 }).setTextAlign("left").run();
    } else if (name === "quote") {
      chain.toggleBlockquote().run();
    } else if (name === "strong") {
      chain.toggleBold().run();
    } else if (name === "emphasis") {
      chain.toggleItalic().run();
    }
  }

  function insertFootnote() {
    if (!editor) return;

    const text = window.prompt("Footnote text:");

    if (!text || !text.trim()) return;

    const count = (editor.getHTML().match(/<sup>\[\d+\]<\/sup>/g) ?? []).length + 1;

    editor
      .chain()
      .focus()
      .insertContent(`<sup>[${count}]</sup>`)
      .insertContentAt(
        editor.state.doc.content.size,
        `<p><sup>[${count}]</sup> ${escapeHtml(text.trim())}</p>`,
      )
      .run();
    notify(`Footnote ${count} added at the end of the document.`);
  }

  function insertCaption(kind: "Figure" | "Table") {
    if (!editor) return;

    const pattern = new RegExp(`${kind} (\\d+):`, "g");
    const count = (editor.getText().match(pattern) ?? []).length + 1;

    editor
      .chain()
      .focus()
      .insertContent(
        `<p style="text-align: center"><em>${kind} ${count}: [caption]</em></p>`,
      )
      .run();
  }

  function fitPageWidth() {
    const area = canvasRef.current;

    if (!area) return;

    const pw = orientation === "portrait" ? pageWidth : pageHeight;
    const next = Math.round(((area.clientWidth - 40) / pw) * 100);

    setZoom(Math.min(200, Math.max(40, next)));
  }

  function fitWholePage() {
    const ph = orientation === "portrait" ? pageHeight : pageWidth;
    const next = Math.round(((window.innerHeight - 260) / ph) * 100);

    setZoom(Math.min(200, Math.max(40, next)));
  }

  const headings: { level: number; text: string; pos: number }[] = [];

  if (showPane && editor) {
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading" && node.textContent.trim()) {
        headings.push({
          level: Number(node.attrs.level) || 1,
          text: node.textContent.trim(),
          pos,
        });
      }
    });
  }

  function goToHeading(pos: number) {
    editor?.chain().focus().setTextSelection(pos + 1).scrollIntoView().run();
  }

  // ---- Picture tools ----
  function getSelectedImage(): { attrs: ImageAttrs; pos: number; node: PMNode } | null {
    if (!editor) return null;

    const selection = editor.state.selection as unknown as {
      node?: PMNode;
      from: number;
    };

    if (selection.node && selection.node.type.name === "image") {
      return {
        attrs: selection.node.attrs as ImageAttrs,
        pos: selection.from,
        node: selection.node,
      };
    }

    return null;
  }

  const imageInfo = getSelectedImage();
  const inImage = Boolean(imageInfo);

  function measureImage(): { w: number; h: number } {
    const info = getSelectedImage();

    if (!editor || !info) return { w: 0, h: 0 };

    try {
      const dom = editor.view.nodeDOM(info.pos) as HTMLElement | null;
      const element = dom?.querySelector("img");

      if (element) {
        return { w: element.offsetWidth, h: element.offsetHeight };
      }
    } catch {
      // the picture is not on screen yet
    }

    return { w: info.attrs.width ?? 0, h: info.attrs.height ?? 0 };
  }

  function setImageAttrs(values: Partial<ImageAttrs>) {
    editor?.chain().focus().updateAttributes("image", values).run();
  }

  function commitImageSize(kind: "w" | "h", value: number) {
    const info = getSelectedImage();

    if (!info || !Number.isFinite(value) || value < 8) return;

    const size = measureImage();
    const ratio = size.w ? size.h / size.w : 1;
    const next = Math.round(value);

    if (lockAspect) {
      if (kind === "w") {
        setImageAttrs({
          width: next,
          height: info.attrs.height != null ? Math.round(next * ratio) : null,
        });
      } else {
        setImageAttrs({
          width: Math.round(next / (ratio || 1)),
          height: info.attrs.height != null ? next : null,
        });
      }
    } else if (kind === "w") {
      setImageAttrs({ width: next, height: info.attrs.height ?? size.h });
    } else {
      setImageAttrs({ width: info.attrs.width ?? size.w, height: next });
    }
  }

  function setImagePercent(percent: number) {
    const full = (editor?.view.dom as HTMLElement | undefined)?.clientWidth ?? 600;

    setImageAttrs({ width: Math.round((full * percent) / 100), height: null });
  }

  async function transformSelectedImage(
    operation: "rotate-right" | "rotate-left" | "flip-h" | "flip-v",
  ) {
    const info = getSelectedImage();

    if (!info) return;

    try {
      const src = await transformImage(info.attrs.src, operation);
      const size = measureImage();
      const turned = operation === "rotate-right" || operation === "rotate-left";

      setImageAttrs(
        turned && size.h
          ? { src, width: size.h, height: null }
          : { src },
      );
    } catch {
      notify("Could not change this picture.");
    }
  }

  function applyCrop(dataUrl: string, widthFraction: number) {
    const info = getSelectedImage();

    if (!info) return;

    const size = measureImage();
    const base = info.attrs.width ?? size.w;

    setImageAttrs({
      src: dataUrl,
      width: base ? Math.max(24, Math.round(base * widthFraction)) : null,
      height: null,
    });
    setCropOpen(false);
    notify("Picture cropped.");
  }

  function replaceImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file || !file.type.startsWith("image/")) return;

    fileToDataUrl(file)
      .then((src) => setImageAttrs({ src, alt: file.name }))
      .catch(() => notify("Could not load this image."));
  }

  function editAltText() {
    const info = getSelectedImage();

    if (!info) return;

    const text = window.prompt("Alt text (describes the picture):", info.attrs.alt ?? "");

    if (text !== null) setImageAttrs({ alt: text });
  }

  function moveImage(direction: "up" | "down") {
    if (!editor) return;

    const info = getSelectedImage();

    if (!info) return;

    const { state } = editor;
    const from = info.pos;
    const $from = state.doc.resolve(from);
    const blockStart = $from.before();
    const blockEnd = $from.after();
    let target: number;

    if (direction === "up") {
      const previous = state.doc.resolve(blockStart).nodeBefore;

      if (!previous || !previous.isTextblock) {
        notify("The picture is already at the top here.");
        return;
      }

      target = blockStart - 1;
    } else {
      const next = state.doc.nodeAt(blockEnd);

      if (!next || !next.isTextblock) {
        notify("The picture is already at the bottom here.");
        return;
      }

      target = blockEnd + next.nodeSize - 1;
    }

    const transaction = state.tr.delete(from, from + info.node.nodeSize);
    const mapped = transaction.mapping.map(target);

    transaction.insert(mapped, info.node);
    editor.view.dispatch(transaction.scrollIntoView());
    editor.chain().setNodeSelection(mapped).run();
  }

  useEffect(() => {
    const open = () => setCropOpen(true);

    window.addEventListener("brx-crop-image", open);

    return () => window.removeEventListener("brx-crop-image", open);
  }, []);

  const wasInImage = useRef(false);

  useEffect(() => {
    if (inImage && !wasInImage.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("Picture");
      setRibbonOpen(true);
    }

    wasInImage.current = inImage;
  }, [inImage]);

  const inTable = Boolean(editor?.isActive("table"));
  const currentTab: TabName =
    (activeTab === "Table" && !inTable) || (activeTab === "Picture" && !inImage)
      ? "Home"
      : activeTab;

  const tabs: TabName[] = [
    "Home",
    "Insert",
    "Design",
    "Layout",
    "References",
    "Review",
    "View",
  ];

  if (inTable) tabs.push("Table");
  if (inImage) tabs.push("Picture");

  function openFile(view: FileView) {
    setFileView(view);
  }

  function closeBackstage() {
    setFileOpen(false);
  }

  const pageWidth = pageSize === "A4" ? 794 : 816;
  const pageHeight = pageSize === "A4" ? 1123 : 1056;
  const pw = orientation === "portrait" ? pageWidth : pageHeight;
  const ph = orientation === "portrait" ? pageHeight : pageWidth;
  const z = zoom / 100;

  const marginValue =
    margin === "narrow"
      ? "24px"
      : margin === "wide"
        ? "80px"
        : "48px";

  const activeEditor = Boolean(editor);

  useEffect(() => {
    const height = pageRef.current?.offsetHeight ?? 0;
    const count = Math.max(1, Math.ceil(height / ph));

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPages((value) => (value === count ? value : count));
  });

  const activeTheme = THEMES.find((item) => item.name === themeName) ?? THEMES[0];

  const commands: { label: string; run: () => void }[] = [
    { label: "Bold", run: () => editor?.chain().focus().toggleBold().run() },
    { label: "Italic", run: () => editor?.chain().focus().toggleItalic().run() },
    { label: "Underline", run: () => editor?.chain().focus().toggleUnderline().run() },
    { label: "Bullets", run: () => editor?.chain().focus().toggleBulletList().run() },
    { label: "Numbering", run: () => editor?.chain().focus().toggleOrderedList().run() },
    { label: "Insert table", run: () => insertTable() },
    { label: "Insert picture", run: () => imageInputRef.current?.click() },
    { label: "Insert link", run: addLink },
    { label: "Page break", run: insertPageBreak },
    { label: "Table of contents", run: insertToc },
    { label: "Footnote", run: insertFootnote },
    { label: "Find", run: () => setShowNavigation(true) },
    { label: "Replace", run: () => setShowNavigation(true) },
    { label: "Word count", run: showStats },
    { label: "Spelling", run: toggleSpellcheck },
    { label: "Print", run: () => window.print() },
    { label: "Save", run: () => void saveToCloud(false) },
    { label: "Save as Word (.doc)", run: downloadWord },
    { label: "Zoom 100%", run: () => setZoom(100) },
    { label: "Focus mode", run: () => setFocusMode(true) },
    { label: "Read mode", run: () => setViewMode("read") },
    { label: "Navigation pane", run: () => setShowPane(true) },
    { label: "Landscape", run: () => setOrientation("landscape") },
    { label: "Portrait", run: () => setOrientation("portrait") },
    { label: "Watermark DRAFT", run: () => setWatermark("DRAFT") },
    { label: "Page numbers", run: () => setPageNumbers(true) },
  ];
  const tellMatches = tellQuery.trim()
    ? commands.filter((item) =>
        item.label.toLowerCase().includes(tellQuery.trim().toLowerCase()),
      )
    : [];

  const cssText = (value: string) =>
    `"${value.replace(/[\\"\r\n]/g, " ").slice(0, 120)}"`;
  const hasHeaderFooter = Boolean(headerText.trim() || footerText.trim() || pageNumbers);
  const pageCss =
    `@page { size: ${pageSize === "A4" ? "A4" : "letter"} ${orientation};` +
    (hasHeaderFooter
      ? ` margin: 20mm 18mm;` +
        (headerText.trim()
          ? ` @top-center { content: ${cssText(headerText)}; font-size: 10pt; color: #555; }`
          : "") +
        (footerText.trim()
          ? ` @bottom-left { content: ${cssText(footerText)}; font-size: 10pt; color: #555; }`
          : "") +
        (pageNumbers
          ? ` @bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 10pt; color: #555; }`
          : "")
      : "") +
    " }";

  const headingColorValue = headingColor ?? activeTheme.color;
  const pageVars = {
    "--brx-h-color": headingColorValue ?? "inherit",
    "--brx-h-font": activeTheme.heading,
  } as CSSProperties;

  const guideLayers: string[] = [];

  if (showGrid) {
    guideLayers.push(
      "repeating-linear-gradient(to bottom, transparent 0, transparent 23px, #e2e8f0 23px, #e2e8f0 24px)",
    );
  }

  if (viewMode === "print") {
    guideLayers.push(
      `repeating-linear-gradient(to bottom, transparent 0, transparent ${ph - 2}px, #cbd5e1 ${ph - 2}px, #cbd5e1 ${ph}px)`,
    );
  }

  const hideChrome = focusMode || viewMode === "read";

  return (
    <main className="min-h-screen bg-[#e6e6e6] text-slate-800">
      <style>{pageCss}</style>

      <header className="sticky top-0 z-40 shadow">
        {/* Title bar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#2b579a] px-2 py-1 text-white">
          <a href="/dashboard" className="top-action" title="Back to dashboard">
            <ArrowLeft size={14} /> Dashboard
          </a>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              title="Save in this browser (Ctrl+S saves to cloud)"
              aria-label="Save in this browser"
              onClick={saveLocally}
              className="rounded p-1.5 hover:bg-white/20"
            >
              <Save size={16} />
            </button>
            <button
              type="button"
              title="Undo"
              aria-label="Undo"
              onClick={() => editor?.chain().focus().undo().run()}
              className="rounded p-1.5 hover:bg-white/20"
            >
              <Undo2 size={16} />
            </button>
            <button
              type="button"
              title="Redo"
              aria-label="Redo"
              onClick={() => editor?.chain().focus().redo().run()}
              className="rounded p-1.5 hover:bg-white/20"
            >
              <Redo2 size={16} />
            </button>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <input
              value={title}
              onChange={(event) => {
                titleRef.current = event.target.value;
                setTitle(event.target.value);
              }}
              aria-label="Document title"
              className="h-7 w-full max-w-xs rounded border border-transparent bg-transparent px-2 text-center text-[13px] text-white outline-none hover:border-white/40 focus:bg-white focus:text-slate-800"
            />
            <span className="hidden whitespace-nowrap text-[13px] text-blue-100 sm:inline">
              - BRX Notes
              {saving ? " (saving...)" : ""}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              className="top-action"
              onClick={() => void saveToCloud(false)}
              disabled={saving}
              type="button"
            >
              <CloudUpload size={14} />
              {saving ? "Saving..." : "Cloud Save"}
            </button>
            <button
              className="top-action"
              onClick={async () => {
                await saveToCloud(true);

                if (documentIdRef.current) setSendOpen(true);
                else notify("Save the note to cloud first (check your login).");
              }}
              disabled={saving}
              type="button"
              title="Send this note to students, parents or staff"
            >
              Send
            </button>
            <label className="flex items-center gap-1 text-[11px] text-blue-50">
              <input
                id="notes-autosave"
                type="checkbox"
                checked={autoSave}
                onChange={(event) => setAutoSave(event.target.checked)}
              />
              Auto-save
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex items-end bg-[#2b579a] px-1 ${hideChrome ? "hidden" : ""}`}>
          <button
            type="button"
            onClick={() => {
              setFileView("new");
              setFileOpen(true);
            }}
            className="mr-1 bg-[#1e3f73] px-5 py-1.5 text-[13px] font-medium text-white hover:bg-[#183462]"
          >
            File
          </button>
          <div className="flex min-w-0 flex-1 items-end overflow-x-auto">
            {tabs.map((tab) => {
              const selected = currentTab === tab && ribbonOpen;

              return (
                <button
                  type="button"
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setRibbonOpen(true);
                  }}
                  className={`whitespace-nowrap px-4 py-1.5 text-[13px] transition ${
                    selected
                      ? "border-x border-t border-[#d4d4d4] bg-[#f3f3f3] font-medium text-[#2b579a]"
                      : tab === "Table" || tab === "Picture"
                        ? "text-amber-200 hover:bg-white/15"
                        : "text-white hover:bg-white/15"
                  }`}
                >
                  {tab === "Table" ? "Table Layout" : tab === "Picture" ? "Picture Format" : tab}
                </button>
              );
            })}
          </div>

          <div className="relative mb-1 mr-1 hidden md:block">
            <input
              value={tellQuery}
              onChange={(event) => setTellQuery(event.target.value)}
              placeholder="Tell me what you want to do..."
              aria-label="Tell me what you want to do"
              className="h-6 w-56 rounded-sm bg-white/15 px-2 text-[12px] text-white placeholder-blue-100 outline-none focus:bg-white focus:text-slate-800 focus:placeholder-slate-400"
            />
            {tellMatches.length > 0 && (
              <div className="absolute right-0 top-7 z-50 w-56 rounded-sm border border-[#c6c6c6] bg-white py-1 text-[12px] text-slate-800 shadow-xl">
                {tellMatches.slice(0, 8).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.run();
                      setTellQuery("");
                    }}
                    className="block w-full px-3 py-1.5 text-left hover:bg-[#dcebf7]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ribbon */}
        {ribbonOpen && !hideChrome && (
          <section className="relative border-y border-[#d4d4d4] bg-[#f3f3f3]">
            <div className="flex h-[96px] items-stretch overflow-x-auto px-1 text-slate-800">
              {currentTab === "Home" && (
                <>
                  <RibbonGroup label="Clipboard">
                    <BigButton
                      label="Paste"
                      icon={<ClipboardPaste size={28} />}
                      onClick={pasteFromClipboard}
                    />
                    <Stack>
                      <SmallButton
                        label="Cut"
                        icon={<Scissors size={14} />}
                        onClick={() => {
                          document.execCommand("cut");
                        }}
                      />
                      <SmallButton
                        label="Copy"
                        icon={<Copy size={14} />}
                        onClick={copySelection}
                      />
                      <SmallButton
                        label="Format Painter"
                        icon={<PaintRoller size={14} />}
                        active={painterOn}
                        onClick={startPainter}
                      />
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Font">
                    <div className="flex flex-col justify-center gap-1">
                      <Row>
                        <SmallSelect
                          label="Font"
                          value={shownFont}
                          onChange={applyToolFont}
                          width={132}
                          options={FONT_LIST.map((name) => ({ label: name, value: name }))}
                        />
                        <SmallSelect
                          label="Font size"
                          value={shownSize}
                          onChange={applyToolSize}
                          width={60}
                          options={SIZE_LIST.map((size) => ({
                            label: size.replace("pt", ""),
                            value: size,
                          }))}
                        />
                        <SmallButton
                          title="Increase font size"
                          icon={<span className="text-[13px] font-semibold">A⁺</span>}
                          onClick={() => stepSize(1)}
                        />
                        <SmallButton
                          title="Decrease font size"
                          icon={<span className="text-[11px] font-semibold">A⁻</span>}
                          onClick={() => stepSize(-1)}
                        />
                        <DropMenu
                          title="Change case"
                          icon={<span className="text-[13px] font-semibold">Aa</span>}
                          minWidth={160}
                        >
                          {(close) => (
                            <>
                              <MenuItem label="UPPERCASE" onClick={() => changeCase("upper")} close={close} />
                              <MenuItem label="lowercase" onClick={() => changeCase("lower")} close={close} />
                              <MenuItem label="Capitalize Each Word" onClick={() => changeCase("title")} close={close} />
                              <MenuItem label="Sentence case" onClick={() => changeCase("sentence")} close={close} />
                            </>
                          )}
                        </DropMenu>
                        <SmallButton
                          title="Clear all formatting"
                          icon={<Eraser size={14} />}
                          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
                        />
                      </Row>
                      <Row>
                        <SmallButton
                          title="Bold (Ctrl+B)"
                          icon={<Bold size={14} />}
                          active={editor?.isActive("bold")}
                          onClick={() => editor?.chain().focus().toggleBold().run()}
                        />
                        <SmallButton
                          title="Italic (Ctrl+I)"
                          icon={<Italic size={14} />}
                          active={editor?.isActive("italic")}
                          onClick={() => editor?.chain().focus().toggleItalic().run()}
                        />
                        <SmallButton
                          title="Underline (Ctrl+U)"
                          icon={<UnderlineIcon size={14} />}
                          active={editor?.isActive("underline")}
                          onClick={() => editor?.chain().focus().toggleUnderline().run()}
                        />
                        <SmallButton
                          title="Strikethrough"
                          icon={<Strikethrough size={14} />}
                          active={editor?.isActive("strike")}
                          onClick={() => editor?.chain().focus().toggleStrike().run()}
                        />
                        <SmallButton
                          title="Subscript"
                          icon={<span className="text-[12px] font-semibold">x₂</span>}
                          active={editor?.isActive("subscript")}
                          onClick={() => editor?.chain().focus().toggleMark("subscript").run()}
                        />
                        <SmallButton
                          title="Superscript"
                          icon={<span className="text-[12px] font-semibold">x²</span>}
                          active={editor?.isActive("superscript")}
                          onClick={() => editor?.chain().focus().toggleMark("superscript").run()}
                        />
                        <Divider />
                        <DropMenu
                          title="Text highlight colour"
                          minWidth={170}
                          icon={
                            <span className="flex flex-col items-center">
                              <Highlighter size={14} />
                              <span className="-mt-0.5 h-[3px] w-4" style={{ background: markerColor }} />
                            </span>
                          }
                        >
                          {(close) => (
                            <>
                              <SwatchGrid
                                colors={HIGHLIGHTS}
                                onPick={(color) => applyHighlightColor(color)}
                                close={close}
                              />
                              <MenuItem label="No colour" onClick={() => applyHighlightColor(null)} close={close} />
                            </>
                          )}
                        </DropMenu>
                        <DropMenu
                          title="Font colour"
                          minWidth={170}
                          icon={
                            <span className="flex flex-col items-center">
                              <span className="text-[13px] font-bold leading-none">A</span>
                              <span className="mt-0.5 h-[3px] w-4" style={{ background: textColor }} />
                            </span>
                          }
                        >
                          {(close) => (
                            <>
                              <SwatchGrid
                                colors={TEXT_COLORS}
                                onPick={(color) => applyTextColor(color)}
                                close={close}
                              />
                              <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-[#dcebf7]">
                                <input
                                  type="color"
                                  value={textColor}
                                  onChange={(event) => applyTextColor(event.target.value)}
                                  className="h-5 w-6 cursor-pointer"
                                />
                                More colours...
                              </label>
                              <MenuItem label="Automatic" onClick={() => applyTextColor(null)} close={close} />
                            </>
                          )}
                        </DropMenu>
                      </Row>
                    </div>
                  </RibbonGroup>

                  <RibbonGroup label="Paragraph">
                    <div className="flex flex-col justify-center gap-1">
                      <Row>
                        <SmallButton
                          title="Bullets"
                          icon={<List size={15} />}
                          active={editor?.isActive("bulletList")}
                          onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        />
                        <SmallButton
                          title="Numbering"
                          icon={<ListOrdered size={15} />}
                          active={editor?.isActive("orderedList")}
                          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        />
                        <Divider />
                        <SmallButton
                          title="Decrease indent"
                          icon={<IndentDecrease size={15} />}
                          onClick={() => changeIndent(-1)}
                        />
                        <SmallButton
                          title="Increase indent"
                          icon={<IndentIncrease size={15} />}
                          onClick={() => changeIndent(1)}
                        />
                        <Divider />
                        <SmallButton
                          title="Show or hide paragraph marks"
                          icon={<Pilcrow size={15} />}
                          active={showMarks}
                          onClick={() => setShowMarks((value) => !value)}
                        />
                      </Row>
                      <Row>
                        <SmallButton
                          title="Align left"
                          icon={<AlignLeft size={15} />}
                          active={editor?.isActive({ textAlign: "left" })}
                          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
                        />
                        <SmallButton
                          title="Center"
                          icon={<AlignCenter size={15} />}
                          active={editor?.isActive({ textAlign: "center" })}
                          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
                        />
                        <SmallButton
                          title="Align right"
                          icon={<AlignRight size={15} />}
                          active={editor?.isActive({ textAlign: "right" })}
                          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
                        />
                        <SmallButton
                          title="Justify"
                          icon={<AlignJustify size={15} />}
                          active={editor?.isActive({ textAlign: "justify" })}
                          onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
                        />
                        <Divider />
                        <DropMenu
                          title="Line and paragraph spacing"
                          minWidth={150}
                          icon={<span className="text-[13px] font-semibold">↕</span>}
                        >
                          {(close) => (
                            <>
                              {["1", "1.15", "1.5", "2"].map((value) => (
                                <MenuItem
                                  key={value}
                                  label={value === "1" ? "1.0" : value === "2" ? "2.0" : value}
                                  active={lineSpacing === value}
                                  onClick={() => applyLineSpacing(value)}
                                  close={close}
                                />
                              ))}
                            </>
                          )}
                        </DropMenu>
                      </Row>
                    </div>
                  </RibbonGroup>

                  <RibbonGroup label="Styles">
                    <div className="flex items-center gap-1">
                      <StyleTile
                        label="Normal"
                        active={!editor?.isActive("heading") && !editor?.isActive("blockquote")}
                        onClick={() => applyNamedStyle("normal")}
                        previewStyle={{ fontSize: 11 }}
                      />
                      <StyleTile
                        label="Title"
                        active={false}
                        onClick={() => applyNamedStyle("title")}
                        previewStyle={{ fontSize: 17, color: "#1e293b" }}
                      />
                      <StyleTile
                        label="Heading 1"
                        active={Boolean(editor?.isActive("heading", { level: 1 }))}
                        onClick={() => applyNamedStyle("h1")}
                        previewStyle={{ fontSize: 15, color: "#2b579a", fontWeight: 600 }}
                      />
                      <StyleTile
                        label="Heading 2"
                        active={Boolean(editor?.isActive("heading", { level: 2 }))}
                        onClick={() => applyNamedStyle("h2")}
                        previewStyle={{ fontSize: 13, color: "#2b579a", fontWeight: 600 }}
                      />
                      <StyleTile
                        label="Heading 3"
                        active={Boolean(editor?.isActive("heading", { level: 3 }))}
                        onClick={() => applyNamedStyle("h3")}
                        previewStyle={{ fontSize: 12, color: "#1f3763", fontWeight: 600 }}
                      />
                      <StyleTile
                        label="Quote"
                        active={Boolean(editor?.isActive("blockquote"))}
                        onClick={() => applyNamedStyle("quote")}
                        previewStyle={{ fontSize: 11, fontStyle: "italic", color: "#475569" }}
                      />
                      <StyleTile
                        label="Strong"
                        active={Boolean(editor?.isActive("bold"))}
                        onClick={() => applyNamedStyle("strong")}
                        previewStyle={{ fontSize: 11, fontWeight: 700 }}
                      />
                      <StyleTile
                        label="Emphasis"
                        active={Boolean(editor?.isActive("italic"))}
                        onClick={() => applyNamedStyle("emphasis")}
                        previewStyle={{ fontSize: 11, fontStyle: "italic" }}
                      />
                    </div>
                  </RibbonGroup>

                  <RibbonGroup label="Editing">
                    <Stack>
                      <SmallButton
                        label="Find"
                        icon={<Search size={14} />}
                        onClick={() => setShowNavigation(true)}
                      />
                      <SmallButton
                        label="Replace"
                        icon={<Replace size={14} />}
                        onClick={() => setShowNavigation(true)}
                      />
                      <SmallButton
                        label="Select all"
                        icon={<span className="text-[11px] font-bold">All</span>}
                        onClick={() => editor?.chain().focus().selectAll().run()}
                      />
                    </Stack>
                  </RibbonGroup>
                </>
              )}

              {currentTab === "Insert" && (
                <>
                  <RibbonGroup label="Pages">
                    <BigButton
                      label="Page Break"
                      title="Page break (Ctrl+Enter)"
                      icon={<FilePlus size={28} />}
                      onClick={insertPageBreak}
                    />
                    <BigButton
                      label="Blank Page"
                      icon={<FileText size={28} />}
                      onClick={() => {
                        insertPageBreak();
                        insertPageBreak();
                      }}
                    />
                  </RibbonGroup>

                  <RibbonGroup label="Tables">
                    <DropMenu
                      variant="big"
                      label="Table"
                      icon={<TableIcon size={28} />}
                      minWidth={210}
                    >
                      {(close) => (
                        <>
                          <TableGrid
                            close={close}
                            onPick={(rows, cols) =>
                              editor
                                ?.chain()
                                .focus()
                                .insertTable({ rows, cols, withHeaderRow: true })
                                .run()
                            }
                          />
                          <MenuItem
                            label="Insert 3 x 3 table"
                            icon={<TableIcon size={14} />}
                            onClick={insertTable}
                            close={close}
                          />
                        </>
                      )}
                    </DropMenu>
                  </RibbonGroup>

                  <RibbonGroup label="Illustrations">
                    <BigButton
                      label="Pictures"
                      icon={<ImagePlus size={28} />}
                      onClick={() => imageInputRef.current?.click()}
                    />
                  </RibbonGroup>

                  <RibbonGroup label="Links">
                    <BigButton
                      label="Hyperlink"
                      icon={<LinkIcon size={28} />}
                      onClick={addLink}
                    />
                    <Stack>
                      <SmallButton
                        label="Remove link"
                        icon={<X size={14} />}
                        onClick={() => editor?.chain().focus().unsetLink().run()}
                      />
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Header & Footer">
                    <Stack>
                      <DropMenu
                        label="Header"
                        icon={<FileText size={14} />}
                        minWidth={230}
                      >
                        {(close) => (
                          <div className="space-y-2 px-3 py-2">
                            <div className="text-[11px] text-slate-600">
                              Header text (top of every printed page)
                            </div>
                            <input
                              value={headerText}
                              maxLength={120}
                              onChange={(event) => setHeaderText(event.target.value)}
                              id="notes-header"
                              className="h-7 w-full rounded-sm border border-[#c6c6c6] px-2 text-[12px] outline-none focus:border-[#2b579a]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setHeaderText("");
                                close();
                              }}
                              className="text-[11px] text-[#2b579a] hover:underline"
                            >
                              Remove header
                            </button>
                          </div>
                        )}
                      </DropMenu>
                      <DropMenu
                        label="Footer"
                        icon={<FileText size={14} />}
                        minWidth={230}
                      >
                        {(close) => (
                          <div className="space-y-2 px-3 py-2">
                            <div className="text-[11px] text-slate-600">
                              Footer text (bottom of every printed page)
                            </div>
                            <input
                              value={footerText}
                              maxLength={120}
                              onChange={(event) => setFooterText(event.target.value)}
                              id="notes-footer"
                              className="h-7 w-full rounded-sm border border-[#c6c6c6] px-2 text-[12px] outline-none focus:border-[#2b579a]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setFooterText("");
                                close();
                              }}
                              className="text-[11px] text-[#2b579a] hover:underline"
                            >
                              Remove footer
                            </button>
                          </div>
                        )}
                      </DropMenu>
                      <DropMenu
                        label="Page Number"
                        icon={<span className="text-[12px] font-semibold">#</span>}
                        minWidth={190}
                      >
                        {(close) => (
                          <>
                            <MenuItem
                              label="Show page numbers"
                              hint="Bottom right, when printing"
                              active={pageNumbers}
                              onClick={() => setPageNumbers(true)}
                              close={close}
                            />
                            <MenuItem
                              label="Remove page numbers"
                              active={!pageNumbers}
                              onClick={() => setPageNumbers(false)}
                              close={close}
                            />
                          </>
                        )}
                      </DropMenu>
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Text">
                    <DropMenu
                      variant="big"
                      label="Date & Time"
                      icon={<CalendarDays size={28} />}
                      minWidth={180}
                    >
                      {(close) => (
                        <>
                          <MenuItem
                            label={new Date().toLocaleDateString()}
                            hint="Insert today's date"
                            onClick={insertDate}
                            close={close}
                          />
                          <MenuItem
                            label={new Date().toLocaleTimeString()}
                            hint="Insert the time now"
                            onClick={insertTime}
                            close={close}
                          />
                        </>
                      )}
                    </DropMenu>
                    <Stack>
                      <SmallButton
                        label="Horizontal line"
                        icon={<Minus size={14} />}
                        onClick={insertHorizontalLine}
                      />
                      <SmallButton
                        label="Quote"
                        icon={<Quote size={14} />}
                        active={editor?.isActive("blockquote")}
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                      />
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Symbols">
                    <DropMenu
                      variant="big"
                      label="Symbol"
                      icon={<Omega size={28} />}
                      minWidth={230}
                    >
                      {(close) => (
                        <div className="grid grid-cols-8 gap-0.5 p-2">
                          {SYMBOLS.map((symbol) => (
                            <button
                              key={symbol}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => {
                                insertSymbol(symbol);
                                close();
                              }}
                              className="h-7 w-7 rounded-sm border border-transparent text-[14px] hover:border-[#7fb2e0] hover:bg-[#dcebf7]"
                            >
                              {symbol}
                            </button>
                          ))}
                        </div>
                      )}
                    </DropMenu>
                  </RibbonGroup>
                </>
              )}

              {currentTab === "Design" && (
                <>
                  <RibbonGroup label="Document Formatting">
                    <div className="flex items-center gap-1">
                      {THEMES.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          title={`${item.name} theme`}
                          onClick={() => {
                            setThemeName(item.name);
                            setFontFamily(item.body);
                            setHeadingColor(null);
                          }}
                          className={`flex h-[62px] w-[78px] shrink-0 flex-col justify-between overflow-hidden border bg-white p-1.5 text-left ${
                            themeName === item.name
                              ? "border-[#2b579a] ring-1 ring-[#2b579a]"
                              : "border-[#d4d4d4] hover:border-[#7fb2e0]"
                          }`}
                        >
                          <span
                            className="block truncate text-[14px] font-bold leading-tight"
                            style={{ fontFamily: item.heading, color: item.color ?? "#1e293b" }}
                          >
                            Title
                          </span>
                          <span
                            className="block truncate text-[10px] text-slate-600"
                            style={{ fontFamily: item.body }}
                          >
                            Text sample
                          </span>
                          <span className="block truncate text-[10px] text-slate-500">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </RibbonGroup>

                  <RibbonGroup label="Colours & Fonts">
                    <DropMenu
                      variant="big"
                      label="Colours"
                      icon={<Palette size={28} />}
                      minWidth={190}
                    >
                      {(close) => (
                        <>
                          <div className="px-3 py-1 text-[11px] text-slate-500">
                            Heading colour
                          </div>
                          <SwatchGrid
                            colors={HEADING_COLORS}
                            onPick={(color) => setHeadingColor(color)}
                            close={close}
                          />
                          <MenuItem
                            label="Theme default"
                            onClick={() => setHeadingColor(null)}
                            close={close}
                          />
                        </>
                      )}
                    </DropMenu>
                    <DropMenu
                      variant="big"
                      label="Fonts"
                      icon={<span className="text-[24px] font-semibold leading-none">A</span>}
                      minWidth={190}
                    >
                      {(close) => (
                        <>
                          {FONT_LIST.map((name) => (
                            <MenuItem
                              key={name}
                              label={name}
                              active={fontFamily === name}
                              onClick={() => setFontFamily(name)}
                              close={close}
                            />
                          ))}
                        </>
                      )}
                    </DropMenu>
                    <Stack>
                      <DropMenu
                        label="Paragraph Spacing"
                        icon={<span className="text-[13px] font-semibold">↕</span>}
                        minWidth={150}
                      >
                        {(close) => (
                          <>
                            {["1", "1.15", "1.5", "2"].map((value) => (
                              <MenuItem
                                key={value}
                                label={value === "1" ? "Compact (1.0)" : value === "1.15" ? "Tight (1.15)" : value === "1.5" ? "Relaxed (1.5)" : "Double (2.0)"}
                                active={lineSpacing === value}
                                onClick={() => applyLineSpacing(value)}
                                close={close}
                              />
                            ))}
                          </>
                        )}
                      </DropMenu>
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Page Background">
                    <DropMenu
                      variant="big"
                      label="Watermark"
                      icon={<span className="text-[22px] font-bold leading-none opacity-70">W</span>}
                      minWidth={170}
                    >
                      {(close) => (
                        <>
                          {["none", "DRAFT", "CONFIDENTIAL", "SAMPLE", "COPY", "URGENT"].map((value) => (
                            <MenuItem
                              key={value}
                              label={value === "none" ? "No watermark" : value}
                              active={watermark === value}
                              onClick={() => setWatermark(value)}
                              close={close}
                            />
                          ))}
                        </>
                      )}
                    </DropMenu>
                    <DropMenu
                      variant="big"
                      label="Page Colour"
                      icon={<Palette size={28} />}
                      minWidth={170}
                    >
                      {(close) => (
                        <>
                          {PAGE_COLORS.map((item) => (
                            <MenuItem
                              key={item.value}
                              label={item.label}
                              active={pageColor === item.value}
                              onClick={() => setPageColor(item.value)}
                              close={close}
                            />
                          ))}
                        </>
                      )}
                    </DropMenu>
                    <DropMenu
                      variant="big"
                      label="Page Borders"
                      icon={<Square size={28} />}
                      minWidth={170}
                    >
                      {(close) => (
                        <>
                          <MenuItem label="None" active={pageBorder === "none"} onClick={() => setPageBorder("none")} close={close} />
                          <MenuItem label="Box" active={pageBorder === "solid"} onClick={() => setPageBorder("solid")} close={close} />
                          <MenuItem label="Double line" active={pageBorder === "double"} onClick={() => setPageBorder("double")} close={close} />
                        </>
                      )}
                    </DropMenu>
                  </RibbonGroup>
                </>
              )}

              {currentTab === "Layout" && (
                <>
                  <RibbonGroup label="Page Setup">
                    <DropMenu
                      variant="big"
                      label="Margins"
                      icon={<Square size={28} />}
                      minWidth={190}
                    >
                      {(close) => (
                        <>
                          <MenuItem label="Normal" hint="Standard margins" active={margin === "normal"} onClick={() => setMargin("normal")} close={close} />
                          <MenuItem label="Narrow" hint="More text per page" active={margin === "narrow"} onClick={() => setMargin("narrow")} close={close} />
                          <MenuItem label="Wide" hint="Extra white space" active={margin === "wide"} onClick={() => setMargin("wide")} close={close} />
                        </>
                      )}
                    </DropMenu>
                    <DropMenu
                      variant="big"
                      label="Orientation"
                      icon={<RectangleVertical size={28} />}
                      minWidth={150}
                    >
                      {(close) => (
                        <>
                          <MenuItem label="Portrait" active={orientation === "portrait"} onClick={() => setOrientation("portrait")} close={close} />
                          <MenuItem label="Landscape" active={orientation === "landscape"} onClick={() => setOrientation("landscape")} close={close} />
                        </>
                      )}
                    </DropMenu>
                    <DropMenu
                      variant="big"
                      label="Size"
                      icon={<FileText size={28} />}
                      minWidth={150}
                    >
                      {(close) => (
                        <>
                          <MenuItem label="A4" hint="21 x 29.7 cm" active={pageSize === "A4"} onClick={() => setPageSize("A4")} close={close} />
                          <MenuItem label="Letter" hint="8.5 x 11 in" active={pageSize === "Letter"} onClick={() => setPageSize("Letter")} close={close} />
                        </>
                      )}
                    </DropMenu>
                    <DropMenu
                      variant="big"
                      label="Columns"
                      icon={<Columns2 size={28} />}
                      minWidth={150}
                    >
                      {(close) => (
                        <>
                          <MenuItem label="One" active={columns === "1"} onClick={() => setColumns("1")} close={close} />
                          <MenuItem label="Two" active={columns === "2"} onClick={() => setColumns("2")} close={close} />
                          <MenuItem label="Three" active={columns === "3"} onClick={() => setColumns("3")} close={close} />
                        </>
                      )}
                    </DropMenu>
                    <Stack>
                      <DropMenu
                        label="Breaks"
                        icon={<FilePlus size={14} />}
                        minWidth={170}
                      >
                        {(close) => (
                          <MenuItem
                            label="Page break"
                            hint="Start a new page (Ctrl+Enter)"
                            onClick={insertPageBreak}
                            close={close}
                          />
                        )}
                      </DropMenu>
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Paragraph">
                    <Stack>
                      <Row>
                        <SmallButton
                          label="Indent"
                          icon={<IndentIncrease size={14} />}
                          onClick={() => changeIndent(1)}
                        />
                        <SmallButton
                          label="Outdent"
                          icon={<IndentDecrease size={14} />}
                          onClick={() => changeIndent(-1)}
                        />
                      </Row>
                      <Row>
                        <DropMenu
                          label="Spacing"
                          icon={<span className="text-[13px] font-semibold">↕</span>}
                          minWidth={150}
                        >
                          {(close) => (
                            <>
                              {["1", "1.15", "1.5", "2"].map((value) => (
                                <MenuItem
                                  key={value}
                                  label={value === "1" ? "1.0" : value === "2" ? "2.0" : value}
                                  active={lineSpacing === value}
                                  onClick={() => applyLineSpacing(value)}
                                  close={close}
                                />
                              ))}
                            </>
                          )}
                        </DropMenu>
                      </Row>
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Align">
                    <Stack>
                      <Row>
                        <SmallButton title="Align left" icon={<AlignLeft size={15} />} onClick={() => editor?.chain().focus().setTextAlign("left").run()} />
                        <SmallButton title="Center" icon={<AlignCenter size={15} />} onClick={() => editor?.chain().focus().setTextAlign("center").run()} />
                        <SmallButton title="Align right" icon={<AlignRight size={15} />} onClick={() => editor?.chain().focus().setTextAlign("right").run()} />
                        <SmallButton title="Justify" icon={<AlignJustify size={15} />} onClick={() => editor?.chain().focus().setTextAlign("justify").run()} />
                      </Row>
                    </Stack>
                  </RibbonGroup>
                </>
              )}

              {currentTab === "References" && (
                <>
                  <RibbonGroup label="Table of Contents">
                    <BigButton
                      label="Table of Contents"
                      icon={<List size={28} />}
                      onClick={insertToc}
                    />
                  </RibbonGroup>
                  <RibbonGroup label="Footnotes">
                    <BigButton
                      label="Insert Footnote"
                      icon={<span className="text-[20px] font-semibold leading-none">AB¹</span>}
                      onClick={insertFootnote}
                    />
                  </RibbonGroup>
                  <RibbonGroup label="Captions">
                    <DropMenu
                      variant="big"
                      label="Insert Caption"
                      icon={<ImagePlus size={28} />}
                      minWidth={150}
                    >
                      {(close) => (
                        <>
                          <MenuItem label="Figure caption" onClick={() => insertCaption("Figure")} close={close} />
                          <MenuItem label="Table caption" onClick={() => insertCaption("Table")} close={close} />
                        </>
                      )}
                    </DropMenu>
                  </RibbonGroup>
                </>
              )}

              {currentTab === "Review" && (
                <>
                  <RibbonGroup label="Proofing">
                    <BigButton
                      label="Spelling"
                      title="Turn spell check on or off"
                      icon={<span className="text-[16px] font-bold leading-none">ABC✓</span>}
                      active={spellcheck}
                      onClick={toggleSpellcheck}
                    />
                    <BigButton
                      label="Word Count"
                      icon={<span className="text-[16px] font-bold leading-none">123</span>}
                      onClick={showStats}
                    />
                  </RibbonGroup>
                  <RibbonGroup label="Find">
                    <BigButton
                      label="Find & Replace"
                      icon={<Search size={28} />}
                      onClick={() => setShowNavigation(true)}
                    />
                  </RibbonGroup>
                  <RibbonGroup label="Protect">
                    <BigButton
                      label="Restrict Editing"
                      title="Make the document read-only"
                      icon={<Lock size={28} />}
                      active={readOnly}
                      onClick={() => {
                        setReadOnly((value) => !value);
                        notify(readOnly ? "Editing is allowed again." : "Document is read-only. Click again to edit.");
                      }}
                    />
                  </RibbonGroup>
                </>
              )}

              {currentTab === "View" && (
                <>
                  <RibbonGroup label="Views">
                    <BigButton
                      label="Read Mode"
                      icon={<BookOpen size={28} />}
                      active={(viewMode as ViewMode) === "read"}
                      onClick={() => setViewMode("read")}
                    />
                    <BigButton
                      label="Print Layout"
                      icon={<FileText size={28} />}
                      active={viewMode === "print"}
                      onClick={() => setViewMode("print")}
                    />
                    <BigButton
                      label="Web Layout"
                      icon={<Globe2 size={28} />}
                      active={viewMode === "web"}
                      onClick={() => setViewMode("web")}
                    />
                  </RibbonGroup>
                  <RibbonGroup label="Show">
                    <Stack>
                      <CheckRow label="Ruler" checked={showRuler} onChange={setShowRuler} />
                      <CheckRow label="Gridlines" checked={showGrid} onChange={setShowGrid} />
                      <CheckRow label="Navigation Pane" checked={showPane} onChange={setShowPane} />
                    </Stack>
                  </RibbonGroup>
                  <RibbonGroup label="Zoom">
                    <BigButton
                      label="Zoom out"
                      icon={<ZoomOut size={28} />}
                      onClick={() => setZoom((value) => Math.max(40, value - 10))}
                    />
                    <BigButton
                      label="Zoom in"
                      icon={<ZoomIn size={28} />}
                      onClick={() => setZoom((value) => Math.min(200, value + 10))}
                    />
                    <BigButton
                      label="100%"
                      icon={<span className="text-[18px] font-bold leading-none">100</span>}
                      onClick={() => setZoom(100)}
                    />
                    <Stack>
                      <SmallButton label="One Page" icon={<FileText size={14} />} onClick={fitWholePage} />
                      <SmallButton label="Page Width" icon={<AlignJustify size={14} />} onClick={fitPageWidth} />
                    </Stack>
                  </RibbonGroup>
                  <RibbonGroup label="Focus">
                    <BigButton
                      label="Focus Mode"
                      icon={<Eye size={28} />}
                      onClick={() => setFocusMode(true)}
                    />
                    <BigButton
                      label="Shortcuts"
                      icon={<span className="text-[16px] font-bold leading-none">Ctrl</span>}
                      onClick={() =>
                        notify(
                          "Ctrl+B bold · Ctrl+I italic · Ctrl+U underline · Ctrl+Z undo · Ctrl+Y redo · Ctrl+S save · Ctrl+Enter page break · Ctrl+Shift+7/8 lists",
                        )
                      }
                    />
                  </RibbonGroup>
                </>
              )}

              {currentTab === "Picture" && imageInfo && (
                <>
                  <RibbonGroup label="Adjust">
                    <BigButton
                      label="Crop"
                      icon={<CropGlyph />}
                      onClick={() => setCropOpen(true)}
                    />
                    <Stack>
                      <DropMenu
                        label="Effects"
                        icon={<span className="text-[12px] font-semibold">✦</span>}
                        minWidth={170}
                      >
                        {(close) => (
                          <>
                            {[
                              ["none", "Normal"],
                              ["grayscale(1)", "Black and white"],
                              ["sepia(0.8)", "Sepia"],
                              ["brightness(1.25)", "Brighter"],
                              ["brightness(0.8)", "Darker"],
                              ["contrast(1.35)", "High contrast"],
                            ].map(([value, label]) => (
                              <MenuItem
                                key={value}
                                label={label}
                                active={imageInfo.attrs.fx === value}
                                onClick={() => setImageAttrs({ fx: value })}
                                close={close}
                              />
                            ))}
                          </>
                        )}
                      </DropMenu>
                      <SmallButton
                        label="Replace"
                        icon={<ImagePlus size={14} />}
                        onClick={() => replaceInputRef.current?.click()}
                      />
                      <SmallButton
                        label="Alt text"
                        icon={<span className="text-[11px] font-semibold">Alt</span>}
                        onClick={editAltText}
                      />
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Picture Styles">
                    <Stack>
                      <DropMenu
                        label="Border"
                        icon={<Square size={14} />}
                        minWidth={190}
                      >
                        {(close) => (
                          <>
                            {[
                              ["none", "No border"],
                              ["1", "Thin"],
                              ["3", "Medium"],
                              ["6", "Thick"],
                            ].map(([value, label]) => (
                              <MenuItem
                                key={value}
                                label={label}
                                active={imageInfo.attrs.border === value}
                                onClick={() => setImageAttrs({ border: value })}
                                close={close}
                              />
                            ))}
                            <div className="px-3 py-1 text-[11px] text-slate-500">Border colour</div>
                            <SwatchGrid
                              colors={HEADING_COLORS}
                              onPick={(color) =>
                                setImageAttrs({
                                  borderColor: color,
                                  border:
                                    imageInfo.attrs.border === "none" ? "3" : imageInfo.attrs.border,
                                })
                              }
                              close={close}
                            />
                          </>
                        )}
                      </DropMenu>
                      <SmallButton
                        label="Rounded corners"
                        icon={<span className="text-[12px]">▢</span>}
                        active={imageInfo.attrs.rounded}
                        onClick={() => setImageAttrs({ rounded: !imageInfo.attrs.rounded })}
                      />
                      <SmallButton
                        label="Shadow"
                        icon={<span className="text-[12px]">◧</span>}
                        active={imageInfo.attrs.shadow}
                        onClick={() => setImageAttrs({ shadow: !imageInfo.attrs.shadow })}
                      />
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Arrange">
                    <DropMenu
                      variant="big"
                      label="Wrap Text"
                      icon={<AlignJustify size={28} />}
                      minWidth={260}
                    >
                      {(close) => (
                        <>
                          {[
                            ["inline", "In Line with Text", "Picture sits in the line like a letter"],
                            ["float-left", "Square - Picture on Left", "Text wraps around on the right"],
                            ["float-right", "Square - Picture on Right", "Text wraps around on the left"],
                            ["block-left", "Top and Bottom - Left", "No text beside the picture"],
                            ["block-center", "Top and Bottom - Center", "No text beside the picture"],
                            ["block-right", "Top and Bottom - Right", "No text beside the picture"],
                          ].map(([value, label, hint]) => (
                            <MenuItem
                              key={value}
                              label={label}
                              hint={hint}
                              active={imageInfo.attrs.layout === value}
                              onClick={() => setImageAttrs({ layout: value })}
                              close={close}
                            />
                          ))}
                        </>
                      )}
                    </DropMenu>
                    <Stack>
                      <SmallButton
                        label="Move up"
                        title="Move the picture to the paragraph above (you can also drag it)"
                        icon={<span className="text-[12px]">↑</span>}
                        onClick={() => moveImage("up")}
                      />
                      <SmallButton
                        label="Move down"
                        title="Move the picture to the paragraph below (you can also drag it)"
                        icon={<span className="text-[12px]">↓</span>}
                        onClick={() => moveImage("down")}
                      />
                      <DropMenu
                        label="Rotate"
                        icon={<span className="text-[12px]">↻</span>}
                        minWidth={170}
                      >
                        {(close) => (
                          <>
                            <MenuItem label="Rotate right 90°" onClick={() => void transformSelectedImage("rotate-right")} close={close} />
                            <MenuItem label="Rotate left 90°" onClick={() => void transformSelectedImage("rotate-left")} close={close} />
                            <MenuItem label="Flip horizontal" onClick={() => void transformSelectedImage("flip-h")} close={close} />
                            <MenuItem label="Flip vertical" onClick={() => void transformSelectedImage("flip-v")} close={close} />
                          </>
                        )}
                      </DropMenu>
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Size">
                    {(() => {
                      const size = measureImage();

                      return (
                        <Stack>
                          <label className="flex items-center justify-between gap-2 text-[11px]">
                            Height
                            <input
                              key={`h${size.h}`}
                              type="number"
                              min={8}
                              defaultValue={size.h}
                              onBlur={(event) => commitImageSize("h", Number(event.target.value))}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") event.currentTarget.blur();
                              }}
                              className="h-6 w-16 rounded-sm border border-[#c6c6c6] px-1 text-[12px]"
                            />
                          </label>
                          <label className="flex items-center justify-between gap-2 text-[11px]">
                            Width
                            <input
                              key={`w${size.w}`}
                              type="number"
                              min={8}
                              defaultValue={size.w}
                              onBlur={(event) => commitImageSize("w", Number(event.target.value))}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") event.currentTarget.blur();
                              }}
                              className="h-6 w-16 rounded-sm border border-[#c6c6c6] px-1 text-[12px]"
                            />
                          </label>
                          <CheckRow label="Lock aspect ratio" checked={lockAspect} onChange={setLockAspect} />
                        </Stack>
                      );
                    })()}
                    <Stack>
                      <DropMenu
                        label="Preset size"
                        icon={<ZoomIn size={14} />}
                        minWidth={170}
                      >
                        {(close) => (
                          <>
                            <MenuItem label="Small (25% of width)" onClick={() => setImagePercent(25)} close={close} />
                            <MenuItem label="Medium (50%)" onClick={() => setImagePercent(50)} close={close} />
                            <MenuItem label="Large (75%)" onClick={() => setImagePercent(75)} close={close} />
                            <MenuItem label="Full width (100%)" onClick={() => setImagePercent(100)} close={close} />
                          </>
                        )}
                      </DropMenu>
                      <SmallButton
                        label="Reset size"
                        icon={<ZoomOut size={14} />}
                        onClick={() => setImageAttrs({ width: null, height: null })}
                      />
                    </Stack>
                  </RibbonGroup>

                  <RibbonGroup label="Other">
                    <BigButton
                      label="Caption"
                      icon={<span className="text-[16px] font-bold leading-none">Fig</span>}
                      onClick={() => insertCaption("Figure")}
                    />
                    <BigButton
                      label="Delete Picture"
                      icon={<Trash2 size={28} />}
                      onClick={() => editor?.chain().focus().deleteSelection().run()}
                    />
                  </RibbonGroup>
                </>
              )}

              {currentTab === "Table" && (
                <>
                  <RibbonGroup label="Rows & Columns">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      <SmallButton label="Insert Above" icon={<span className="text-[12px]">↑+</span>} onClick={() => editor?.chain().focus().addRowBefore().run()} />
                      <SmallButton label="Insert Left" icon={<span className="text-[12px]">←+</span>} onClick={() => editor?.chain().focus().addColumnBefore().run()} />
                      <SmallButton label="Insert Below" icon={<span className="text-[12px]">↓+</span>} onClick={() => editor?.chain().focus().addRowAfter().run()} />
                      <SmallButton label="Insert Right" icon={<span className="text-[12px]">→+</span>} onClick={() => editor?.chain().focus().addColumnAfter().run()} />
                      <SmallButton label="Delete Row" icon={<span className="text-[12px]">−</span>} onClick={() => editor?.chain().focus().deleteRow().run()} />
                      <SmallButton label="Delete Column" icon={<span className="text-[12px]">−</span>} onClick={() => editor?.chain().focus().deleteColumn().run()} />
                    </div>
                  </RibbonGroup>
                  <RibbonGroup label="Merge">
                    <Stack>
                      <SmallButton label="Merge Cells" icon={<span className="text-[12px]">⊞</span>} onClick={() => editor?.chain().focus().mergeCells().run()} />
                      <SmallButton label="Split Cell" icon={<span className="text-[12px]">⊟</span>} onClick={() => editor?.chain().focus().splitCell().run()} />
                    </Stack>
                  </RibbonGroup>
                  <RibbonGroup label="Table Style Options">
                    <Stack>
                      <SmallButton label="Header Row" icon={<TableIcon size={14} />} onClick={() => editor?.chain().focus().toggleHeaderRow().run()} />
                    </Stack>
                  </RibbonGroup>
                  <RibbonGroup label="Delete">
                    <BigButton
                      label="Delete Table"
                      icon={<Trash2 size={28} />}
                      onClick={() => editor?.chain().focus().deleteTable().run()}
                    />
                  </RibbonGroup>
                </>
              )}
            </div>
            <button
              type="button"
              title="Collapse the ribbon"
              aria-label="Collapse the ribbon"
              onClick={() => setRibbonOpen(false)}
              className="absolute right-1 top-1 rounded p-0.5 text-slate-500 hover:bg-[#dcebf7]"
            >
              <ChevronUp size={14} />
            </button>
          </section>
        )}
      </header>

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
      <div className="flex gap-3 px-3 py-4">
        {showPane && !hideChrome && (
          <aside className="sticky top-40 hidden h-[calc(100vh-14rem)] w-60 shrink-0 overflow-y-auto border border-[#c6c6c6] bg-white p-3 text-[12px] md:block print:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold text-slate-700">Navigation</span>
              <button
                type="button"
                aria-label="Close navigation pane"
                onClick={() => setShowPane(false)}
                className="rounded p-0.5 hover:bg-slate-100"
              >
                <X size={14} />
              </button>
            </div>
            {headings.length === 0 ? (
              <p className="text-slate-500">
                Add headings (Heading 1, 2, 3) and they will appear here. Click one to jump to it.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {headings.map((item, index) => (
                  <li key={`${item.pos}-${index}`}>
                    <button
                      type="button"
                      onClick={() => goToHeading(item.pos)}
                      className="block w-full truncate rounded px-1 py-1 text-left hover:bg-[#dcebf7]"
                      style={{ paddingLeft: 4 + (item.level - 1) * 12 }}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}

        <section ref={canvasRef} className="min-w-0 flex-1">
          {showRuler && viewMode === "print" && (
            <div
              className="mx-auto mb-1 flex h-5 items-end overflow-hidden border border-[#c6c6c6] bg-white text-[9px] text-slate-500 print:hidden"
              style={{ width: `${pw * z}px`, maxWidth: "100%" }}
            >
              {Array.from({ length: Math.ceil(pw / 37.8) }).map((_, index) => (
                <div
                  key={index}
                  className="shrink-0 border-l border-slate-400 pl-0.5 leading-none"
                  style={{ width: 37.8 * z, height: 11 }}
                >
                  {index}
                </div>
              ))}
            </div>
          )}

          <div
            className={`mx-auto bg-white ${
              viewMode === "web" ? "" : "border border-[#c6c6c6] shadow-md"
            }`}
            style={{
              width: viewMode === "web" ? "100%" : `${pw * z}px`,
              maxWidth: "100%",
            }}
          >
            <div
              ref={pageRef}
              className="brx-page"
              data-border={pageBorder !== "none" ? "true" : "false"}
              style={{
                ...pageVars,
                minHeight: `${ph}px`,
                padding: marginValue,
                position: "relative",
                backgroundColor: pageColor,
                backgroundImage: guideLayers.length ? guideLayers.join(", ") : undefined,
                border:
                  pageBorder === "solid"
                    ? "2px solid #334155"
                    : pageBorder === "double"
                      ? "6px double #334155"
                      : undefined,
                fontFamily,
                fontSize,
                lineHeight: lineSpacing,
                zoom: viewMode === "web" ? 1 : z,
              }}
            >
              {watermark !== "none" && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
                >
                  <span
                    style={{
                      fontSize: "96px",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      color: "rgba(100,116,139,0.18)",
                      transform: "rotate(-30deg)",
                    }}
                  >
                    {watermark}
                  </span>
                </div>
              )}
              {headerText.trim() && (
                <div className="mb-3 border-b border-slate-200 pb-1 text-center text-xs text-slate-500 print:hidden">
                  {headerText}
                </div>
              )}
              <div
                className={showMarks ? "brx-show-marks" : ""}
                style={{ columnCount: Number(columns), columnGap: "32px" }}
              >
                <EditorContent editor={editor} />
              </div>
              {(footerText.trim() || pageNumbers) && (
                <div className="mt-4 flex justify-between border-t border-slate-200 pt-1 text-xs text-slate-500 print:hidden">
                  <span>{footerText}</span>
                  <span>{pageNumbers ? "Page numbers on" : ""}</span>
                </div>
              )}
            </div>
          </div>

          {!activeEditor && (
            <p className="mt-3 text-center text-sm text-slate-500">
              Starting editor...
            </p>
          )}
        </section>
      </div>

      {(focusMode || viewMode === "read") && (
        <button
          type="button"
          onClick={() => {
            setFocusMode(false);
            if (viewMode === "read") setViewMode("print");
          }}
          className="fixed right-4 top-14 z-50 rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-slate-700 print:hidden"
        >
          {viewMode === "read" ? "Edit document" : "Exit focus mode"}
        </button>
      )}

      {!ribbonOpen && !hideChrome && (
        <button
          type="button"
          onClick={() => setRibbonOpen(true)}
          className="fixed right-4 top-24 z-30 rounded bg-white px-2 py-1 text-[11px] text-slate-600 shadow ring-1 ring-slate-300 hover:bg-[#dcebf7] print:hidden"
        >
          Show ribbon
        </button>
      )}

      {/* Status bar */}
      <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-2 bg-[#2b579a] px-3 py-1 text-[12px] text-white">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            {pages} {pages === 1 ? "page" : "pages"}
            <span className="ml-1 text-blue-200">(approx.)</span>
          </span>
          <span>{wordStats.words} words</span>
          <span>English (India)</span>
          <span>
            {pageSize} · {orientation}
          </span>
          {readOnly && <span className="text-amber-200">Read-only</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            title="Read Mode"
            aria-label="Read Mode"
            onClick={() => setViewMode("read")}
            className={`rounded p-1 hover:bg-white/20 ${viewMode === "read" ? "bg-white/25" : ""}`}
          >
            <BookOpen size={14} />
          </button>
          <button
            type="button"
            title="Print Layout"
            aria-label="Print Layout"
            onClick={() => setViewMode("print")}
            className={`rounded p-1 hover:bg-white/20 ${viewMode === "print" ? "bg-white/25" : ""}`}
          >
            <FileText size={14} />
          </button>
          <button
            type="button"
            title="Web Layout"
            aria-label="Web Layout"
            onClick={() => setViewMode("web")}
            className={`rounded p-1 hover:bg-white/20 ${viewMode === "web" ? "bg-white/25" : ""}`}
          >
            <Globe2 size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom((value) => Math.max(40, value - 10))}
            className="rounded p-1 hover:bg-white/20"
            aria-label="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <input
            type="range"
            min={40}
            max={200}
            step={10}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            aria-label="Zoom"
            className="w-28"
          />
          <button
            type="button"
            onClick={() => setZoom((value) => Math.min(200, value + 10))}
            className="rounded p-1 hover:bg-white/20"
            aria-label="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoom(100)}
            className="w-10 text-right hover:underline"
            title="Reset to 100%"
          >
            {zoom}%
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
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={replaceImage}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".html,.htm,.txt"
        className="hidden"
        onChange={openLocalFile}
      />

      {/* File menu (backstage) */}
      {fileOpen && (
        <div className="fixed inset-0 z-[60] flex bg-white print:hidden">
          <nav className="flex w-56 shrink-0 flex-col bg-[#2b579a] py-2 text-white">
            <button
              type="button"
              onClick={closeBackstage}
              className="mb-2 flex items-center gap-2 px-4 py-3 text-[13px] hover:bg-white/15"
            >
              <ArrowLeft size={18} /> Back
            </button>
            {(
              [
                ["new", "New"],
                ["open", "Open"],
                ["save", "Save"],
                ["export", "Download"],
                ["print", "Print"],
              ] as [FileView, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => openFile(key)}
                className={`px-5 py-2.5 text-left text-[14px] hover:bg-white/15 ${
                  fileView === key ? "bg-[#1e3f73]" : ""
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto bg-[#f3f3f3] p-8">
            {fileView === "new" && (
              <div>
                <h2 className="mb-4 text-2xl font-light text-[#2b579a]">New</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => {
                      createNewDocument();
                      closeBackstage();
                    }}
                    className="flex h-36 flex-col items-center justify-center gap-2 border border-[#c6c6c6] bg-white hover:border-[#2b579a]"
                  >
                    <FilePlus size={34} className="text-[#2b579a]" />
                    <span className="text-[13px]">Blank document</span>
                  </button>
                  {DOC_TEMPLATES.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        applyTemplate(item.name);
                        closeBackstage();
                      }}
                      className="flex h-36 flex-col items-center justify-center gap-2 border border-[#c6c6c6] bg-white hover:border-[#2b579a]"
                    >
                      <FileText size={34} className="text-[#2b579a]" />
                      <span className="text-[13px]">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fileView === "open" && (
              <div>
                <h2 className="mb-4 text-2xl font-light text-[#2b579a]">Open</h2>
                <div className="grid max-w-xl gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocuments(true);
                      void loadCloudDocuments();
                      closeBackstage();
                    }}
                    className="flex items-center gap-3 border border-[#c6c6c6] bg-white p-4 text-left hover:border-[#2b579a]"
                  >
                    <FolderOpen size={26} className="text-[#2b579a]" />
                    <span>
                      <span className="block text-[14px]">My cloud documents</span>
                      <span className="block text-[12px] text-slate-500">
                        Documents saved to your EduNexa account
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-3 border border-[#c6c6c6] bg-white p-4 text-left hover:border-[#2b579a]"
                  >
                    <FolderOpen size={26} className="text-[#2b579a]" />
                    <span>
                      <span className="block text-[14px]">This computer</span>
                      <span className="block text-[12px] text-slate-500">
                        Open an .html or .txt file
                      </span>
                    </span>
                  </button>
                </div>
              </div>
            )}

            {fileView === "save" && (
              <div>
                <h2 className="mb-4 text-2xl font-light text-[#2b579a]">Save</h2>
                <div className="grid max-w-xl gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void saveToCloud(false);
                      closeBackstage();
                    }}
                    className="flex items-center gap-3 border border-[#c6c6c6] bg-white p-4 text-left hover:border-[#2b579a]"
                  >
                    <CloudUpload size={26} className="text-[#2b579a]" />
                    <span>
                      <span className="block text-[14px]">Save to cloud</span>
                      <span className="block text-[12px] text-slate-500">
                        Keeps this document in your account, on any device
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveLocally();
                      closeBackstage();
                    }}
                    className="flex items-center gap-3 border border-[#c6c6c6] bg-white p-4 text-left hover:border-[#2b579a]"
                  >
                    <Save size={26} className="text-[#2b579a]" />
                    <span>
                      <span className="block text-[14px]">Save in this browser</span>
                      <span className="block text-[12px] text-slate-500">
                        A quick copy on this computer only
                      </span>
                    </span>
                  </button>
                  <label className="flex items-center gap-2 text-[13px]">
                    <input
                      type="checkbox"
                      checked={autoSave}
                      onChange={(event) => setAutoSave(event.target.checked)}
                    />
                    Auto-save to the cloud every few seconds
                  </label>
                </div>
              </div>
            )}

            {fileView === "export" && (
              <div>
                <h2 className="mb-4 text-2xl font-light text-[#2b579a]">Download</h2>
                <div className="grid max-w-xl gap-3">
                  {(
                    [
                      ["Word document (.doc)", "Opens in Microsoft Word", downloadWord],
                      ["Web page (.html)", "Opens in any browser", downloadHtml],
                      ["Plain text (.txt)", "Text only, no formatting", downloadText],
                    ] as [string, string, () => void][]
                  ).map(([label, hint, action]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        action();
                        closeBackstage();
                      }}
                      className="flex items-center gap-3 border border-[#c6c6c6] bg-white p-4 text-left hover:border-[#2b579a]"
                    >
                      <Download size={26} className="text-[#2b579a]" />
                      <span>
                        <span className="block text-[14px]">{label}</span>
                        <span className="block text-[12px] text-slate-500">{hint}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {fileView === "print" && (
              <div>
                <h2 className="mb-4 text-2xl font-light text-[#2b579a]">Print</h2>
                <div className="grid max-w-xl gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      closeBackstage();
                      window.setTimeout(() => window.print(), 150);
                    }}
                    className="flex items-center gap-3 border border-[#c6c6c6] bg-white p-4 text-left hover:border-[#2b579a]"
                  >
                    <Printer size={26} className="text-[#2b579a]" />
                    <span>
                      <span className="block text-[14px]">Print or save as PDF</span>
                      <span className="block text-[12px] text-slate-500">
                        {pageSize} · {orientation}. Choose &quot;Save as PDF&quot; in the print window.
                      </span>
                    </span>
                  </button>
                  <p className="text-[12px] text-slate-500">
                    Header, footer and page numbers print on every page in Chrome or Edge 131 and newer.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {sendOpen && documentId && (
        <SendNoteModal
          documentId={documentId}
          title={title}
          onClose={() => setSendOpen(false)}
        />
      )}

      {cropOpen && imageInfo && (
        <CropDialog
          src={imageInfo.attrs.src}
          onApply={applyCrop}
          onClose={() => setCropOpen(false)}
        />
      )}

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
          min-height: 28px;
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
        .brx-editor-content h1,
        .brx-editor-content h2,
        .brx-editor-content h3 {
          color: var(--brx-h-color, inherit);
          font-family: var(--brx-h-font, inherit);
        }
        .brx-show-marks p::after,
        .brx-show-marks h1::after,
        .brx-show-marks h2::after,
        .brx-show-marks h3::after {
          content: "¶";
          margin-left: 2px;
          color: #93b4e0;
          font-size: 0.8em;
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
        .brx-editor-content .brx-img-wrap {
          cursor: move;
          touch-action: none;
        }
        .brx-editor-content .brx-img-ui button,
        .brx-editor-content button.brx-img-ui {
          cursor: pointer;
        }
        .brx-editor-content .brx-img-ui button:hover {
          background: #dcebf7;
        }
        .brx-editor-content::after {
          content: "";
          display: block;
          clear: both;
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
        .brx-editor-content div[data-type="page-break"] {
          border-top: 2px dashed #94a3b8;
          margin: 1.5rem 0;
          height: 0;
          position: relative;
        }
        .brx-editor-content div[data-type="page-break"]::after {
          content: "Page break";
          position: absolute;
          top: -9px;
          left: 50%;
          transform: translateX(-50%);
          background: #fff;
          padding: 0 8px;
          font-size: 11px;
          color: #64748b;
        }
        @media print {
          .brx-editor-content div[data-type="page-break"] {
            break-after: page;
            page-break-after: always;
            border: 0 !important;
            margin: 0 !important;
          }
          .brx-editor-content div[data-type="page-break"]::after {
            display: none;
          }
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
            zoom: 1 !important;
            transform: none !important;
            width: 100% !important;
            padding: 0 !important;
            background-image: none !important;
            border: 0 !important;
          }
          .brx-editor-content {
            min-height: auto !important;
          }
          .brx-img-ui {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
