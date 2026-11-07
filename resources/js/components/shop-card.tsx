import { Link } from '@inertiajs/react';
import { NameAvatar } from '@/components/name-avatar';
import { VerifiedBadge } from '@/components/verified-badge';
import { DsIcon } from '@/components/ds-icon';
import { Button } from '@/components/ui/button';
import { compactCount } from '@/lib/format';
import type { ShopData } from '@/types/catalogue';
import { show as shopShow } from '@/routes/shops';

export function ShopCard({ shop: s }: { shop: ShopData }) {
    return (
        <article className="card relative flex items-center gap-3 p-3">
            {s.logo_url ? (
                <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-tile border border-border bg-surface p-1">
                    <img
                        src={s.logo_url}
                        alt={s.name}
                        className="size-full object-contain"
                    />
                </span>
            ) : (
                <NameAvatar
                    name={s.name}
                    size="lg"
                    shape="tile"
                    label={false}
                />
            )}
            <div className="min-w-0 flex-1">
                <h3 className="flex flex-wrap items-center gap-1.5 text-h4">
                    <Link
                        href={shopShow.url(s.slug)}
                        className="after:absolute after:inset-0"
                    >
                        {s.name}
                    </Link>
                    {s.verification === 'official' && (
                        <VerifiedBadge
                            label="Official"
                            tone="solid"
                            size="sm"
                        />
                    )}
                </h3>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-body-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                        <DsIcon
                            name="star"
                            className="size-3.5 fill-current stroke-0 text-rating"
                        />
                        <span className="font-bold text-foreground">
                            {s.rating}
                        </span>
                    </span>
                    <span>{compactCount(s.followers_count)} followers</span>
                    <span className="inline-flex items-center gap-1">
                        <DsIcon name="map-pin" className="size-3.5" />
                        {s.location}
                    </span>
                </p>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="relative z-10"
                tabIndex={-1}
                aria-hidden="true"
            >
                Visit
            </Button>
        </article>
    );
}
