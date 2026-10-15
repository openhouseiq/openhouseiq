"use client";

import { useState } from "react";

type Status = "idle" | "qr" | "link" | "failed";

// Copy the listing's QR code (as an image) or its visitor link, ready to paste
// into a flyer design or an online listing. Download stays available as a fallback.
export function CopyQrButtons({
  qrDataUrl,
  visitUrl,
  downloadName,
}: {
  qrDataUrl: string;
  visitUrl: string;
  downloadName: string;
}) {
  const [status, setStatus] = useState<Status>("idle");

  function flash(next: Status) {
    setStatus(next);
    setTimeout(() => setStatus("idle"), 2500);
  }

  async function copyQr() {
    try {
      const blob = await (await fetch(qrDataUrl)).blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      flash("qr");
    } catch {
      flash("failed");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(visitUrl);
      flash("link");
    } catch {
      flash("failed");
    }
  }

  const base =
    "rounded-md px-4 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90";
  const secondary = `${base} border border-line bg-white`;
  const primary = `${base} bg-brass`;

  return (
    <div className="mt-3">
      <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
        <button type="button" onClick={copyQr} className={primary}>
          {status === "qr" ? "QR code copied" : "Copy QR code"}
        </button>
        <button type="button" onClick={copyLink} className={secondary}>
          {status === "link" ? "Link copied" : "Copy link"}
        </button>
        <a href={qrDataUrl} download={downloadName} className={secondary}>
          Download
        </a>
      </div>
      {status === "failed" ? (
        <p className="mt-2 text-xs text-error">
          Your browser blocked copying. Use Download instead.
        </p>
      ) : null}
    </div>
  );
}
