"use client";

import { useCallback, useEffect, useState } from "react";

export const SCHOOL_PHOTOS = [
  {
    src: "/images/IMG_4505.PNG",
    alt: "Children lined up on the compound in front of EBOMI Nursery and Primary School.",
    caption: "Assembly on the compound",
  },
  {
    src: "/images/IMG_4493.PNG",
    alt: "Nursery 1 children in orange school polo shirts, holding a class sign.",
    caption: "Nursery 1",
  },
  {
    src: "/images/IMG_4499.PNG",
    alt: "Primary Three children on the compound, one holding a handwritten class sign.",
    caption: "Primary Three",
  },
  {
    src: "/images/IMG_4497.PNG",
    alt: "Primary children holding drawings of the Nigerian flag.",
    caption: "Primary, civic day",
  },
  {
    src: "/images/IMG_4506.PNG",
    alt: "Children in green and white ceremonial dress walking on the compound.",
    caption: "A school day on the grounds",
  },
  {
    src: "/images/IMG_4503.PNG",
    alt: "Staff and families in traditional dress on the school compound.",
    caption: "Staff and families",
  },
  {
    src: "/images/IMG_4495.PNG",
    alt: "Nursery 1 children gathered on the compound.",
    caption: "Nursery 1 on the compound",
  },
] as const;

export function Slideshow({ className = "" }: { className?: string }) {
  const photos = SCHOOL_PHOTOS;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const current = photos[index];

  const go = useCallback((direction: number) => {
    setIndex((value) => (value + direction + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const timer = window.setInterval(() => go(1), 5000);
    return () => window.clearInterval(timer);
  }, [paused, go]);

  return (
    <figure
      className={`relative overflow-hidden rounded-lg bg-moss-deep ${className}`}
      aria-roledescription="carousel"
      aria-label="Photographs of EBOMI Highschool International"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative aspect-[16/10]">
        {photos.map((photo, photoIndex) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={photoIndex === index ? photo.alt : ""}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${photoIndex === index ? "opacity-100" : "opacity-0"}`}
            loading={photoIndex === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-10 pt-16">
          <figcaption className="font-serif text-lg text-white" aria-live="polite">
            {current.caption}
          </figcaption>
        </div>
        <button
          type="button"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-md bg-black/45 px-2 py-1 text-lg text-white"
          aria-label="Previous photograph"
          onClick={() => go(-1)}
        >
          ‹
        </button>
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-black/45 px-2 py-1 text-lg text-white"
          aria-label="Next photograph"
          onClick={() => go(1)}
        >
          ›
        </button>
        <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {photos.map((photo, photoIndex) => (
            <button
              key={photo.src}
              type="button"
              aria-label={`Show photograph ${photoIndex + 1}`}
              aria-current={photoIndex === index ? true : undefined}
              className={`h-2 w-2 rounded-full ${photoIndex === index ? "bg-gold-soft" : "bg-white/50"}`}
              onClick={() => setIndex(photoIndex)}
            />
          ))}
        </div>
      </div>
    </figure>
  );
}
