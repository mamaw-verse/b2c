import { Store } from 'lucide-react';
import { cn } from '@/lib/utils';

type BrandMarkProps = {
    name: string;
    showName?: boolean;
    className?: string;
};

export function BrandMark({
    name,
    showName = true,
    className,
}: BrandMarkProps) {
    return (
        <span className={cn('flex items-center gap-2 text-primary-text', className)}>
            <span
                className="grid size-8 place-items-center rounded-tile bg-primary text-primary-foreground"
                aria-hidden="true"
            >
                <Store className="size-5" />
            </span>
            {showName && <span className="text-h4">{name}</span>}
        </span>
    );
}
