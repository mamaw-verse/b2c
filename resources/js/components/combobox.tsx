import { ChevronDown, CircleAlert } from 'lucide-react';
import { useId, useMemo, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export type ComboboxOption = {
    value: string;
    label: string;
};

type ComboboxProps = {
    id?: string;
    name?: string;
    label?: string;
    options: ComboboxOption[];
    value?: string;
    onChange?: (value: string) => void;
    onSearch?: (query: string) => void;
    required?: boolean;
    error?: string;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
};

function normalizeString(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

export function Combobox({
    id: explicitId,
    name,
    label,
    options,
    value = '',
    onChange,
    onSearch,
    required = false,
    error,
    disabled = false,
    placeholder,
    className,
}: ComboboxProps) {
    const generatedId = useId();
    const id = explicitId ?? generatedId;
    const listId = `${id}-list`;
    const errorId = `${id}-error`;

    const selectedOption = options.find((opt) => opt.value === value);
    const [query, setQuery] = useState(selectedOption?.label ?? '');
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (selectedOption) {
            setQuery(selectedOption.label);
        } else if (!value) {
            setQuery('');
        }
    }, [value, selectedOption]);

    const filteredOptions = useMemo(() => {
        if (!query.trim()) {
            return options;
        }
        const normalizedQuery = normalizeString(query);
        return options.filter((opt) =>
            normalizeString(opt.label).includes(normalizedQuery),
        );
    }, [options, query]);

    // Handle clicks outside to close
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setActiveIndex(-1);
                // Reset query back to selected label if closed without selecting
                if (selectedOption) {
                    setQuery(selectedOption.label);
                } else if (!value) {
                    setQuery('');
                }
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedOption, value]);

    const handleSelect = (opt: ComboboxOption) => {
        setQuery(opt.label);
        setOpen(false);
        setActiveIndex(-1);
        onChange?.(opt.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (disabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) {
                setOpen(true);
                setActiveIndex(0);
            } else {
                setActiveIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : prev,
                );
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (open) {
                setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
            }
        } else if (e.key === 'Enter') {
            if (open && activeIndex >= 0 && filteredOptions[activeIndex]) {
                e.preventDefault();
                handleSelect(filteredOptions[activeIndex]);
            }
        } else if (e.key === 'Escape') {
            if (open) {
                e.preventDefault();
                setOpen(false);
                setActiveIndex(-1);
            }
        }
    };

    return (
        <div className={cn('grid gap-1.5', className)} ref={wrapperRef}>
            {label && (
                <div className="flex items-baseline justify-between gap-2">
                    <label htmlFor={id} className="text-label text-foreground">
                        {label}
                        {required && (
                            <span className="text-danger" aria-hidden="true">
                                {' '}
                                *
                            </span>
                        )}
                    </label>
                </div>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    id={id}
                    name={name}
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls={listId}
                    aria-activedescendant={
                        open && activeIndex >= 0
                            ? `${id}-opt-${activeIndex}`
                            : undefined
                    }
                    aria-describedby={error ? errorId : undefined}
                    aria-invalid={Boolean(error)}
                    autoComplete="off"
                    value={query}
                    disabled={disabled}
                    placeholder={placeholder}
                    required={required}
                    onFocus={() => {
                        if (!disabled) setOpen(true);
                    }}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        setActiveIndex(0);
                        onSearch?.(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    className="field pr-10"
                />
                <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
                />

                {open && (
                    <ul
                        id={listId}
                        role="listbox"
                        aria-label={label ?? 'Options'}
                        className="absolute inset-x-0 top-full z-sheet mt-1 max-h-64 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover"
                    >
                        {filteredOptions.length === 0 ? (
                            <li className="px-3 py-3 text-body text-muted-foreground select-none">
                                No matches
                            </li>
                        ) : (
                            filteredOptions.map((opt, idx) => {
                                const isSelected = opt.value === value;
                                const isActive = idx === activeIndex;
                                return (
                                    <li
                                        key={opt.value}
                                        id={`${id}-opt-${idx}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelect(opt)}
                                        onMouseEnter={() => setActiveIndex(idx)}
                                        className={cn(
                                            'flex min-h-touch cursor-pointer items-center justify-between gap-3 px-3 text-body select-none',
                                            isSelected &&
                                                'bg-primary-soft font-bold text-foreground',
                                            isActive &&
                                                !isSelected &&
                                                'bg-surface-muted',
                                        )}
                                    >
                                        <span>{opt.label}</span>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                )}
            </div>

            {error && (
                <p
                    id={errorId}
                    className="flex items-start gap-1 text-body-sm font-bold text-danger"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-px size-4 shrink-0"
                    />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}
