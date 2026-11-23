import { Head } from '@inertiajs/react';
import { FaqList, type FaqEntry } from '@/components/faq-list';

type Props = {
    page: { title: string; sections: { heading: string; body: string }[] };
    faqs?: FaqEntry[];
    dates?: { published: string | null; modified: string | null };
};

/** Dates arrive as YYYY-MM-DD; format in UTC so the visible day matches the markup. */
function formatDate(value: string): string {
    return new Date(`${value}T00:00:00Z`).toLocaleDateString('en-PH', {
        dateStyle: 'long',
        timeZone: 'UTC',
    });
}

export default function Content({ page, faqs = [], dates }: Props) {
    return (
        <>
            <Head title={page.title} />
            <div className="mx-auto grid max-w-3xl gap-6 p-gutter py-8">
                <h1 className="text-h1">{page.title}</h1>
                {dates?.modified && (
                    <p className="text-body-sm text-muted-foreground">
                        Last updated{' '}
                        <time dateTime={dates.modified}>
                            {formatDate(dates.modified)}
                        </time>
                    </p>
                )}
                {page.sections.map((section) => (
                    <section key={section.heading}>
                        <h2 className="mb-2 text-h3">{section.heading}</h2>
                        <p className="text-body text-muted-foreground">
                            {section.body}
                        </p>
                    </section>
                ))}
                <FaqList faqs={faqs} />
            </div>
        </>
    );
}
