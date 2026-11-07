import type { LucideIcon } from 'lucide-react';
import { Monitor, Moon, Sun } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import type { Appearance } from '@/hooks/use-appearance';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';

export default function AppearanceToggleTab({
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    const { appearance, updateAppearance } = useAppearance();

    const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
        { value: 'light', icon: Sun, label: 'Light' },
        { value: 'dark', icon: Moon, label: 'Dark' },
        { value: 'system', icon: Monitor, label: 'System' },
    ];

    return (
        <div
            role="radiogroup"
            aria-label="Appearance"
            className={cn(
                'inline-flex gap-1 rounded-panel border border-border bg-surface-muted p-1',
                className,
            )}
            {...props}
        >
            {tabs.map(({ value, icon: Icon, label }) => {
                const checked = appearance === value;

                return (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => updateAppearance(value)}
                        className={cn(
                            'flex min-h-9 items-center rounded-button px-3.5 text-label transition-colors duration-token',
                            checked
                                ? 'bg-surface text-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                        )}
                    >
                        <Icon className="mr-1.5 size-4" aria-hidden="true" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}
