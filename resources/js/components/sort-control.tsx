import { Select } from '@/components/ui/select';

export type SortKey = 'top_sales' | 'newest' | 'price_asc' | 'price_desc';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'top_sales', label: 'Top sales' },
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
];

/** URL-driven sort menu, visually separate from the filter chips. */
export function SortControl({
    value,
    onChange,
    className,
}: {
    value: string;
    onChange: (sort: SortKey) => void;
    className?: string;
}) {
    return (
        <Select
            aria-label="Sort by"
            value={value}
            onChange={(e) => onChange(e.target.value as SortKey)}
            className={className}
        >
            {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </Select>
    );
}
