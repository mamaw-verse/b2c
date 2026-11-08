import { useEffect, useRef } from 'react';

export type OrderStatusTabItem = {
    key: string;
    label: string;
    count?: number;
};

export type OrderStatusTabsProps = {
    selected: string | null; // null for 'all'
    onSelect: (key: string | null) => void;
    counts?: Record<string, number>;
    className?: string;
};

export const ORDER_TABS: {
    key: string | null;
    label: string;
    countKey?: string;
}[] = [
    { key: null, label: 'All' },
    { key: 'to_pay', label: 'To Pay', countKey: 'to_pay' },
    { key: 'to_ship', label: 'To Ship', countKey: 'to_ship' },
    { key: 'to_receive', label: 'To Receive', countKey: 'to_receive' },
    { key: 'completed', label: 'Completed', countKey: 'completed' },
    { key: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
    { key: 'return_refund', label: 'Return/Refund', countKey: 'return_refund' },
];

export function OrderStatusTabs({
    selected,
    onSelect,
    counts = {},
    className = '',
}: OrderStatusTabsProps) {
    const activeRef = useRef<HTMLButtonElement | null>(null);

    // NV-03: scroll active tab into view
    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'nearest',
            });
        }
    }, [selected]);

    return (
        <div className={className}>
            <div
                role="tablist"
                aria-label="My purchases"
                className="flex [scrollbar-width:none] overflow-x-auto border-b border-border"
            >
                {ORDER_TABS.map((tab, index) => {
                    const isSelected = selected === tab.key;
                    const count = tab.countKey
                        ? counts[tab.countKey]
                        : undefined;
                    const hasCount = typeof count === 'number' && count > 0;

                    return (
                        <button
                            key={tab.key ?? 'all'}
                            ref={isSelected ? activeRef : undefined}
                            type="button"
                            role="tab"
                            id={`ost-tab-${index}`}
                            aria-selected={isSelected}
                            tabIndex={isSelected ? 0 : -1}
                            onClick={() => onSelect(tab.key)}
                            className="relative flex min-h-touch shrink-0 cursor-pointer items-center gap-1.5 px-4 text-label whitespace-nowrap text-muted-foreground transition-colors after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full hover:text-foreground focus-inset aria-selected:text-primary-text aria-selected:after:bg-primary"
                        >
                            <span>{tab.label}</span>
                            {hasCount && (
                                <span className="badge badge-neutral text-xs">
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
