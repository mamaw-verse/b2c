import { usePage } from '@inertiajs/react';
import { ExternalLink, FileBadge, Flag, ImagePlus } from 'lucide-react';
import { HalalBadge } from '@/components/halal-badge';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import type { HalalCertificationData } from '@/types/catalogue';

type HalalCertificateCardProps = {
    id?: string;
    certification: HalalCertificationData;
    seller?: boolean;
};

export function HalalCertificateCard({
    id = 'hc',
    certification: cert,
    seller = false,
}: HalalCertificateCardProps) {
    const { name } = usePage().props;
    const status = cert.status;
    const valid = new Date(cert.valid_until).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const checked = cert.checked_at
        ? new Date(cert.checked_at).toLocaleDateString('en-PH', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : null;

    const rows: [string, React.ReactNode][] = [
        ['Certifying body', cert.certifying_body],
        [
            'Certificate no.',
            <span key="n" className="tabular">
                {cert.number}
            </span>,
        ],
        [
            status === 'expired' ? 'Expired on' : 'Valid until',
            <span
                key="v"
                className={`tabular${status === 'certified' ? '' : ' font-bold'}`}
            >
                {valid}
            </span>,
        ],
        ['Covers', cert.scope],
    ];

    return (
        <section className="panel p-4" aria-labelledby={`${id}-h`}>
            <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-halal-soft text-halal">
                    <FileBadge aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                    <h2 id={`${id}-h`} className="text-h4">
                        Halal certificate
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Checked by {name}
                        {checked && (
                            <>
                                {' '}
                                on <time>{checked}</time>
                            </>
                        )}
                    </p>
                </div>
                <HalalBadge status={status} short />
            </div>
            <dl className="mt-3 grid gap-2 text-body-sm">
                {rows.map(([k, v], i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[minmax(6.5rem,35%)_1fr] gap-3"
                    >
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="text-foreground">{v}</dd>
                    </div>
                ))}
            </dl>
            {status === 'expiring' && (
                <Banner tone="warning" className="mt-3">
                    Certificate expires on {valid}. Upload a renewal to keep
                    your listings visible.
                </Banner>
            )}
            {status === 'expired' && (
                <Banner
                    tone="danger"
                    title="Certificate expired"
                    className="mt-3"
                >
                    {seller
                        ? 'Your halal listings are hidden from search until you upload a renewal.'
                        : 'The seller must renew this certificate. Listings that depend on it are hidden.'}
                </Banner>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
                <Button
                    asChild={!!cert.document_path}
                    variant="neutral"
                    className="flex-1 sm:flex-none"
                >
                    {cert.document_path ? (
                        <a
                            href={cert.document_path}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View certificate
                            <ExternalLink aria-hidden="true" />
                        </a>
                    ) : (
                        <span>View certificate</span>
                    )}
                </Button>
                {seller ? (
                    <Button
                        variant="outline"
                        icon={<ImagePlus aria-hidden="true" />}
                        className="flex-1 sm:flex-none"
                    >
                        Upload renewal
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        icon={<Flag aria-hidden="true" />}
                        className="flex-1 sm:flex-none"
                    >
                        Report a concern
                    </Button>
                )}
            </div>
        </section>
    );
}
