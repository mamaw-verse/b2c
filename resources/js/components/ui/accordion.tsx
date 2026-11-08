import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AccordionProps = {
    items: { title: ReactNode; content: ReactNode; open?: boolean }[];
    name?: string;
    className?: string;
};

export function Accordion({ items, name, className }: AccordionProps) {
    return (
        <div
            className={cn(
                'divide-y divide-border rounded-panel border border-border bg-surface',
                className,
            )}
        >
            {items.map((item, i) => (
                <details key={i} className="group" open={item.open} name={name}>
                    <summary className="flex min-h-touch-primary list-none items-center justify-between gap-3 px-4 text-label hover:bg-surface-subtle focus-inset [&::-webkit-details-marker]:hidden">
                        {item.title}
                        <ChevronDown
                            aria-hidden="true"
                            className="shrink-0 text-muted-foreground transition-transform duration-token group-open:rotate-180"
                        />
                    </summary>
                    <div className="px-4 pb-4 text-body text-muted-foreground">
                        {item.content}
                    </div>
                </details>
            ))}
        </div>
    );
}
