import { Link } from '@inertiajs/react';
import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';
import type { CategoryData } from '@/types/catalogue';
import { show as categoryShow } from '@/routes/categories';

const tileTones = [
    'bg-primary-soft text-primary-soft-foreground',
    'bg-info-soft text-info-text',
    'bg-promo-soft text-promo',
    'bg-warning-soft text-warning-text',
    'bg-success-soft text-success-text',
];

export function CategoryTile({
    category,
    index = 0,
}: {
    category: CategoryData;
    index?: number;
}) {
    return (
        <Link
            href={categoryShow.url(category.slug)}
            className="flex flex-col items-center gap-1.5 rounded-tile p-1 text-center text-caption text-foreground hover:bg-surface-muted"
        >
            <span
                className={cn(
                    'grid size-12 place-items-center rounded-tile md:size-14',
                    tileTones[index % tileTones.length],
                )}
            >
                <DsIcon name={category.icon ?? 'package'} className="size-6" />
            </span>
            <span className="line-clamp-2">{category.name}</span>
        </Link>
    );
}

export function CategoryGrid({ categories }: { categories: CategoryData[] }) {
    return (
        <ul className="grid grid-cols-5 gap-x-1 gap-y-3 md:grid-cols-10">
            {categories.map((c, i) => (
                <li key={c.id}>
                    <CategoryTile category={c} index={i} />
                </li>
            ))}
        </ul>
    );
}
