import { cn } from '@/lib/utils';

type SegmentedControlProps = {
    name: string;
    options: string[];
    selected?: number;
    label: string;
    block?: boolean;
    size?: 'sm' | 'md';
    onChange?: (index: number) => void;
    className?: string;
};

/** Segmented control built on native radios (arrow keys built in). */
export function SegmentedControl({
    name,
    options,
    selected = 0,
    label,
    block = false,
    size = 'md',
    onChange,
    className,
}: SegmentedControlProps) {
    return (
        <fieldset
            className={cn(
                block ? 'flex' : 'inline-flex',
                'rounded-button bg-surface-muted p-1',
                className,
            )}
        >
            <legend className="sr-only">{label}</legend>
            {options.map((option, i) => (
                <label
                    key={i}
                    className={cn(
                        'relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-button px-3 text-label whitespace-nowrap text-muted-foreground hover:text-foreground has-checked:bg-surface has-checked:text-foreground has-checked:shadow-card-hover has-focus-visible:outline-3 has-focus-visible:outline-ring',
                        size === 'sm'
                            ? 'min-h-9 min-w-11 after:absolute after:-inset-y-1'
                            : 'min-h-touch',
                    )}
                >
                    <input
                        type="radio"
                        name={name}
                        className="sr-only"
                        defaultChecked={i === selected}
                        onChange={() => onChange?.(i)}
                    />
                    {option}
                </label>
            ))}
        </fieldset>
    );
}
