"use client";

import {
  isFieldVisible,
  marksSkipped,
  percentOf,
  type AdmissionProfile,
  type Details,
  type MarkRow,
  type ProfileField,
} from "../../lib/admissionProfiles";

type Props = {
  profile: AdmissionProfile;
  details: Details;
  onChange: (next: Details) => void;
};

const inputClass =
  "mt-1 h-10 w-full rounded border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100";

/* Renders every class-specific section of the chosen form. */
export default function AdmissionClassFields({
  profile,
  details,
  onChange,
}: Props) {
  function set(key: string, value: Details[string]) {
    onChange({ ...details, [key]: value });
  }

  function renderField(field: ProfileField) {
    const raw = details[field.key];
    const value = typeof raw === "string" || typeof raw === "number" ? String(raw) : "";
    const wide =
      field.type === "textarea" || field.type === "multi"
        ? "sm:col-span-2 lg:col-span-3"
        : "";

    const label = (
      <span>
        {field.label}
        {field.required && <span className="text-red-600"> *</span>}
      </span>
    );

    const hint = field.hint ? (
      <span className="mt-1 block text-[10px] font-normal text-slate-500">
        {field.hint}
      </span>
    ) : null;

    if (field.type === "multi") {
      const picked = Array.isArray(raw) ? (raw as string[]) : [];

      return (
        <div key={field.key} className={`text-xs font-semibold text-slate-600 ${wide}`}>
          {label}
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(field.options || []).map((option) => {
              const checked = picked.includes(option);
              const full = !checked && !!field.pick && picked.length >= field.pick;

              return (
                <label
                  key={option}
                  className={`flex items-center gap-2 rounded border p-2 font-normal ${
                    checked ? "border-blue-700 bg-blue-50" : "border-slate-200"
                  } ${full ? "opacity-50" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={full}
                    onChange={() =>
                      set(
                        field.key,
                        checked
                          ? picked.filter((p) => p !== option)
                          : [...picked, option],
                      )
                    }
                  />
                  {option}
                </label>
              );
            })}
          </div>
          {field.pick && (
            <span className="mt-1 block text-[10px] font-normal text-slate-500">
              Selected {picked.length} of {field.pick}
            </span>
          )}
        </div>
      );
    }

    if (field.type === "select" || field.type === "yesno") {
      const options = field.type === "yesno" ? ["Yes", "No"] : field.options || [];

      return (
        <label key={field.key} className={`block text-xs font-semibold text-slate-600 ${wide}`}>
          {label}
          <select
            value={value}
            onChange={(event) => set(field.key, event.target.value)}
            className={inputClass}
          >
            <option value="">Select</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {hint}
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.key} className={`block text-xs font-semibold text-slate-600 ${wide}`}>
          {label}
          <textarea
            rows={2}
            maxLength={field.maxLength || 300}
            value={value}
            onChange={(event) => set(field.key, event.target.value)}
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          {hint}
        </label>
      );
    }

    return (
      <label key={field.key} className={`block text-xs font-semibold text-slate-600 ${wide}`}>
        {label}
        <input
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          min={field.min}
          max={field.max}
          maxLength={field.maxLength}
          value={value}
          onChange={(event) =>
            set(field.key, field.upper ? event.target.value.toUpperCase() : event.target.value)
          }
          className={inputClass}
        />
        {hint}
      </label>
    );
  }

  function updateMark(index: number, key: "obtained" | "max", value: string) {
    const rows = Array.isArray(details.marks) ? [...(details.marks as MarkRow[])] : [];

    rows[index] = { ...rows[index], [key]: value };
    set("marks", rows);
  }

  return (
    <div className="space-y-5">
      {profile.sections.map((section) => {
        const rows = Array.isArray(details.marks) ? (details.marks as MarkRow[]) : [];
        const showMarks = section.marks && !marksSkipped(section.marks, details);
        const percent = percentOf(rows);

        // Class 9 style totals: show percentage live.
        const totalMax = Number(details.marksMax);
        const totalGot = Number(details.marksObtained);
        const livePercent =
          totalMax > 0 && Number.isFinite(totalGot) && details.marksObtained !== undefined
            ? ((totalGot / totalMax) * 100).toFixed(2)
            : "";

        return (
          <div key={section.id} className="rounded border border-slate-200 p-3">
            <h5 className="mb-3 text-sm font-bold text-slate-800">{section.title}</h5>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {section.fields.filter((f) => isFieldVisible(f, details)).map(renderField)}
            </div>

            {section.id === "class8" && livePercent && (
              <p className="mt-2 text-xs font-semibold text-emerald-700">
                Percentage: {livePercent}%
              </p>
            )}

            {section.marks && showMarks && (
              <div className="mt-4 overflow-x-auto">
                <p className="mb-1 text-xs font-semibold text-slate-600">
                  {section.marks.title} (enter at least 5 subjects)
                </p>
                <table className="w-full min-w-96 border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 p-2 text-left">Subject</th>
                      <th className="w-24 border border-slate-200 p-2 text-left">Max</th>
                      <th className="w-28 border border-slate-200 p-2 text-left">Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={row.subject}>
                        <td className="border border-slate-200 p-2">{row.subject}</td>
                        <td className="border border-slate-200 p-1">
                          <input
                            type="number"
                            min={1}
                            value={String(row.max)}
                            onChange={(e) => updateMark(index, "max", e.target.value)}
                            className="h-8 w-full rounded border border-slate-200 px-2"
                          />
                        </td>
                        <td className="border border-slate-200 p-1">
                          <input
                            type="number"
                            min={0}
                            value={String(row.obtained)}
                            onChange={(e) => updateMark(index, "obtained", e.target.value)}
                            className="h-8 w-full rounded border border-slate-200 px-2"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {percent && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    Percentage: {percent}%
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
