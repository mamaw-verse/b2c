import { Head } from '@inertiajs/react';
import { FaqList, type FaqEntry } from '@/components/faq-list';

type Props = {
    page: { title: string; sections: { heading: string; body: string }[] };
    faqs?: FaqEntry[];
};

export default function Content({ page, faqs = [] }: Props) {
    return (
        <>
            <Head title={page.title} />
            <div className="mx-auto grid max-w-3xl gap-6 p-gutter py-8">
                <h1 className="text-h1">{page.title}</h1>
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
