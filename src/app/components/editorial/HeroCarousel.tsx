import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { usePrefersReducedMotion } from './useMediaQuery';

export interface HeroImage {
  src: string;
  alt: string;
}

interface HeroCarouselProps {
  images: HeroImage[];
  interval?: number;
}

// Auto-cycling hero image carousel with a crossfade + subtle Ken-Burns zoom.
// Under reduced-motion it renders a single static image with no autoplay.
export default function HeroCarousel({ images, interval = 4500 }: HeroCarouselProps) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(id);
  }, [reduced, images.length, interval]);

  const frame = (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[18px] bg-paper-2 shadow-editorial-2">
      {reduced ? (
        <img
          src={images[0]?.src}
          alt={images[0]?.alt}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <AnimatePresence initial={false}>
          <motion.img
            key={index}
            src={images[index]?.src}
            alt={images[index]?.alt}
            loading={index === 0 ? 'eager' : 'lazy'}
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>
      )}

      {/* subtle warm wash for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/15 to-transparent" />

      {/* dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              data-cursor
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ease-editorial ${
                i === index ? 'w-6 bg-paper' : 'w-2 bg-paper/60 hover:bg-paper'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return frame;
}
