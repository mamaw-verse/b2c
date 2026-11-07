import { usePage } from '@inertiajs/react';

const groups: [string, string[]][] = [
    ['Shop', ['Categories', 'Sell']],
    [
        'Support',
        ['Help centre', 'Returns', 'Contact us', 'Halal verification policy'],
    ],
    ['Company', ['About', 'Terms', 'Privacy']],
];

export function SiteFooter() {
    const { name } = usePage().props;

    return (
        <footer className="hidden border-t border-border bg-surface-subtle md:block">
            <div className="mx-auto grid max-w-container gap-8 px-gutter py-8 text-body-sm text-muted-foreground md:grid-cols-4">
                <div className="grid content-start gap-2">
                    <p className="text-label text-foreground">{name}</p>
                    <p>A white-label multi-vendor halal marketplace.</p>
                </div>
                {groups.map(([heading, links]) => (
                    <nav
                        key={heading}
                        aria-label={heading}
                        className="grid content-start gap-1"
                    >
                        <p className="text-label text-foreground">{heading}</p>
                        {links.map((link) => (
                            <a
                                key={link}
                                href="#"
                                className="inline-flex min-h-touch items-center hover:text-primary"
                            >
                                {link === 'Sell' ? `Sell on ${name}` : link}
                            </a>
                        ))}
                    </nav>
                ))}
            </div>
            <p className="border-t border-border px-gutter py-4 text-center text-caption text-muted-foreground">
                © {name}
            </p>
        </footer>
    );
}
