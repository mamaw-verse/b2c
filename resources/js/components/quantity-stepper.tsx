import { Minus, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { cn } from '@/lib/utils';

type QuantityStepperProps = {
    value?: number;
    min?: number;
    max?: number;
    label?: string;
    disabled?: boolean;
    onChange?: (value: number) => void;
    className?: string;
};

/** −/+ buttons around a numeric input, clamped to min/max. */
export function QuantityStepper({
    value,
    min = 1,
    max = 99,
    label = 'Quantity',
    disabled = false,
    onChange,
    className,
}: QuantityStepperProps) {
    const id = useId();
    const [internal, setInternal] = useState(value ?? min);
    const current = value ?? internal;

    const setValue = (next: number) => {
        const clamped = Math.min(max, Math.max(min, next));
        setInternal(clamped);
        onChange?.(clamped);
    };

    const btnCls =
        'btn btn-ghost btn-icon rounded-none border-0 text-foreground hover:bg-surface-muted active:bg-border disabled:text-muted-foreground';

    return (
        <div
            role="group"
            aria-label={label}
            className={cn(
                'inline-flex items-stretch overflow-hidden rounded-field border border-border-control bg-surface',
                className,
            )}
        >
            <button
                type="button"
                className={btnCls}
                aria-label={`Decrease ${label.toLowerCase()}`}
                disabled={disabled || current <= min}
                onClick={() => setValue(current - 1)}
            >
                <Minus aria-hidden="true" className="size-4" />
            </button>
            <label htmlFor={id} className="sr-only">
                {label}
            </label>
            <input
                id={id}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={current}
                min={min}
                max={max}
                disabled={disabled}
                onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n)) {
                        setValue(n);
                    }
                }}
                className="tabular w-12 border-x border-border-control bg-transparent text-center text-input font-bold focus-visible:outline-offset-0"
            />
            <button
                type="button"
                className={btnCls}
                aria-label={`Increase ${label.toLowerCase()}`}
                disabled={disabled || current >= max}
                onClick={() => setValue(current + 1)}
            >
                <Plus aria-hidden="true" className="size-4" />
            </button>
            <p className="sr-only" aria-live="polite">
                {current}
            </p>
        </div>
    );
}
