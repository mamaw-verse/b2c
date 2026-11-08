import { usePage } from '@inertiajs/react';
import {
    ChevronDown,
    Facebook,
    Instagram,
    Mail,
    ShieldCheck,
    Truck,
    Wallet,
    Youtube,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FooterLink } from '@/types/navigation';

const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
};

const linkCls =
    'inline-flex min-h-9 items-center text-muted-foreground hover:text-primary-text';

function FooterLinkItem({ link, brand }: { link: FooterLink; brand: string }) {
    return (
        <li>
            <a href={link.href} className={linkCls}>
                {link.label.replace('{brand}', brand)}
            </a>
        </li>
    );
}

function FooterGroup({
    heading,
    links,
    brand,
}: {
    heading: string;
    links: FooterLink[];
    brand: string;
}) {
    const [open, setOpen] = useState(false);
    const list = (
        <ul className={cn('flex-col gap-1', open ? 'flex' : 'hidden sm:flex')}>
            {links.map((link) => (
                <FooterLinkItem key={link.label} link={link} brand={brand} />
            ))}
        </ul>
    );

    return (
        <nav aria-label={heading} className="sm:flex sm:flex-col sm:gap-2">
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="flex min-h-touch w-full items-center justify-between gap-2 text-left text-label text-foreground sm:hidden"
            >
                {heading}
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'shrink-0 text-muted-foreground transition-transform duration-token',
                        open && 'rotate-180',
                    )}
                />
            </button>
            <p className="hidden text-label text-foreground sm:block">
                {heading}
            </p>
            {list}
        </nav>
    );
}

export function SiteFooter() {
    const { name, marketplace: m } = usePage().props;

    const groups: [string, FooterLink[]][] = (
        [
            ['Shop', m.footer.shop],
            ['Support', m.footer.support],
            ['Halal & trust', m.footer.trust],
            ['Sell', m.footer.sell],
            ['Company', m.footer.company],
        ] as [string, FooterLink[]][]
    ).map(([h, links]) => [h, links.filter((l) => l.href)]);

    return (
        <footer className="border-t border-border bg-surface-subtle pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] md:pb-0">
            <div className="page">
                {/* Trust strip — renders only for configured values; no
                    unbacked claims. */}
                {(m.claims.halal_verification ||
                    m.payments.length > 0 ||
                    m.couriers.length > 0) && (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border py-4">
                        {m.claims.halal_verification && (
                            <p className="flex items-center gap-2 text-body-sm font-medium text-foreground">
                                <ShieldCheck
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-halal"
                                />
                                Every halal claim is verified by {name}
                            </p>
                        )}
                        {m.payments.length > 0 && (
                            <p className="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                                <Wallet aria-hidden="true" className="size-4" />
                                <span className="sr-only">
                                    Accepted payments:
                                </span>
                                {m.payments.map((p) => (
                                    <span
                                        key={p}
                                        className="rounded-badge border border-border bg-surface px-1.5 py-0.5"
                                    >
                                        {p}
                                    </span>
                                ))}
                            </p>
                        )}
                        {m.couriers.length > 0 && (
                            <p className="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                                <Truck aria-hidden="true" className="size-4" />
                                <span className="sr-only">
                                    Delivery partners:
                                </span>
                                {m.couriers.map((c) => (
                                    <span
                                        key={c}
                                        className="rounded-badge border border-border bg-surface px-1.5 py-0.5"
                                    >
                                        {c}
                                    </span>
                                ))}
                            </p>
                        )}
                    </div>
                )}

                {/* Link columns (accordions below 640px) */}
                <div className="grid gap-y-1 py-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-8 sm:py-8 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))]">
                    <div className="flex flex-col gap-3">
                        <p
                            className="text-label text-foreground"
                            data-edge="start"
                        >
                            {name}
                        </p>
                        <p className="max-w-xs text-body-sm text-muted-foreground">
                            {m.tagline}
                        </p>
                        <ul className="flex gap-1">
                            {m.socials.map((s) => {
                                const Icon =
                                    socialIcons[
                                        s.icon as keyof typeof socialIcons
                                    ];
                                return (
                                    <li key={s.label}>
                                        <a
                                            href={s.href}
                                            aria-label={`${name} on ${s.label}`}
                                            className="btn btn-icon btn-ghost text-muted-foreground"
                                        >
                                            {Icon && (
                                                <Icon
                                                    aria-hidden="true"
                                                    className="size-5"
                                                />
                                            )}
                                            <span className="sr-only">
                                                {s.label}
                                            </span>
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                        {(m.support.email || m.support.hours) && (
                            <p className="flex items-start gap-2 text-body-sm text-muted-foreground">
                                <Mail
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0"
                                />
                                <span>
                                    {m.support.email && (
                                        <>
                                            <a
                                                href={`mailto:${m.support.email}`}
                                                className="underline underline-offset-2 hover:text-primary-text"
                                            >
                                                {m.support.email}
                                            </a>
                                            <br />
                                        </>
                                    )}
                                    {m.support.hours}
                                </span>
                            </p>
                        )}
                    </div>
                    {groups.map(([heading, links]) =>
                        links.length > 0 ? (
                            <FooterGroup
                                key={heading}
                                heading={heading}
                                links={links}
                                brand={name}
                            />
                        ) : null,
                    )}
                </div>

                {/* Legal bar */}
                {m.registration && (
                    <div className="flex flex-col gap-1 border-t border-border py-4 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <p>{m.registration}</p>
                    </div>
                )}
            </div>
        </footer>
    );
}
