import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const PREVIEW_VIDEO = "/video/open-home-hero-preview.mp4";
export const PREVIEW_POSTER = "/video/open-home-hero-preview-poster.jpg";

// The 45-second walkthrough, shown in a phone-shaped frame. The captions are
// part of the video itself, so it is readable without sound.
export function PreviewPlayer({ className = "" }: { className?: string }) {
  return (
    <figure className={`mx-auto w-full max-w-[300px] ${className}`}>
      <div className="overflow-hidden rounded-[2rem] border-[10px] border-navy bg-navy shadow-lg">
        <video
          className="aspect-[9/16] w-full bg-navy"
          controls
          playsInline
          preload="metadata"
          poster={PREVIEW_POSTER}
          aria-label="A 45-second preview of Open Home Hero collecting rental applications"
        >
          <source src={PREVIEW_VIDEO} type="video/mp4" />
          Your browser can&apos;t play this video. Scroll down to see the sample
          forms and dashboard instead.
        </video>
      </div>
      <figcaption className="mt-4 text-center text-xs text-ink-soft">
        45-second preview using sample data. Voice-over created with AI.
      </figcaption>
    </figure>
  );
}

export function VideoPreview() {
  return (
    <section id="preview" className="border-t border-line px-6 py-20">
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl font-medium text-ink">See it in action</h2>
          <p className="mt-3 max-w-md text-ink-soft">
            A 45-second walkthrough of how rental applications go from a visitor&apos;s
            phone to one organised list, with no paper forms and no re-typing.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button variant="primary">Start your free trial</Button>
            </Link>
            <Link href="/preview">
              <Button variant="secondary">Open the full preview page</Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink-soft">14-day free trial · No app for visitors</p>
        </div>
        <PreviewPlayer />
      </div>
    </section>
  );
}
