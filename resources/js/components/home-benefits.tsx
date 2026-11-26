import { Link } from '@inertiajs/react';
import {
    Award,
    Building2,
    Check,
    ChevronRight,
    ShieldCheck,
    Store,
    type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    homeBenefitsContent,
    type BenefitAudience,
} from '@/content/home-benefits';
import { cn } from '@/lib/utils';
import {
    dashboard as sellerDashboard,
    register as sellerRegister,
} from '@/routes/seller';

export type HomeBenefitsProps = {
    variant?: 'compact' | 'full';
    canBecomeSeller?: boolean;
    halalCertificationUrl?: string | null;
    b2bUrl?: string | null;
    className?: string;
};

const audienceIcons: Record<string, LucideIcon> = {
    buyers: ShieldCheck,
    sellers: Store,
    certification: Award,
    businesses: Building2,
};

/**
 * Unsplash License photos, resized/compressed to WebP.
 * buyers – Suhas Hanjar, https://unsplash.com/photos/red-cherry-tomatoes-in-a-white-bowl-l56PE-I9bXM
 * sellers – Noah Buisson, https://unsplash.com/photos/fresh-vegetables-displayed-in-wooden-crates-at-market-XPltBlxfChk
 * certified – Stephen Goldberg, https://unsplash.com/photos/woman-in-white-shirt-holding-pen-writing-on-white-paper-LBLc9M1YrwQ
 * b2b – Ashley, https://unsplash.com/photos/a-warehouse-filled-with-lots-of-boxes-and-pallets-28b8xlTT5t4
 */
const audienceImages: Record<
    string,
    {
        src: string;
        srcSet: string;
        width: number;
        height: number;
        position: string;
    }
> = {
    buyers: {
        src: '/images/home/why-cards/buyers.webp',
        srcSet: '/images/home/why-cards/buyers-480.webp 480w, /images/home/why-cards/buyers.webp 900w',
        width: 900,
        height: 1350,
        position: 'object-center lg:object-right-top',
    },
    sellers: {
        src: '/images/home/why-cards/sellers.webp',
        srcSet: '/images/home/why-cards/sellers-480.webp 480w, /images/home/why-cards/sellers.webp 900w',
        width: 900,
        height: 600,
        position: 'object-top lg:object-right-top',
    },
    certification: {
        src: '/images/home/why-cards/certified.webp',
        srcSet: '/images/home/why-cards/certified-480.webp 480w, /images/home/why-cards/certified.webp 900w',
        width: 900,
        height: 601,
        position: 'object-center lg:object-right-top',
    },
    businesses: {
        src: '/images/home/why-cards/b2b.webp',
        srcSet: '/images/home/why-cards/b2b-480.webp 480w, /images/home/why-cards/b2b.webp 900w',
        width: 900,
        height: 1195,
        position: 'object-center lg:object-right-top',
    },
};

const maskClasses = 'hero-mask';

