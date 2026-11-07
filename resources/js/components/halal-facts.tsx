import { Snowflake } from 'lucide-react';
import { HalalBadge } from '@/components/halal-badge';
import { cn } from '@/lib/utils';

type HalalFactsProps = {
    body?: string | null;
    valid?: string | null;
    frozen?: boolean;
    className?: string;
};

/** Halal facts strip on the PDP: three scannable facts above the fold. */
export function HalalFacts({
    body,
    valid,
    frozen,
    className,
}: HalalFactsProps) {
    return (
        <ul
            aria-label="Halal summary"
            className={cn(
                'flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm',
                className,
            )}
        >
            <li>
                <HalalBadge status="certified" />
            </li>
            {body && (
                <li className="text-muted-foreground">
                    Certified by{' '}
                    <span className="font-bold text-foreground">{body}</span>
                </li>
            )}
            {valid && (
                <li className="text-muted-foreground">
                    Valid to{' '}
                    <span className="tabular font-bold text-foreground">
                        {valid}
                    </span>
                </li>
            )}
            {frozen && (
                <li className="inline-flex items-center gap-1 text-info">
                    <Snowflake aria-hidden="true" className="size-4" />
                    Ships frozen
                </li>
            )}
        </ul>
    );
}
