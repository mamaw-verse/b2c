import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
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
    canBecomeSeller?: boolean;
    halalCertificationUrl?: string | null;
    b2bUrl?: string | null;
    className?: string;
};

export function HomeBenefits({
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
                        <a href="#home-grid-h">{audience.cta.label}</a>
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

    return (
        <section
            aria-labelledby="home-benefits-heading"
            className={cn('mt-8 md:mt-12', className)}
        >
            <div className="max-w-2xl">
                <h2 id="home-benefits-heading" className="text-h2">
                    {homeBenefitsContent.heading}
                </h2>
                <p className="mt-2 text-body text-muted-foreground">
                    {homeBenefitsContent.intro}
                </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                {homeBenefitsContent.audiences.map((audience) => (
                    <div
                        key={audience.id}
                        className="panel flex flex-col justify-between p-5 md:p-6"
                    >
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="rounded-badge bg-halal-soft px-2 py-0.5 text-caption font-semibold text-halal">
                                    {audience.title}
                                </span>
                                <span className="text-caption text-muted-foreground">
                                    · {audience.eyebrow}
                                </span>
                            </div>
                            <h3 className="mt-2 text-h3">
                                {audience.headline}
                            </h3>
                            <p className="mt-2 text-body text-muted-foreground">
                                {audience.body}
                            </p>
                            <ul className="mt-4 grid gap-2 text-body-sm">
                                {audience.bullets.map((bullet, idx) => (
                                    <li
                                        key={idx}
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

                        <div className="mt-6 pt-2">{renderCta(audience)}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
