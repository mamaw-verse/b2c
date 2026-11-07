import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';

export type QueueFilters = {
    q?: string;
    types?: string[];
    states?: string[];
    sort?: string;
    sla_breach?: boolean;
};

type TypeCount = {
    value: string;
    label: string;
    count: number;
};

const SORT_OPTIONS = [
    { value: 'sla', label: 'SLA (soonest first)' },
    { value: 'priority', label: 'Priority' },
    { value: 'reports', label: 'Most reported' },
    { value: 'newest', label: 'Newest' },
];

const STATE_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'suspended', label: 'Suspended' },
];

function FilterChip({
    label,
    count,
    pressed,
    onToggle,
}: {
    label: string;
    count?: number;
    pressed: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={pressed}
            onClick={onToggle}
            className="relative inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-border-control bg-surface px-3 text-label whitespace-nowrap text-foreground transition-colors duration-token after:absolute after:-inset-x-px after:-inset-y-[5px] hover:bg-surface-muted active:bg-border disabled:cursor-not-allowed disabled:opacity-60 aria-pressed:border-primary aria-pressed:bg-primary-soft aria-pressed:text-primary-soft-foreground"
        >
            {pressed && (
                <span aria-hidden="true" className="size-4 text-current">
                    ✓
                </span>
            )}
            {label}
            {count !== undefined && (
                <span className="text-muted-foreground aria-pressed:text-primary-soft-foreground">
                    {count}
                </span>
            )}
        </button>
    );
}

