import { Flag, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import { Media } from '@/components/media';
import { NameAvatar } from '@/components/name-avatar';
import { Rating } from '@/components/rating';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';

export type ReviewData = {
    name: string;
    value: number;
    variation?: string;
    date: string;
    text?: string;
    photos?: number;
    helpful?: number;
    reply?: string;
    anonymous?: boolean;
};

export function ReviewCard({
    review: r,
    onReport,
}: {
    review: ReviewData;
    onReport?: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const isLong = (r.text?.length ?? 0) > 240;

    return (
        <article className="grid gap-2 border-b border-border py-4 last:border-0">
            <div className="flex items-center gap-3">
                <NameAvatar
                    name={r.anonymous ? 'Anonymous' : r.name}
                    size="sm"
                    label={false}
                />
                <div className="grid gap-0.5">
                    <p className="text-label">
                        {r.anonymous ? 'a*****z' : r.name}
                    </p>
                    <Rating value={r.value} size="size-3.5" showValue={false} />
                </div>
            </div>
            {r.variation && (
                <p className="text-body-sm text-muted-foreground">
                    Variation: {r.variation}
                </p>
            )}
            {r.text && (
                <>
                    <p
                        className={
                            isLong && !expanded
                                ? 'line-clamp-4 text-body'
                                : 'text-body'
                        }
                    >
                        {r.text}
                    </p>
                    {isLong && (
                        <button
                            type="button"
                            aria-expanded={expanded}
                            onClick={() => setExpanded(!expanded)}
                            className="w-fit text-label text-primary-text"
                        >
                            {expanded ? 'See less' : 'See more'}
                        </button>
                    )}
                </>
            )}
            {r.photos ? (
                <ul className="flex gap-2" aria-label="Review photos">
                    {Array.from({ length: r.photos }, (_, n) => (
                        <li key={n}>
                            <button
                                type="button"
                                className="block size-20 overflow-hidden rounded-tile"
                                aria-label={`Open photo ${n + 1} of ${r.photos}`}
                            >
                                <Media
                                    label="Review photo"
                                    icon="image"
                                    index={n + 1}
                                    decorative
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            <div className="flex items-center justify-between gap-2">
                <p className="text-body-sm text-muted-foreground">
                    <time>{r.date}</time>
                </p>
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        aria-pressed={false}
                        icon={
                            <ThumbsUp aria-hidden="true" className="size-4" />
                        }
                    >
                        Helpful ({r.helpful ?? 0})
                    </Button>
                    <IconButton
                        size="sm"
                        icon={<Flag aria-hidden="true" />}
                        label="Report review"
                        className="text-muted-foreground"
                        onClick={onReport}
                    />
                </div>
            </div>
            {r.reply && (
                <div className="rounded-tile bg-surface-muted p-3">
                    <p className="text-label">Seller’s response</p>
                    <p className="mt-1 text-body text-muted-foreground">
                        {r.reply}
                    </p>
                </div>
            )}
        </article>
    );
}
