import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabsProps = {
    id: string;
    items: string[];
    counts?: Record<number, number>;
    selected?: number;
    label: string;
    fill?: boolean;
    panels?: ReactNode[];
    onChange?: (index: number) => void;
    className?: string;
};

/** Horizontally scrollable tabs with underline indicator. */
export function Tabs({
    id,
    items,
    counts = {},
    selected = 0,
    label,
    fill = false,
    panels,
    onChange,
    className,
}: TabsProps) {
    const [active, setActive] = useState(selected);
    const listRef = useRef<HTMLDivElement>(null);

    const select = (index: number) => {
        setActive(index);
        onChange?.(index);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const tabs = Array.from(
            listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ??
                [],
        );
        const current = tabs.indexOf(document.activeElement as HTMLElement);
        let next = -1;

        if (event.key === 'ArrowRight') {
            next = (current + 1) % tabs.length;
        } else if (event.key === 'ArrowLeft') {
            next = (current - 1 + tabs.length) % tabs.length;
        } else if (event.key === 'Home') {
            next = 0;
        } else if (event.key === 'End') {
            next = tabs.length - 1;
        }

        if (next >= 0) {
            event.preventDefault();
            tabs[next].focus();
            select(next);
        }
    };

    return (
        <div className={className}>
            <div
                ref={listRef}
                role="tablist"
                aria-label={label}
                onKeyDown={onKeyDown}
                className={cn(
                    'flex [scrollbar-width:none] overflow-x-auto border-b border-border',
                    fill && 'md:justify-stretch',
                )}
            >
                {items.map((tab, i) => (
                    <button
                        key={i}
                        type="button"
                        role="tab"
                        id={`${id}-tab-${i}`}
                        aria-controls={`${id}-panel-${i}`}
                        aria-selected={i === active}
                        tabIndex={i === active ? 0 : -1}
                        onClick={() => select(i)}
                        className={cn(
                            'relative flex min-h-touch shrink-0 items-center gap-1.5 px-4 text-label whitespace-nowrap text-muted-foreground after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full hover:text-foreground focus-inset aria-selected:text-primary-text aria-selected:after:bg-primary',
                            fill && 'md:flex-1 md:justify-center',
                        )}
                    >
                        {tab}
                        {counts[i] != null && (
                            <span className="badge badge-neutral">
                                {counts[i]}
                            </span>
                        )}
                    </button>
                ))}
            </div>
            {panels &&
                panels.map((panel, i) => (
                    <div
                        key={i}
                        role="tabpanel"
                        id={`${id}-panel-${i}`}
                        aria-labelledby={`${id}-tab-${i}`}
                        tabIndex={0}
                        hidden={i !== active}
                        className="pt-4"
                    >
                        {panel}
                    </div>
                ))}
        </div>
    );
}
