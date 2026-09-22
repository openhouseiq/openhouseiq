export function InstallAppSection() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        Add CueProperty to your Home Screen for quick, full-screen access —
        no app store needed. This is also required on iPhone before push
        notifications can be turned on.
      </p>

      <div className="rounded-md border border-line bg-white p-3 text-sm text-ink-soft">
        <p className="font-medium text-ink">iPhone</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>
            Open this site in <span className="font-medium">Safari</span> —
            not Chrome. iPhone only supports installing through Safari.
          </li>
          <li>
            Tap the Share icon, then{" "}
            <span className="font-medium">Add to Home Screen</span>.
          </li>
          <li>Open CueProperty from the new icon on your Home Screen.</li>
        </ol>
      </div>

      <div className="rounded-md border border-line bg-white p-3 text-sm text-ink-soft">
        <p className="font-medium text-ink">Android</p>
        <ol className="mt-1 list-decimal space-y-0.5 pl-4">
          <li>
            Open this site in <span className="font-medium">Chrome</span>.
          </li>
          <li>
            Tap the <span className="font-medium">⋮</span> menu, then{" "}
            <span className="font-medium">Add to Home screen</span> (or{" "}
            <span className="font-medium">Install app</span>).
          </li>
          <li>Open CueProperty from the new icon on your Home Screen.</li>
        </ol>
      </div>
    </div>
  );
}
