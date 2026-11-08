import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type VerifiedBadgeProps = {
    label?: string;
    tone?: 'soft' | 'solid' | 'outline';
    size?: 'sm' | 'md';
};

export function VerifiedBadge({
    label = 'Verified',
    tone = 'soft',
    size = 'md',
}: VerifiedBadgeProps) {
    return (
        <span
            className={cn(
                'badge',
                tone === 'solid'
                    ? 'badge-solid'
                    : tone === 'outline'
                      ? 'border border-primary bg-surface text-primary-text'
                      : '',
                size === 'sm' && 'px-1.5',
            )}
        >
            <BadgeCheck aria-hidden="true" className="size-3.5" />
            {label}
        </span>
    );
}
