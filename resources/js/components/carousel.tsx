import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Media } from '@/components/media';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type CarouselSlide = {
    label: string;
    icon?: string;
    src?: string | null;
    type?: 'image' | 'video';
};

type CarouselProps = {
    slides: CarouselSlide[];
    thumbs?: boolean;
    zoom?: boolean;
    label?: string;
    ratio?: string;
    rounded?: string;
};

/** Scroll-snap carousel: prev/next on hover pointers, thumbnails, counter, zoom dialog. */
export function Carousel({
    slides,
    thumbs = true,
    zoom = true,
    label = 'Product photos',
    ratio = 'aspect-square',
    rounded = 'rounded-panel',
}: CarouselProps) {
    const trackRef = useRef<HTMLUListElement>(null);
    const [current, setCurrent] = useState(0);

    const goTo = useCallback((index: number) => {
        const track = trackRef.current;
        const target = track?.children[index] as HTMLElement | undefined;
        target?.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        setCurrent(index);
    }, []);

    const onScroll = () => {
        const track = trackRef.current;
        if (!track) {
            return;
        }
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setCurrent(Math.min(index, slides.length - 1));
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') {
            goTo(Math.min(current + 1, slides.length - 1));
        } else if (e.key === 'ArrowLeft') {
            goTo(Math.max(current - 1, 0));
        }
    };

    useEffect(() => {
        const track = trackRef.current;
        if (!track) {
            return;
        }
        const slideElements = track.children;
        for (let i = 0; i < slideElements.length; i++) {
            if (i !== current) {
                const video = slideElements[i]?.querySelector('video');
                if (video && !video.paused) {
                    video.pause();
                }
            }
        }
    }, [current]);

    const navBtn =
        'btn btn-icon btn-neutral absolute top-1/2 hidden -translate-y-1/2 rounded-full border-transparent shadow-popover [@media(hover:hover)]:inline-flex disabled:hidden';

    const showThumbs = thumbs && slides.length > 1;

    return (
        <section
            aria-roledescription="carousel"
            aria-label={label}
            className={cn('grid', showThumbs && 'gap-2')}
        >
            <div className="relative">
                <ul
                    ref={trackRef}
                    tabIndex={0}
                    aria-label={`${label}, use arrow keys`}
                    onScroll={onScroll}
                    onKeyDown={onKeyDown}
                    className={cn(
                        'flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain',
                        rounded,
                    )}
                >
                    {slides.map((slide, i) => (
                        <li
                            key={i}
                            aria-roledescription="slide"
                            aria-label={`${i + 1} of ${slides.length}`}
                            className="w-full shrink-0 snap-center"
                        >
                            {slide.type === 'video' ? (
                                <div
                                    className={cn(
                                        'relative grid place-items-center overflow-hidden bg-surface-muted',
                                        ratio,
                                        rounded,
                                    )}
                                >
                                    <video
                                        controls
                                        playsInline
                                        preload="metadata"
                                        src={
                                            slide.src
                                                ? `${slide.src}#t=0.1`
                                                : undefined
                                        }
                                        aria-label={slide.label}
                                        className="size-full object-contain"
                                    />
                                </div>
                            ) : (
                                <Media
                                    label={slide.label}
                                    icon={slide.icon ?? 'package'}
                                    src={slide.src}
                                    index={i}
                                    ratio={ratio}
                                    className={rounded}
                                />
                            )}
                        </li>
                    ))}
                </ul>
                {slides.length > 1 && (
                    <p
                        aria-hidden="true"
                        className="tabular absolute right-2 bottom-2 rounded-full bg-surface-inverse px-2 py-0.5 text-caption text-foreground-inverse"
                    >
                        {current + 1} of {slides.length}
                    </p>
                )}
                {zoom && slides[current]?.type !== 'video' && (
                    <Dialog>
                        <DialogTrigger
                            className="btn btn-icon btn-neutral absolute top-2 right-2 rounded-full border-transparent shadow-popover"
                            aria-label="Zoom photo"
                        >
                            <ZoomIn aria-hidden="true" />
                        </DialogTrigger>
                        <DialogContent
                            showClose={false}
                            className="m-0 h-dvh max-h-dvh w-screen max-w-none bg-surface-inverse p-0"
                        >
                            <DialogTitle className="sr-only">
                                Zoomed photo
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                {slides[current]?.label}
                            </DialogDescription>
                            <div className="on-inverse flex h-full flex-col">
                                <div className="flex justify-end p-2 pt-safe">
                                    <DialogClose
                                        className="btn btn-icon btn-inverse rounded-full border-transparent"
                                        aria-label="Close"
                                        autoFocus
                                    >
                                        <X aria-hidden="true" />
                                    </DialogClose>
                                </div>
                                <div className="grid flex-1 place-items-center overflow-auto p-4">
                                    <Media
                                        label={slides[current]?.label ?? label}
                                        icon={slides[current]?.icon}
                                        src={slides[current]?.src}
                                        className="max-w-2xl rounded-panel"
                                    />
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
                <button
                    type="button"
                    className={cn(navBtn, 'left-2')}
                    aria-label="Previous photo"
                    disabled={current === 0}
                    onClick={() => goTo(current - 1)}
                >
                    <ChevronLeft aria-hidden="true" />
                </button>
                <button
                    type="button"
                    className={cn(navBtn, 'right-2')}
                    aria-label="Next photo"
                    disabled={current === slides.length - 1}
                    onClick={() => goTo(current + 1)}
                >
                    <ChevronRight aria-hidden="true" />
                </button>
            </div>
            {showThumbs && (
                <ul
                    aria-label="Thumbnails"
                    className="bleed-x flex gap-2 overflow-x-auto"
                >
                    {slides.map((slide, i) => (
                        <li key={i} className="shrink-0">
                            <button
                                type="button"
                                aria-current={i === current}
                                aria-label={
                                    slide.type === 'video'
                                        ? 'Show product video'
                                        : `Show photo ${i + 1}: ${slide.label}`
                                }
                                onClick={() => goTo(i)}
                                className="block size-14 overflow-hidden rounded-tile border-2 border-transparent aria-[current=true]:border-primary md:size-16"
                            >
                                {slide.type === 'video' ? (
                                    <div
                                        aria-label="Product video"
                                        className="text-foreground-muted flex size-full items-center justify-center bg-surface-muted"
                                    >
                                        <Play
                                            className="size-6 fill-current"
                                            aria-hidden="true"
                                        />
                                    </div>
                                ) : (
                                    <Media
                                        label={slide.label}
                                        icon={slide.icon ?? 'package'}
                                        src={slide.src}
                                        index={i}
                                        decorative
                                    />
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
