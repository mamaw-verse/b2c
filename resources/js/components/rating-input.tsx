import { AlertCircle, Star } from 'lucide-react';
import { useId, useState } from 'react';

export type RatingInputProps = {
    value: number;
    onChange?: (value: number) => void;
    name?: string;
    legend?: string;
    size?: 'default' | 'compact';
    error?: string;
    idPrefix?: string;
    disabled?: boolean;
    className?: string;
};

export function RatingInput({
    value,
    onChange,
    name = 'rating',
    legend = 'Rate this product',
    size = 'default',
    error,
    idPrefix,
    disabled = false,
    className = '',
}: RatingInputProps) {
    const autoId = useId();
    const prefix = idPrefix ?? autoId;
    const [hoverValue, setHoverValue] = useState<number | null>(null);

    const activeValue = hoverValue ?? value;
    const starSizeClass = size === 'compact' ? 'size-6' : 'size-9';

    return (
        <fieldset
            className={`grid gap-1 ${className}`}
            aria-describedby={error ? `${prefix}-error` : undefined}
            disabled={disabled}
        >
            {legend && (
                <legend className="text-label text-foreground">{legend}</legend>
            )}
            <div
                className="flex items-center"
                data-ds-rating
                onPointerLeave={() => setHoverValue(null)}
            >
                {[1, 2, 3, 4, 5].map((star) => {
                    const id = `${prefix}-${star}`;
                    const isOn = star <= activeValue;

                    return (
                        <span
                            key={star}
                            className="relative inline-flex items-center"
                        >
                            <input
                                type="radio"
                                id={id}
                                name={name}
                                value={star}
                                checked={value === star}
                                onChange={() => onChange?.(star)}
                                className="sr-only"
                                disabled={disabled}
                            />
                            <label
                                htmlFor={id}
                                data-on={isOn ? true : undefined}
                                onPointerOver={() => setHoverValue(star)}
                                className={`focus-ring grid min-h-touch min-w-touch cursor-pointer place-items-center rounded-button text-border-control transition-colors duration-150 data-[on]:text-rating ${
                                    disabled
                                        ? 'cursor-not-allowed opacity-50'
                                        : ''
                                }`}
                            >
                                <Star
                                    className={`${starSizeClass} fill-current`}
                                    aria-hidden="true"
                                />
                                <span className="sr-only">
                                    {star} {star === 1 ? 'star' : 'stars'}
                                </span>
                            </label>
                        </span>
                    );
                })}
            </div>
            {error && (
                <p
                    id={`${prefix}-error`}
                    className="flex items-start gap-1 text-body-sm font-bold text-danger-text"
                >
                    <AlertCircle
                        className="mt-px size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span>{error}</span>
                </p>
            )}
        </fieldset>
    );
}
