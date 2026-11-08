import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

type BreadcrumbItem = { label: string; href?: string };

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
    return (
        <nav aria-label="Breadcrumb" className="overflow-x-auto">
            <ol className="flex items-center gap-1 text-body-sm whitespace-nowrap text-subtle-foreground">
                {items.map((item, i) =>
                    i === items.length - 1 ? (
                        <li key={i}>
                            <span
                                aria-current="page"
                                className="font-bold text-foreground"
                            >
                                {item.label}
                            </span>
                        </li>
                    ) : (
                        <li key={i} className="flex items-center gap-1">
                            <Link
                                href={item.href ?? '#'}
                                className="inline-flex min-h-touch min-w-touch items-center justify-center text-muted-foreground underline-offset-2 hover:text-primary-text hover:underline"
                            >
                                {item.label}
                            </Link>
                            <ChevronRight
                                aria-hidden="true"
                                className="size-4"
                            />
                        </li>
                    ),
                )}
            </ol>
        </nav>
    );
}
