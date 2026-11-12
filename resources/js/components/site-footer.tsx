import { Link, usePage } from '@inertiajs/react';
import {
    ArrowUp,
    ChevronDown,
    Clock,
    Facebook,
    Headphones,
    Instagram,
    Mail,
    ShieldCheck,
    Truck,
    Wallet,
    Youtube,
} from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { cn } from '@/lib/utils';
import type { FooterLink } from '@/types/navigation';

const socialIcons = {
    facebook: Facebook,
    instagram: Instagram,
    youtube: Youtube,
};

function FooterLinkItem({ link, brand }: { link: FooterLink; brand: string }) {
    const label = link.label.replace('{brand}', brand);
    const isInternal = link.href.startsWith('/') && !link.href.startsWith('//');

    const linkClasses =
        'group inline-flex min-h-8 items-center text-body-sm text-muted-foreground transition-colors duration-token hover:text-primary-text focus-ring rounded-xs py-0.5';

    return (
        <li>
            {isInternal ? (
                <Link href={link.href} className={linkClasses}>
                    <span className="transition-transform duration-token group-hover:translate-x-0.5">
                        {label}
                    </span>
                </Link>
            ) : (
                <a
                    href={link.href}
                    className={linkClasses}
                    {...(link.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                >
                    <span className="transition-transform duration-token group-hover:translate-x-0.5">
                        {label}
                    </span>
                </a>
            )}
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
        <ul
            className={cn(
                'flex-col gap-1.5 pb-3 sm:pt-2 sm:pb-0',
                open ? 'flex' : 'hidden sm:flex',
            )}
        >
            {links.map((link) => (
                <FooterLinkItem key={link.label} link={link} brand={brand} />
            ))}
        </ul>
    );

    return (
        <nav
            aria-label={heading}
            className="border-b border-border/70 last:border-b-0 sm:flex sm:flex-col sm:border-0"
        >
            <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className="flex min-h-touch w-full items-center justify-between py-3 text-left text-body-sm font-semibold text-foreground transition-colors duration-token hover:text-primary-text sm:hidden"
            >
                <span>{heading}</span>
                <ChevronDown
                    aria-hidden="true"
                    className={cn(
                        'size-4 shrink-0 text-muted-foreground transition-transform duration-token',
                        open && 'rotate-180 text-primary-text',
                    )}
                />
            </button>
            <p className="hidden text-caption font-bold tracking-wider text-foreground uppercase sm:block">
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
                {/* Trust strip — renders only for configured values; no unbacked claims */}
                {(m.claims.halal_verification ||
                    m.payments.length > 0 ||
                    m.couriers.length > 0) && (
                    <div className="border-b border-border py-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {m.claims.halal_verification && (
                                <div className="flex items-center gap-3 rounded-card border border-halal/20 bg-halal-soft/40 p-3 sm:max-w-md">
                                    <div className="flex size-9 shrink-0 items-center justify-center rounded-button bg-halal/15 text-halal">
                                        <ShieldCheck
                                            aria-hidden="true"
                                            className="size-5"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-body-sm font-semibold text-foreground">
                                            Every halal claim is verified by{' '}
                                            {name}
                                        </p>
                                        <p className="text-caption text-muted-foreground">
                                            Strict certificate authentication &
                                            seller verification
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                                {m.payments.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                            <Wallet
                                                aria-hidden="true"
                                                className="size-4 text-primary"
                                            />
                                            <span>Payment</span>
                                        </span>
                                        <span className="sr-only">
                                            Accepted payments:
                                        </span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {m.payments.map((p) => (
                                                <span
                                                    key={p}
                                                    className="rounded-badge border border-border bg-surface px-2.5 py-1 text-caption font-medium text-foreground shadow-xs transition-colors duration-token hover:border-border-strong"
                                                >
                                                    {p}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {m.couriers.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
                                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                                            <Truck
                                                aria-hidden="true"
                                                className="size-4 text-primary"
                                            />
                                            <span>Delivery</span>
                                        </span>
                                        <span className="sr-only">
                                            Delivery partners:
                                        </span>
                                        <div className="flex flex-wrap items-center gap-1.5">
                                            {m.couriers.map((c) => (
                                                <span
                                                    key={c}
                                                    className="rounded-badge border border-border bg-surface px-2.5 py-1 text-caption font-medium text-foreground shadow-xs transition-colors duration-token hover:border-border-strong"
                                                >
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Link columns and brand introduction */}
                <div className="grid gap-8 py-8 sm:py-10 lg:grid-cols-12">
                    {/* Brand column */}
                    <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-4 xl:col-span-4">
                        <div>
                            <Link
                                href="/"
                                className="focus-ring inline-flex items-center rounded-sm"
                                aria-label={`${name} Home`}
                            >
                                <BrandMark name={name} className="h-8" />
                            </Link>
                        </div>

                        <p className="max-w-sm text-body-sm leading-relaxed text-muted-foreground">
                            {m.tagline}
                        </p>

                        {(m.support.email || m.support.hours) && (
                            <div className="mt-1 flex max-w-sm flex-col gap-1.5 rounded-card border border-border bg-surface p-3.5 shadow-xs">
                                <div className="flex items-center gap-2 text-caption font-semibold text-foreground">
                                    <Headphones
                                        aria-hidden="true"
                                        className="size-4 text-primary"
                                    />
                                    <span>Need assistance?</span>
                                </div>
                                {m.support.email && (
                                    <p className="flex items-center gap-1.5 text-body-sm">
                                        <Mail
                                            aria-hidden="true"
                                            className="size-3.5 shrink-0 text-muted-foreground"
                                        />
                                        <a
                                            href={`mailto:${m.support.email}`}
                                            className="focus-ring rounded-xs font-medium text-primary-text hover:underline"
                                        >
                                            {m.support.email}
                                        </a>
                                    </p>
                                )}
                                {m.support.hours && (
                                    <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                                        <Clock
                                            aria-hidden="true"
                                            className="size-3.5 shrink-0"
                                        />
                                        <span>{m.support.hours}</span>
                                    </p>
                                )}
                            </div>
                        )}

                        {m.socials.length > 0 && (
                            <div className="flex flex-col gap-2 pt-1">
                                <span className="text-caption font-semibold tracking-wider text-subtle-foreground uppercase">
                                    Follow Us
                                </span>
                                <ul className="flex flex-wrap gap-2">
                                    {m.socials.map((s) => {
                                        const Icon =
                                            socialIcons[
                                                s.icon as keyof typeof socialIcons
                                            ];
                                        return (
                                            <li key={s.label}>
                                                <a
                                                    href={s.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`${name} on ${s.label}`}
                                                    className="btn btn-sm btn-icon focus-ring rounded-button border border-border bg-surface text-muted-foreground transition-colors duration-token hover:border-primary/40 hover:bg-primary-soft hover:text-primary-text"
                                                >
                                                    {Icon && (
                                                        <Icon
                                                            aria-hidden="true"
                                                            className="size-4"
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
                            </div>
                        )}
                    </div>

                    {/* Navigation groups */}
                    <div className="grid grid-cols-1 border-t border-border/70 pt-1 sm:col-span-2 sm:grid-cols-2 sm:gap-8 sm:border-t-0 sm:pt-0 lg:col-span-8 lg:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]">
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
                </div>

                {/* Bottom Bar: Copyright, Registration, and Back to Top */}
                <div className="border-t border-border py-6">
                    <div className="flex flex-col gap-4 text-caption text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                            <p className="font-medium text-foreground">
                                &copy; {new Date().getFullYear()} {name}. All
                                rights reserved.
                            </p>
                            {m.registration && (
                                <>
                                    <span
                                        aria-hidden="true"
                                        className="hidden text-border-strong sm:inline"
                                    >
                                        &bull;
                                    </span>
                                    <p className="text-subtle-foreground">
                                        {m.registration}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-4">
                            <span className="hidden text-caption text-subtle-foreground sm:inline">
                                Verified Halal Marketplace &bull; Philippines
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    window.scrollTo({
                                        top: 0,
                                        behavior: 'smooth',
                                    })
                                }
                                className="focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-button border border-transparent px-2.5 py-1 text-caption font-semibold text-muted-foreground transition-colors duration-token hover:border-border hover:bg-surface hover:text-primary-text"
                                aria-label="Back to top"
                            >
                                <span>Back to top</span>
                                <ArrowUp
                                    aria-hidden="true"
                                    className="size-3.5 shrink-0"
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
