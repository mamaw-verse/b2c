import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AccordionItem = {
    title: ReactNode;
    content: ReactNode;
    open?: boolean;
};

type AccordionProps = {
    items: AccordionItem[];
    name?: string;
    className?: string;
};

export function Accordion({ items, className }: AccordionProps) {
    const baseId = useId();
    const [openState, setOpenState] = useState<Record<number, boolean>>(() => {
        const initial: Record<number, boolean> = {};
        items.forEach((item, i) => {
            if (item.open) {
                initial[i] = true;
            }
        });
        return initial;
    });

    const toggle = (i: number) => {
        setOpenState((prev) => ({
            ...prev,
            [i]: !prev[i],
        }));
    };

    return (
        <div
            className={cn(
                'divide-y divide-border rounded-panel border border-border bg-surface',
                className,
            )}
        >
            {items.map((item, i) => {
                const isOpen = !!openState[i];
                const headerId = `${baseId}-header-${i}`;
                const panelId = `${baseId}-panel-${i}`;

                return (
                    <div key={i} className="group">
                        <h3>
                            <button
                                type="button"
                                id={headerId}
                                aria-expanded={isOpen}
                                aria-controls={panelId}
                                onClick={() => toggle(i)}
                                className="focus-inset flex min-h-touch-primary w-full items-center justify-between gap-3 px-4 text-left text-label hover:bg-surface-subtle"
                            >
                                <span>{item.title}</span>
                                <ChevronDown
                                    aria-hidden="true"
                                    className={cn(
                                        'size-4 shrink-0 text-muted-foreground transition-transform duration-token',
                                        isOpen && 'rotate-180',
                                    )}
                                />
                            </button>
                        </h3>
                        <div
                            id={panelId}
                            role="region"
                            aria-labelledby={headerId}
                            hidden={!isOpen}
                            className={cn(
                                'px-4 pb-4 text-body text-muted-foreground',
                                !isOpen && 'hidden',
                            )}
                        >
                            {item.content}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
