"use client";

import Image from "next/image";
import { useState } from "react";

// Shows our own thumbnail and only loads YouTube (privacy-enhanced player)
// when the visitor presses play, so the page stays fast and sets no YouTube
// cookies until then.
export function YouTubeVideo({ id, title, thumbnail }: { id: string; title: string; thumbnail: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-navy shadow-lg">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full"
          aria-label={`Play video: ${title}`}
        >
          <Image src={thumbnail} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          <span className="absolute bottom-[5%] left-1/2 flex h-12 w-12 -translate-x-1/2 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-brass shadow-lg transition group-hover:scale-110">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-ink sm:h-7 sm:w-7" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
