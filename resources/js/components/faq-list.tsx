export type FaqEntry = { question: string; answer: string };

/**
 * Visible FAQ. The server emits the same entries as FAQPage JSON-LD, so
 * anything rendered here is exactly what the markup describes.
 */
export function FaqList({
    faqs,
    className,
}: {
    faqs?: FaqEntry[];
    className?: string;
}) {
    if (!faqs || faqs.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby="faq-heading" className={className}>
            <h2 id="faq-heading" className="mb-4 text-h2">
                Frequently asked questions
            </h2>
            <dl className="grid gap-5">
                {faqs.map((faq) => (
                    <div key={faq.question} className="grid gap-1">
                        <dt className="text-h4">{faq.question}</dt>
                        <dd className="text-body text-muted-foreground">
                            {faq.answer}
                        </dd>
                    </div>
                ))}
            </dl>
        </section>
    );
}
