import { Head, Link } from '@inertiajs/react';
import { Banner } from '@/components/ui/alert';
import { termsContent, type SellerTermsConfig } from '@/content/seller-terms';

const TBC = '[to be confirmed]';

function Placeholder({ children }: { children: string }) {
    return import.meta.env.DEV ? (
        <mark className="rounded-badge bg-warning-soft px-1 font-bold text-warning-text">
            {children}
        </mark>
    ) : (
        <>{children}</>
    );
}

/** Render one paragraph/item with {placeholder} tokens resolved. */
function Resolved({
    text,
    values,
}: {
    text: string;
    values: SellerTermsConfig;
}) {
    const parts = text.split(/(\{\w+\})/g);

    return (
        <>
            {parts.map((part, i) => {
                const token = part.match(/^\{(\w+)\}$/);
                if (!token) {
                    return part;
                }
                const value = values[token[1]];

                return typeof value === 'string' && value !== '' ? (
                    value
                ) : (
                    <Placeholder key={i}>{TBC}</Placeholder>
                );
            })}
        </>
    );
}

export default function SellerTerms({
    sellerTerms,
}: {
    sellerTerms: SellerTermsConfig;
}) {
    const version = sellerTerms.version || termsContent.version;
    const updated = sellerTerms.updated || termsContent.updated;
    const sections = termsContent.sections;

    return (
        <>
            <Head title="Seller Terms" />
            <div className="mx-auto w-full max-w-5xl py-6 lg:py-10">
                <header className="mb-6 max-w-3xl">
                    <h1 className="text-h1">Seller Terms</h1>
                    <p className="mt-1 text-body-sm text-muted-foreground">
                        Version {version} · Last updated{' '}
                        {new Date(`${updated}T00:00:00`).toLocaleDateString(
                            'en-PH',
                            {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric',
                            },
                        )}
                    </p>
                </header>

                {sellerTerms.draft && (
                    <div className="mb-8 max-w-3xl">
                        <Banner tone="warning" title="Draft">
                            These terms are pending review and may change before
                            they take effect.
                        </Banner>
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-10">
                    <aside
                        aria-label="Contents"
                        className="mb-6 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:mb-0 print:hidden"
                    >
                        <nav>
                            <p className="mb-3 text-label text-foreground">
                                On this page
                            </p>
                            <ol className="grid gap-1.5">
                                {sections.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="text-body-sm text-primary-text underline decoration-1 underline-offset-2"
                                        >
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </aside>

                    <article className="grid max-w-3xl gap-8">
                        {sections.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                aria-labelledby={`${section.id}-title`}
                                className="grid scroll-mt-24 gap-3"
                            >
                                <h2
                                    id={`${section.id}-title`}
                                    className="text-h3"
                                >
                                    {section.title}
                                </h2>
                                {section.paragraphs?.map((text, i) => (
                                    <p
                                        key={i}
                                        className="text-body text-foreground"
                                    >
                                        <Resolved
                                            text={text}
                                            values={sellerTerms}
                                        />
                                    </p>
                                ))}
                                {section.items && (
                                    <ul className="grid list-disc gap-1.5 pl-5 text-body text-foreground">
                                        {section.items.map((text, i) => (
                                            <li key={i}>
                                                <Resolved
                                                    text={text}
                                                    values={sellerTerms}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}

                        <p className="border-t border-border pt-6 text-body">
                            <Link
                                href="/seller/register"
                                className="font-bold text-primary-text underline"
                            >
                                Back to the seller application
                            </Link>
                        </p>
                    </article>
                </div>
            </div>
        </>
    );
}
