import React, { ReactNode } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
    key: string;
    label: string;
    align?: 'start' | 'end';
    badge?: boolean;
    render?: (item: T) => ReactNode;
}

export interface DataTableProps<T> {
    caption: string;
    columns: DataTableColumn<T>[];
    rows: T[];
    rowKey: (item: T) => string;
    selectable?: boolean;
    selectedKeys?: string[];
    onSelectKeys?: (keys: string[]) => void;
    sortKey?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (key: string) => void;
    emptyText?: string;
    className?: string;
}

export function DataTable<T extends Record<string, any>>({
    caption,
    columns,
    rows,
    rowKey,
    selectable = false,
    selectedKeys = [],
    onSelectKeys,
    sortKey,
    sortDirection = 'desc',
    onSort,
    emptyText = 'No items found.',
    className,
}: DataTableProps<T>) {
    const allSelected = rows.length > 0 && selectedKeys.length === rows.length;

    const handleSelectAll = (checked: boolean) => {
        if (!onSelectKeys) return;
        onSelectKeys(checked ? rows.map(rowKey) : []);
    };

    const handleSelectRow = (key: string, checked: boolean) => {
        if (!onSelectKeys) return;
        if (checked) {
            onSelectKeys([...selectedKeys, key]);
        } else {
            onSelectKeys(selectedKeys.filter((k) => k !== key));
        }
    };

    if (rows.length === 0) {
        return (
            <div className="card grid place-items-center p-8 text-center text-muted-foreground">
                <DsIcon name="inbox" className="mb-2 size-8" />
                <p>{emptyText}</p>
            </div>
        );
    }

    return (
        <div data-ds-bulk className={cn('grid gap-2', className)}>
            {/* Desktop Table (md+) */}
            <div className="hidden overflow-x-auto rounded-panel border border-border bg-surface md:block">
                <table className="w-full text-body">
                    <caption className="sr-only">{caption}</caption>
                    <thead className="border-b border-border bg-surface-subtle">
                        <tr>
                            {selectable && (
                                <th scope="col" className="w-12 px-3">
                                    <label className="grid min-h-touch place-items-center">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            onChange={(e) =>
                                                handleSelectAll(
                                                    e.target.checked,
                                                )
                                            }
                                            className="size-5 accent-primary"
                                        />
                                        <span className="sr-only">
                                            Select all
                                        </span>
                                    </label>
                                </th>
                            )}
                            {columns.map((c) => {
                                const isSorted = sortKey === c.key;
                                return (
                                    <th
                                        key={c.key}
                                        scope="col"
                                        className={cn(
                                            'px-3 py-2 text-th text-muted-foreground uppercase',
                                            c.align === 'end'
                                                ? 'text-right'
                                                : 'text-left',
                                        )}
                                        aria-sort={
                                            isSorted
                                                ? sortDirection === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : undefined
                                        }
                                    >
                                        {onSort ? (
                                            <button
                                                type="button"
                                                onClick={() => onSort(c.key)}
                                                className="inline-flex min-h-touch items-center gap-1 uppercase hover:text-foreground"
                                            >
                                                <span>{c.label}</span>
                                                {isSorted && (
                                                    <DsIcon
                                                        name={
                                                            sortDirection ===
                                                            'asc'
                                                                ? 'arrow-up'
                                                                : 'arrow-down'
                                                        }
                                                        className="size-3.5"
                                                    />
                                                )}
                                            </button>
                                        ) : (
                                            c.label
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rows.map((r) => {
                            const key = rowKey(r);
                            const isSelected = selectedKeys.includes(key);

                            return (
                                <tr
                                    key={key}
                                    className="hover:bg-surface-subtle has-[:checked]:bg-primary-soft"
                                >
                                    {selectable && (
                                        <td className="px-3">
                                            <label className="grid min-h-touch place-items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={(e) =>
                                                        handleSelectRow(
                                                            key,
                                                            e.target.checked,
                                                        )
                                                    }
                                                    className="size-5 accent-primary"
                                                />
                                                <span className="sr-only">
                                                    Select item
                                                </span>
                                            </label>
                                        </td>
                                    )}
                                    {columns.map((c) => (
                                        <td
                                            key={c.key}
                                            className={cn(
                                                'px-3 py-2.5 align-middle',
                                                c.align === 'end' &&
                                                    'tabular text-right',
                                            )}
                                        >
                                            {c.render ? c.render(r) : r[c.key]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List (<md) */}
            <ul className="grid gap-2 md:hidden" aria-label={caption}>
                {rows.map((r) => {
                    const key = rowKey(r);
                    const isSelected = selectedKeys.includes(key);
                    const firstCol = columns[0];
                    const badgeCol = columns.find((c) => c.badge);
                    const restCols = columns.slice(1).filter((c) => !c.badge);

                    return (
                        <li
                            key={key}
                            className={cn(
                                'card grid gap-2 p-3',
                                isSelected && 'bg-primary-soft',
                            )}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    {selectable && (
                                        <label className="grid min-h-touch place-items-center">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={(e) =>
                                                    handleSelectRow(
                                                        key,
                                                        e.target.checked,
                                                    )
                                                }
                                                className="size-5 accent-primary"
                                            />
                                            <span className="sr-only">
                                                Select item
                                            </span>
                                        </label>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        {firstCol.render
                                            ? firstCol.render(r)
                                            : r[firstCol.key]}
                                    </div>
                                </div>
                                {badgeCol && (
                                    <div>
                                        {badgeCol.render
                                            ? badgeCol.render(r)
                                            : r[badgeCol.key]}
                                    </div>
                                )}
                            </div>
                            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-body-sm">
                                {restCols.map((c) => (
                                    <div key={c.key} className="contents">
                                        <dt className="text-muted-foreground">
                                            {c.label}
                                        </dt>
                                        <dd className="tabular text-right text-foreground">
                                            {c.render ? c.render(r) : r[c.key]}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
