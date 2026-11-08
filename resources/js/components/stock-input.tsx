import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface StockInputProps {
    id?: string;
    value: number | string;
    onChange: (value: number) => void;
    low?: number;
    error?: string;
    disabled?: boolean;
    className?: string;
}

export function StockInput({
    id = 'stock-input',
    value,
    onChange,
    low = 10,
    error,
    disabled = false,
    className,
}: StockInputProps) {
    const numValue =
        typeof value === 'string' ? parseInt(value, 10) || 0 : value;
    const isLow = numValue <= low && !error;

    return (
        <FormField
            id={id}
            label="Stock"
            required
            error={error}
            help={
                isLow ? (
                    <span className="font-bold text-warning-text">
                        Low stock: you’ll be reminded below {low}.
                    </span>
                ) : (
                    'Available units for sale.'
                )
            }
            className={className}
        >
            <div className="relative">
                <Input
                    id={id}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={value}
                    onChange={(e) =>
                        onChange(parseInt(e.target.value, 10) || 0)
                    }
                    disabled={disabled}
                    aria-invalid={Boolean(error)}
                    className={cn(
                        'field tabular pr-16',
                        error && 'border-danger',
                    )}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-body text-muted-foreground">
                    units
                </span>
            </div>
        </FormField>
    );
}
