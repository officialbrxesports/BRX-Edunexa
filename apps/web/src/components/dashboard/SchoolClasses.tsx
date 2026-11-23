"use client";

import { useState } from "react";
import ClassesView from "./ClassesView";
import { CreateClassPanel, SectionsPanel } from "./ClassSetup";

type Tab = "classes" | "create" | "sections";

export default function SchoolClasses({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const [tab, setTab] = useState<Tab>("classes");
  const [version, setVersion] = useState(0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {(
          [
            ["classes", "Classes & seating"],
            ["create", "Create class"],
            ["sections", "Sections"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === key
                ? "border-blue-700 text-blue-800"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "classes" && (
        <ClassesView
          key={version}
          refreshSignal={refreshSignal + version}
          onCreate={() => setTab("create")}
        />
      )}
      {tab === "create" && (
        <CreateClassPanel
          onCreated={() => {
            setVersion((n) => n + 1);
          }}
        />
      )}
      {tab === "sections" && <SectionsPanel key={version} />}
    </div>
  );
}
