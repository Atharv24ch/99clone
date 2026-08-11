"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, Download } from "lucide-react";
import type { PropertyImage } from "@/types/property";

interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  }, []);

  const prevImage = useCallback(() => {
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const nextImage = useCallback(() => {
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, prevImage, nextImage, closeLightbox]);

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <div className="text-center">
          <ZoomIn className="mx-auto h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">No photos available</p>
        </div>
      </div>
    );
  }

  // Gallery layout: 1 big + 4 grid
  const [cover, ...rest] = images;

  return (
    <>
      {/* Grid layout */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-2xl overflow-hidden">
        {/* Cover image */}
        <button
          onClick={() => openLightbox(0)}
          className="col-span-2 row-span-2 relative overflow-hidden group"
          aria-label="View gallery"
          id="gallery-cover"
        >
          <Image
            src={cover!.cdnUrl}
            alt={`${title} - main photo`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-white font-medium bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1">
              1 / {images.length}
            </span>
          </div>
        </button>

        {/* Thumbnail grid */}
        {Array.from({ length: 4 }).map((_, i) => {
          const img = rest[i];
          const isLast = i === 3 && images.length > 5;

          return (
            <button
              key={i}
              onClick={() => openLightbox(i + 1)}
              className="relative overflow-hidden group"
              id={`gallery-thumb-${i}`}
              aria-label={`View photo ${i + 2}`}
            >
              {img ? (
                <>
                  <Image
                    src={img.thumbnailUrl ?? img.cdnUrl}
                    alt={`${title} - photo ${i + 2}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="25vw"
                  />
                  {isLast && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                      <div className="text-center text-white">
                        <p className="text-lg font-bold">+{images.length - 5}</p>
                        <p className="text-xs">More photos</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </>
              ) : (
                <div className="h-full bg-slate-100" />
              )}
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Image gallery"
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 z-10 rounded-xl p-2 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {activeIndex + 1} / {images.length}
          </div>

          {/* Prev */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-2xl p-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Active image */}
          <div className="relative h-[80vh] w-[90vw] max-w-5xl">
            <Image
              src={images[activeIndex]!.cdnUrl}
              alt={`${title} - photo ${activeIndex + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
              priority
            />
          </div>

          {/* Next */}
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-2xl p-3 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Thumbnail strip */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-lg px-4">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={[
                  "relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-xl transition-all",
                  i === activeIndex
                    ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-black"
                    : "opacity-50 hover:opacity-80",
                ].join(" ")}
              >
                <Image
                  src={img.thumbnailUrl ?? img.cdnUrl}
                  alt={`Thumb ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
