import { Head } from '@inertiajs/react';

type Props = {
    page: { title: string; sections: { heading: string; body: string }[] };
};

export default function Content({ page }: Props) {
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
            </div>
        </>
    );
}
