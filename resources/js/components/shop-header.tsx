import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NameAvatar } from '@/components/name-avatar';
import { VerifiedBadge } from '@/components/verified-badge';
import { DsIcon } from '@/components/ds-icon';
import { compactCount } from '@/lib/format';
import type { ShopData } from '@/types/catalogue';

export function ShopHeader({
    shop: s,
    onChat,
    onReport,
}: {
    shop: ShopData;
    onChat?: () => void;
    onReport?: () => void;
}) {
    const stats: [string, string | number][] = [
        ['Rating', `${s.rating} / 5`],
        ['Followers', compactCount(s.followers_count)],
        ['Products', s.products_count ?? '—'],
        ['Chat reply', s.chat_response_rate ? `${s.chat_response_rate}%` : '—'],
    ];

    return (
        <section
            aria-labelledby="shop-name"
            className="overflow-hidden bg-surface md:rounded-panel md:border md:border-border"
        >
            {s.banner_url ? (
                <div className="relative h-24 overflow-hidden md:h-32">
                    <img
                        src={s.banner_url}
                        alt=""
                        aria-hidden="true"
                        className="size-full object-cover"
                    />
                </div>
            ) : (
                <div
                    aria-hidden="true"
                    className="pattern-geo h-20 bg-surface-inverse md:h-28"
                />
            )}
            <div className="-mt-8 grid gap-3 px-gutter pb-4 md:-mt-10 md:flex md:items-end md:gap-5 md:px-6">
                <span className="grid size-16 place-items-center overflow-hidden rounded-tile border-4 border-surface bg-surface shadow-xs md:size-20">
                    {s.logo_url ? (
                        <img
                            src={s.logo_url}
                            alt={s.name}
                            className="size-full object-contain p-1"
                        />
                    ) : (
                        <NameAvatar
                            name={s.name}
                            size="xl"
                            shape="tile"
                            label={false}
                        />
                    )}
                </span>
                <div className="min-w-0 flex-1 md:pb-1">
                    <h1
                        id="shop-name"
                        className="flex flex-wrap items-center gap-2 text-h2"
                    >
                        {s.name}
                        {s.verification === 'official' && (
                            <VerifiedBadge label="Official" tone="solid" />
                        )}
                        {s.halal_only && (
                            <Badge variant="halal">
                                <DsIcon name="moon-star" className="size-3.5" />
                                Halal-only shop
                            </Badge>
                        )}
                    </h1>
                    <p className="mt-1 flex items-center gap-1 text-body-sm text-muted-foreground">
                        <DsIcon name="map-pin" className="size-4" />
                        {s.location} ·{' '}
                        <span className="text-success">Active recently</span>
                    </p>
                </div>
                <div className="flex gap-2 md:pb-1">
                    <Button
                        icon={<DsIcon name="plus" />}
                        className="flex-1 md:flex-none"
                    >
                        Follow
                    </Button>
                    <Button
                        variant="outline"
                        icon={<DsIcon name="message-circle" />}
                        className="flex-1 md:flex-none"
                        onClick={onChat}
                    >
                        Chat
                    </Button>
                    {onReport && (
                        <Button
                            variant="ghost"
                            icon={<DsIcon name="flag" />}
                            className="hidden text-muted-foreground md:inline-flex"
                            onClick={onReport}
                        >
                            Report
                        </Button>
                    )}
                </div>
            </div>
            <dl className="grid grid-cols-4 border-t border-border text-center">
                {stats.map(([k, v]) => (
                    <div
                        key={k}
                        className="flex flex-col-reverse gap-0.5 px-1 py-3"
                    >
                        <dt className="text-caption text-muted-foreground">
                            {k}
                        </dt>
                        <dd className="tabular text-label">{v}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