export function QueueFilterBar({
    filters,
    typeCounts = [],
    slaBreachCount = 0,
    onChange,
}: {
    filters: QueueFilters;
    typeCounts?: TypeCount[];
    slaBreachCount?: number;
    onChange: (filters: QueueFilters) => void;
}) {
    const [sheetOpen, setSheetOpen] = useState(false);
    const [localFilters, setLocalFilters] = useState<QueueFilters>(filters);

    const toggleType = (value: string) => {
        const current = filters.types ?? [];
        const next = current.includes(value)
            ? current.filter((t) => t !== value)
            : [...current, value];
        onChange({ ...filters, types: next.length ? next : undefined });
    };

    const toggleSlaBreached = () => {
        onChange({ ...filters, sla_breach: !filters.sla_breach });
    };

    const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get('q') as string;
        onChange({ ...filters, q: q || undefined });
    };

    const applySheetFilters = () => {
        onChange(localFilters);
        setSheetOpen(false);
    };

    const resetSheetFilters = () => {
        const reset: QueueFilters = { q: filters.q };
        setLocalFilters(reset);
        onChange(reset);
        setSheetOpen(false);
    };

    return (
        <div className="grid gap-2 border-b border-border bg-surface px-gutter py-2 md:px-3">
            {/* Search + Filters button */}
            <div className="flex gap-2">
                <form
                    role="search"
                    className="relative min-w-0 flex-1"
                    onSubmit={handleSearchSubmit}
                >
                    <label htmlFor="qf-q" className="sr-only">
                        Search queue
                    </label>
                    <Search
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                        id="qf-q"
                        name="q"
                        type="search"
                        defaultValue={filters.q ?? ''}
                        enterKeyHint="search"
                        placeholder="Search ID, shop, keyword"
                        className="field rounded-search pr-3 pl-10"
                    />
                </form>

                <button
                    type="button"
                    className="btn btn-neutral md:hidden"
                    aria-label="Filters"
                    onClick={() => {
                        setLocalFilters(filters);
                        setSheetOpen(true);
                    }}
                >
                    <SlidersHorizontal aria-hidden="true" className="icon" />
                    <span>Filters</span>
                </button>
            </div>

            {/* Quick chips (md+) */}
            <div
                role="group"
                aria-label="Quick filters"
                className="-mx-gutter flex gap-2 overflow-x-auto px-gutter pb-1 md:mx-0 md:flex-wrap md:px-0"
            >
                <FilterChip
                    label="All types"
                    pressed={!filters.types?.length}
                    onToggle={() => onChange({ ...filters, types: undefined })}
                />
                {typeCounts.map((tc) => (
                    <FilterChip
                        key={tc.value}
                        label={tc.label}
                        count={tc.count}
                        pressed={filters.types?.includes(tc.value) ?? false}
                        onToggle={() => toggleType(tc.value)}
                    />
                ))}
                {slaBreachCount > 0 && (
                    <FilterChip
                        label="SLA breached"
                        count={slaBreachCount}
                        pressed={filters.sla_breach ?? false}
                        onToggle={toggleSlaBreached}
                    />
                )}
            </div>

            {/* Filter sheet (mobile) */}
            {sheetOpen && (
                <dialog
                    open
                    aria-labelledby="qf-sheet-title"
                    className="z-modal mt-auto mb-0 max-h-[90dvh] w-full rounded-t-panel bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token md:m-auto md:max-h-[85dvh] md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel"
                >
                    <div className="flex max-h-[inherit] flex-col">
                        <div className="flex justify-center pt-2 md:hidden">
                            <span
                                className="h-1.5 w-10 rounded-full bg-border-control"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="flex items-center gap-2 border-b border-border py-1 pr-1 pl-4 md:py-2">
                            <h2 id="qf-sheet-title" className="flex-1 text-h3">
                                Filter queue
                            </h2>
                            <button
                                type="button"
                                className="btn btn-icon btn-ghost text-foreground"
                                aria-label="Close"
                                onClick={() => setSheetOpen(false)}
                            >
                                <X aria-hidden="true" className="icon" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                            <div className="grid gap-4">
                                {/* Type fieldset */}
                                <fieldset className="grid">
                                    <legend className="mb-1 text-label">
                                        Type
                                    </legend>
                                    {typeCounts.map((tc) => (
                                        <label
                                            key={tc.value}
                                            className="flex min-h-touch items-start gap-3 py-2.5"
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 size-5 shrink-0 accent-primary"
                                                checked={
                                                    localFilters.types?.includes(
                                                        tc.value,
                                                    ) ?? false
                                                }
                                                onChange={(e) => {
                                                    const current =
                                                        localFilters.types ??
                                                        [];
                                                    setLocalFilters({
                                                        ...localFilters,
                                                        types: e.target.checked
                                                            ? [
                                                                  ...current,
                                                                  tc.value,
                                                              ]
                                                            : current.filter(
                                                                  (v) =>
                                                                      v !==
                                                                      tc.value,
                                                              ),
                                                    });
                                                }}
                                            />
                                            <span className="grid gap-0.5">
                                                <span className="text-body">
                                                    {tc.label}
                                                </span>
                                            </span>
                                        </label>
                                    ))}
                                </fieldset>

                                {/* State fieldset */}
                                <fieldset className="grid">
                                    <legend className="mb-1 text-label">
                                        Status
                                    </legend>
                                    {STATE_OPTIONS.map((s) => (
                                        <label
                                            key={s.value}
                                            className="flex min-h-touch items-start gap-3 py-2.5"
                                        >
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 size-5 shrink-0 accent-primary"
                                                checked={
                                                    localFilters.states?.includes(
                                                        s.value,
                                                    ) ?? false
                                                }
                                                onChange={(e) => {
                                                    const current =
                                                        localFilters.states ??
                                                        [];
                                                    setLocalFilters({
                                                        ...localFilters,
                                                        states: e.target.checked
                                                            ? [
                                                                  ...current,
                                                                  s.value,
                                                              ]
                                                            : current.filter(
                                                                  (v) =>
                                                                      v !==
                                                                      s.value,
                                                              ),
                                                    });
                                                }}
                                            />
                                            <span className="text-body">
                                                {s.label}
                                            </span>
                                        </label>
                                    ))}
                                </fieldset>

                                {/* Sort */}
                                <div className="grid gap-1.5">
                                    <label
                                        htmlFor="qf-sort"
                                        className="text-label text-foreground"
                                    >
                                        Sort by
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="qf-sort"
                                            className="field"
                                            value={localFilters.sort ?? 'sla'}
                                            onChange={(e) =>
                                                setLocalFilters({
                                                    ...localFilters,
                                                    sort: e.target.value,
                                                })
                                            }
                                        >
                                            {SORT_OPTIONS.map((o) => (
                                                <option
                                                    key={o.value}
                                                    value={o.value}
                                                >
                                                    {o.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                className="btn btn-neutral"
                                onClick={resetSheetFilters}
                            >
                                <span>Reset</span>
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={applySheetFilters}
                            >
                                <span>Apply filters</span>
                            </button>
                        </div>
                    </div>
                </dialog>
            )}
        </div>
    );
}
