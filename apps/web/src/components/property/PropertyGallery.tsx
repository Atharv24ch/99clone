"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

import type { PropertyImage } from "@/types/property";
import { GuillocheRosette } from "@/components/paper/Guilloche";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  const show = (i: number) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setIndex(i);
    setOpen(true);
  };
  const close = useCallback(() => {
    setOpen(false);
    returnFocus.current?.focus();
  }, []);
  const prev = useCallback(() => setIndex((i) => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setIndex((i) => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, prev, next, close]);

  if (images.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center gap-4 rounded-sheet border border-dashed border-stamp/40 bg-paper-sheet text-stamp/50 sm:h-72">
        <GuillocheRosette className="h-24 w-24" size={160} />
        <p className="text-sm text-ink-soft">The lister hasn&apos;t added photos yet.</p>
      </div>
    );
  }

  const [cover, ...rest] = images;
  const thumbs = rest.slice(0, 4);

  return (
    <>
      <div className={`grid h-[300px] gap-2 overflow-hidden rounded-sheet sm:h-[440px] ${thumbs.length ? "grid-cols-4 grid-rows-2" : "grid-cols-1"}`}>
        <button
          type="button"
          onClick={() => show(0)}
          className={`group relative overflow-hidden bg-paper-deep ${thumbs.length ? "col-span-4 row-span-2 sm:col-span-2" : ""}`}
          aria-label={`Open photo 1 of ${images.length}`}
        >
          <Image src={cover!.cdnUrl} alt={`${title}, photo 1`} fill priority unoptimized sizes="(max-width: 640px) 100vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
        </button>
        {thumbs.map((img, i) => (
          <button
            key={img.id}
            type="button"
            onClick={() => show(i + 1)}
            className="group relative hidden overflow-hidden bg-paper-deep sm:block"
            aria-label={`Open photo ${i + 2} of ${images.length}`}
          >
            <Image src={img.thumbnailUrl ?? img.cdnUrl} alt={`${title}, photo ${i + 2}`} fill unoptimized sizes="25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
            {i === thumbs.length - 1 && images.length > 5 && (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-[15px] font-semibold text-paper-sheet">
                +{images.length - 5} more
              </span>
            )}
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <button type="button" onClick={() => show(0)} className="btn-quiet mt-2 text-sm">
          <Images className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          All {images.length} photos
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-ink/95" role="dialog" aria-modal="true" aria-label={`${title} photos`}>
          <div className="flex items-center justify-between px-4 py-3 text-paper-sheet">
            <span className="tabular text-sm">{index + 1} / {images.length}</span>
            <button ref={closeRef} type="button" onClick={close} className="rounded-sheet p-2 hover:bg-white/10" aria-label="Close photos">
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="relative flex-1">
            <Image src={images[index]!.cdnUrl} alt={`${title}, photo ${index + 1}`} fill unoptimized sizes="100vw" className="object-contain" />
            {images.length > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-sheet bg-ink/60 p-3 text-paper-sheet hover:bg-ink" aria-label="Previous photo">
                  <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                </button>
                <button type="button" onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sheet bg-ink/60 p-3 text-paper-sheet hover:bg-ink" aria-label="Next photo">
                  <ChevronRight className="h-6 w-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
          <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3">
            {images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-sheet ${i === index ? "ring-2 ring-paper-sheet" : "opacity-50 hover:opacity-90"}`}
              >
                <Image src={img.thumbnailUrl ?? img.cdnUrl} alt="" fill unoptimized sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
