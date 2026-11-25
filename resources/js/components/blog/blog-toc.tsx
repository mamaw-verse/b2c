import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { BlogTocItem } from '@/types/blog';

function TocList({
    items,
    activeId,
}: {
    items: BlogTocItem[];
    activeId: string | null;
}) {
    return (
        <ol className="grid gap-1 text-body-sm">
            {items.map((item) => (
                <li key={item.id} className={cn(item.level >= 3 && 'pl-3')}>
                    <a
                        href={`#${item.id}`}
                        aria-current={
                            activeId === item.id ? 'location' : undefined
                        }
                        className={cn(
                            'inline-flex min-h-touch items-center text-muted-foreground underline-offset-2 hover:text-primary-text hover:underline lg:min-h-0 lg:py-0.5',
                            activeId === item.id && 'font-bold text-foreground',
                        )}
                    >
                        {item.text}
                    </a>
                </li>
            ))}
        </ol>
    );
}

/**
 * In-article table of contents (the server only sends it for three or more headings): collapsible on
 * phones, sticky on desktop. Highlights the heading in view with an IntersectionObserver.
 */
export function BlogToc({ items }: { items: BlogTocItem[] }) {
    const [activeId, setActiveId] = useState<string | null>(null);

    useEffect(() => {
        if (items.length === 0 || typeof IntersectionObserver === 'undefined') {
            return;
        }

        const headings = items
            .map((item) => document.getElementById(item.id))
            .filter((el): el is HTMLElement => el !== null);

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.find((e) => e.isIntersecting);
                if (visible) {
                    setActiveId(visible.target.id);
                }
            },
            { rootMargin: '0px 0px -70% 0px' },
        );
        headings.forEach((h) => observer.observe(h));

        return () => observer.disconnect();
    }, [items]);

    if (items.length === 0) {
        return null;
    }

    return (
        <>
            <details className="rounded-panel border border-border bg-surface p-3 lg:hidden">
                <summary className="min-h-touch cursor-pointer text-label font-bold">
                    In this article
                </summary>
                <nav aria-label="Table of contents" className="mt-2">
                    <TocList items={items} activeId={activeId} />
                </nav>
            </details>
            <nav
                aria-label="Table of contents"
                className="sticky top-24 hidden lg:block"
            >
                <p className="mb-2 text-label font-bold">In this article</p>
                <TocList items={items} activeId={activeId} />
            </nav>
        </>
    );
}