export function HomeBenefits({
    variant = 'compact',
    canBecomeSeller = false,
    halalCertificationUrl,
    b2bUrl,
    className,
}: HomeBenefitsProps) {
    const renderCta = (audience: BenefitAudience) => {
        switch (audience.cta.target) {
            case 'shopping':
                return (
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/">{audience.cta.label}</Link>
                    </Button>
                );

            case 'selling':
                if (canBecomeSeller) {
                    return (
                        <Button asChild className="w-full sm:w-auto">
                            <Link href={sellerRegister().url}>
                                {audience.cta.label}
                            </Link>
                        </Button>
                    );
                }

                return (
                    <Button asChild className="w-full sm:w-auto">
                        <Link href={sellerDashboard().url}>
                            Seller Dashboard
                        </Link>
                    </Button>
                );

            case 'certification':
                if (!halalCertificationUrl) return null;

                return (
                    <Button
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        <a
                            href={halalCertificationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {audience.cta.label}
                        </a>
                    </Button>
                );

            case 'b2b':
                if (!b2bUrl) return null;

                return (
                    <Button
                        asChild
                        variant="outline"
                        className="w-full sm:w-auto"
                    >
                        <a
                            href={b2bUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {audience.cta.label}
                        </a>
                    </Button>
                );

            default:
                return null;
        }
    };

    if (variant === 'compact') {
        return (
            <section
                aria-labelledby="home-benefits-heading"
                className={cn(
                    'mt-6 rounded-hero bg-primary-soft p-4 md:mt-8 md:p-8',
                    className,
                )}
            >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2
                            id="home-benefits-heading"
                            className="text-h2 font-semibold text-primary-soft-foreground"
                        >
                            {homeBenefitsContent.heading}
                        </h2>
                        <p className="text-body text-primary-soft-foreground">
                            {homeBenefitsContent.intro}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="gap-1 self-start px-0 font-medium text-primary-text hover:text-primary-text sm:self-auto sm:px-3"
                    >
                        <Link href="/why-choose-us">
                            <span>Full guide</span>
                            <ChevronRight
                                className="size-4"
                                aria-hidden="true"
                            />
                        </Link>
                    </Button>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {homeBenefitsContent.audiences.map((audience) => {
                        const Icon = audienceIcons[audience.id] ?? ShieldCheck;
                        const image = audienceImages[audience.id];

                        return (
                            <div
                                key={audience.id}
                                className="panel group relative isolate flex flex-col justify-between gap-4 overflow-hidden p-5 transition-all hover:border-primary/50 hover:shadow-xs md:p-6"
                            >
                                {image && (
                                    <div
                                        aria-hidden="true"
                                        className="pointer-events-none absolute inset-0 -z-10"
                                    >
                                        <img
                                            src={image.src}
                                            srcSet={image.srcSet}
                                            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                                            alt=""
                                            width={image.width}
                                            height={image.height}
                                            loading="lazy"
                                            decoding="async"
                                            className={cn(
                                                'h-[45%] w-full object-cover opacity-[0.22] transition-[opacity,transform,scale] duration-500 ease-out md:h-[50%] md:opacity-[0.25] lg:h-[55%] lg:opacity-[0.28]',
                                                'dark:opacity-[0.18] dark:group-focus-within:opacity-[0.28] dark:group-hover:opacity-[0.28]',
                                                'group-focus-within:opacity-[0.38] group-hover:opacity-[0.38]',
                                                'motion-safe:group-focus-within:scale-[1.04] motion-safe:group-hover:scale-[1.04]',
                                                maskClasses,
                                                image.position,
                                            )}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-white/70 to-white dark:from-surface/10 dark:via-surface/70 dark:to-surface" />
                                        <div className="absolute inset-0 bg-emerald-900/5" />
                                    </div>
                                )}

                                <div className="relative z-10">
                                    <div className="flex items-center gap-2">
                                        <span className="grid size-11 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal">
                                            <Icon
                                                className="size-5"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <span className="rounded-badge bg-surface-subtle px-2.5 py-1 text-caption font-semibold text-foreground">
                                            {audience.title}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-h4 font-semibold text-foreground">
                                        {audience.eyebrow}
                                    </p>
                                    <p className="mt-1 text-body-sm text-muted-foreground">
                                        {audience.summary}
                                    </p>
                                    <ul className="mt-3 grid gap-1.5 text-body-sm text-muted-foreground">
                                        {audience.bullets
                                            .slice(0, 2)
                                            .map((bullet) => (
                                                <li
                                                    key={bullet}
                                                    className="flex items-start gap-2"
                                                >
                                                    <Check
                                                        className="mt-0.5 size-4 shrink-0 text-halal"
                                                        aria-hidden="true"
                                                    />
                                                    <span>{bullet}</span>
                                                </li>
                                            ))}
                                    </ul>
                                </div>

                                <div className="relative z-10 flex flex-col items-start gap-2">
                                    {renderCta(audience)}
                                    <Link
                                        href={`/why-choose-us#${audience.id}`}
                                        className="inline-flex min-h-9 items-center gap-1 text-body-sm font-medium text-primary-text hover:underline"
                                    >
                                        Learn more
                                        <ChevronRight
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    }

    return (
        <section
            aria-labelledby="home-benefits-heading"
            className={cn('py-4 md:py-8', className)}
        >
            <div className="max-w-3xl">
                <span className="rounded-badge bg-halal-soft px-2.5 py-1 text-caption font-semibold text-halal">
                    Trusted Marketplace
                </span>
                <h1 id="home-benefits-heading" className="mt-2 text-h1">
                    {homeBenefitsContent.heading}
                </h1>
                <p className="mt-3 text-body-lg text-muted-foreground">
                    {homeBenefitsContent.intro}
                </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                {homeBenefitsContent.audiences.map((audience) => (
                    <div
                        key={audience.id}
                        id={audience.id}
                        className="panel flex scroll-mt-24 flex-col justify-between p-6 md:p-8"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-badge bg-halal-soft px-2.5 py-0.5 text-caption font-semibold text-halal">
                                    {audience.title}
                                </span>
                                <span className="text-caption text-muted-foreground">
                                    · {audience.eyebrow}
                                </span>
                            </div>
                            <h2 className="mt-3 text-h2">
                                {audience.headline}
                            </h2>
                            <p className="mt-2 text-body text-muted-foreground">
                                {audience.body}
                            </p>
                            <ul className="mt-4 grid gap-2.5 text-body-sm">
                                {audience.bullets.map((bullet, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2.5"
                                    >
                                        <Check
                                            className="mt-0.5 size-4 shrink-0 text-halal"
                                            aria-hidden="true"
                                        />
                                        <span>{bullet}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6 pt-2">{renderCta(audience)}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
