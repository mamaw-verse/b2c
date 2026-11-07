import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaginationProps = {
    page: number;
    total: number;
    href?: (page: number) => string;
    label?: string;
};

/** Desktop pagination; phone shows prev / "page x of y" / next. */
export function Pagination({
    page,
    total,
    href = () => '#',
    label = 'Pagination',
}: PaginationProps) {
    const pages = [1, '…', page - 1, page, page + 1, '…', total].filter(
        (p) => typeof p !== 'number' || (p >= 1 && p <= total),
    );

    const linkCls =
        'grid min-h-touch min-w-touch place-items-center rounded-button text-label';

    return (
        <nav aria-label={label} className="@container">
            <ul className="flex items-center justify-between gap-1 @md:justify-center">
                <li>
                    <Link
                        href={page > 1 ? href(page - 1) : '#'}
                        className="btn btn-neutral btn-icon"
                        aria-label="Previous page"
                        aria-disabled={page === 1 || undefined}
                    >
                        <ChevronLeft aria-hidden="true" />
                    </Link>
                </li>
                <li className="text-body text-muted-foreground @md:hidden">
                    Page{' '}
                    <span className="font-bold text-foreground">{page}</span> of{' '}
                    {total}
                </li>
                {pages.map((p, i) =>
                    p === '…' ? (
                        <li
                            key={`e${i}`}
                            aria-hidden="true"
                            className="hidden px-1 text-muted-foreground @md:block"
                        >
                            …
                        </li>
                    ) : (
                        <li key={p} className="hidden @md:block">
                            <Link
                                href={href(p as number)}
                                aria-label={`Page ${p}`}
                                aria-current={p === page ? 'page' : undefined}
                                className={cn(
                                    linkCls,
                                    p === page
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground hover:bg-surface-muted',
                                )}
                            >
                                {p}
                            </Link>
                        </li>
                    ),
                )}
                <li>
                    <Link
                        href={page < total ? href(page + 1) : '#'}
                        className="btn btn-neutral btn-icon"
                        aria-label="Next page"
                        aria-disabled={page === total || undefined}
                    >
                        <ChevronRight aria-hidden="true" />
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
