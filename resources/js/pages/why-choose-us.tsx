import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FaqList, type FaqEntry } from '@/components/faq-list';
import { HomeBenefits } from '@/components/home-benefits';
import { Button } from '@/components/ui/button';

export default function WhyChooseUs({
    canBecomeSeller = false,
    halalCertificationUrl,
    b2bUrl,
    faqs = [],
}: {
    canBecomeSeller?: boolean;
    halalCertificationUrl?: string | null;
    b2bUrl?: string | null;
    faqs?: FaqEntry[];
}) {
    return (
        <>
            <Head title="Why Choose Our Marketplace" />
            <div className="py-4 md:py-6">
                <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="mb-4 gap-1 text-muted-foreground hover:text-foreground"
                >
                    <Link href="/">
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span>Back to Home</span>
                    </Link>
                </Button>

                <HomeBenefits
                    variant="full"
                    canBecomeSeller={canBecomeSeller}
                    halalCertificationUrl={halalCertificationUrl}
                    b2bUrl={b2bUrl}
                />

                <FaqList faqs={faqs} className="mx-auto mt-10 max-w-3xl" />
            </div>
        </>
    );
}
