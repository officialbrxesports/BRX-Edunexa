"use client";

import { useEffect, useState } from "react";

export type PhotoSignValue = { photo: File | null; sign: File | null };

export const EMPTY_PS: PhotoSignValue = { photo: null, sign: null };

/** Shrinks a photo / signature to a small JPEG so it is always under the 2 MB upload limit. */
export async function shrinkImage(file: File, maxSide: number): Promise<File> {
  if (!/^image\/(jpeg|png)$/.test(file.type)) {
    throw new Error("Please choose a JPG or PNG image.");
  }

  const url = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();

      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not read this image."));
      image.src = url;
    });

    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));

    const context = canvas.getContext("2d");

    if (!context) throw new Error("Could not process this image.");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.88),
    );

    if (!blob) throw new Error("Could not process this image.");

    return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "image"}.jpg`, {
      type: "image/jpeg",
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Slot({
  label,
  hint,
  file,
  maxSide,
  wide,
  onChange,
}: {
  label: string;
  hint: string;
  file: File | null;
  maxSide: number;
  wide?: boolean;
  onChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      const reset = window.setTimeout(() => setPreview(""), 0);

      return () => window.clearTimeout(reset);
    }

    const url = URL.createObjectURL(file);
    const show = window.setTimeout(() => setPreview(url), 0);

    return () => {
      window.clearTimeout(show);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <div className="flex items-center gap-3 border border-slate-200 bg-white p-3">
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-slate-300 bg-slate-50 text-[10px] text-slate-400 ${
          wide ? "h-16 w-28" : "h-24 w-20"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          "No file"
        )}
      </div>
      <div className="min-w-0 text-xs">
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="mt-0.5 text-slate-500">{hint}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer bg-blue-800 px-3 py-1.5 font-semibold text-white hover:bg-blue-900">
            {file ? "Change" : "Choose file"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(event) => {
                const chosen = event.target.files?.[0];

                event.target.value = "";
                if (!chosen) return;
                setError("");
                shrinkImage(chosen, maxSide)
                  .then(onChange)
                  .catch((err) =>
                    setError(err instanceof Error ? err.message : "Could not use this image."),
                  );
              }}
            />
          </label>
          {file && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Remove
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-red-700">{error}</p>}
      </div>
    </div>
  );
}

export function PhotoSignaturePicker({
  value,
  onChange,
}: {
  value: PhotoSignValue;
  onChange: (value: PhotoSignValue) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-slate-700">Photo and signature (JPG or PNG)</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Slot
          label="Passport size photo"
          hint="Clear face photo, plain background."
          file={value.photo}
          maxSide={800}
          onChange={(photo) => onChange({ ...value, photo })}
        />
        <Slot
          label="Signature"
          hint="Sign on white paper and upload a photo of it."
          file={value.sign}
          maxSide={900}
          wide
          onChange={(sign) => onChange({ ...value, sign })}
        />
      </div>
    </div>
  );
}

/**
 * Uploads the chosen photo and signature to an application's documents endpoint.
 * Returns null when everything worked, or a short message to show the user.
 */
export async function uploadPhotoSign(options: {
  url: string;
  fields?: Record<string, string>;
  photoType: string;
  value: PhotoSignValue;
  credentials?: boolean;
}): Promise<string | null> {
  const jobs: [string, string, File | null][] = [
    ["Photo", options.photoType, options.value.photo],
    ["Signature", "SIGNATURE", options.value.sign],
  ];
  const problems: string[] = [];

  for (const [label, type, file] of jobs) {
    if (!file) continue;

    try {
      const form = new FormData();

      for (const [key, val] of Object.entries(options.fields ?? {})) {
        form.append(key, val);
      }

      form.append("type", type);
      form.append("file", file);

      const response = await fetch(options.url, {
        method: "POST",
        body: form,
        credentials: options.credentials ? "include" : "omit",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        problems.push(
          `${label}: ${
            Array.isArray(data.message) ? data.message.join(", ") : data.message || "upload failed"
          }`,
        );
      }
    } catch {
      problems.push(`${label}: upload failed`);
    }
  }

  return problems.length > 0
    ? `Saved, but ${problems.join("; ")}. You can upload it again from the documents list.`
    : null;
}
