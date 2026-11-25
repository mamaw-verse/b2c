import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { index as blogIndex } from '@/routes/blog';
import { show as blogCategoryShow } from '@/routes/blog/categories';
import type { BlogCategoryChip } from '@/types/blog';

const SCROLL_MASK =
    'max-lg:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)] max-lg:[mask-image:linear-gradient(to_right,#000_calc(100%-2.5rem),transparent)]';

const chip =
    'relative inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-label font-medium whitespace-nowrap transition-colors duration-token after:absolute after:-inset-x-px after:-inset-y-[5px]';

/** "All" plus every category that has a live post. Links (navigation), so the active one uses aria-current. */
export function BlogCategoryChips({
    categories,
    active,
}: {
    categories: BlogCategoryChip[];
    active: string | null;
}) {
    if (categories.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label="Blog categories"
            className={cn(
                'bleed-x mt-4 flex [scrollbar-width:none] gap-2 overflow-x-auto pb-1',
                SCROLL_MASK,
            )}
        >
            <Link
                href={blogIndex.url()}
                data-edge="start"
                aria-current={active === null ? 'page' : undefined}
                className={cn(
                    chip,
                    active === null
                        ? 'border-primary bg-primary-soft text-primary-soft-foreground'
                        : 'border-border-control bg-surface text-foreground hover:bg-surface-muted',
                )}
            >
                All
            </Link>
            {categories.map((category) => (
                <Link
                    key={category.slug}
                    href={blogCategoryShow.url(category.slug)}
                    aria-current={active === category.slug ? 'page' : undefined}
                    className={cn(
                        chip,
                        active === category.slug
                            ? 'border-primary bg-primary-soft text-primary-soft-foreground'
                            : 'border-border-control bg-surface text-foreground hover:bg-surface-muted',
                    )}
                >
                    {category.name}
                </Link>
            ))}
        </nav>
    );
}
