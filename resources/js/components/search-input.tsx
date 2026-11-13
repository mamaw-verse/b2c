import { router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import {
    useId,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from 'react';
import { cn } from '@/lib/utils';
import { search } from '@/routes';

type SearchInputProps = {
    id?: string;
    value?: string;
    placeholder?: string;
    suggestions?: string[];
    label?: string;
    recent?: string;
    size?: 'md' | 'lg';
    className?: string;
    onSearch?: (query: string) => void;
};

/** Search combobox: suggestions listbox, arrow-key navigation, Enter searches. */
export function SearchInput({
    id,
    value = '',
    placeholder = 'Search products',
    suggestions = [],
    label = 'Search',
    recent,
    size = 'md',
    className,
    onSearch,
}: SearchInputProps) {
    const generatedId = useId();
    const inputId = id ?? `${generatedId}-q`;
    const listId = `${inputId}-list`;
    const [term, setTerm] = useState(value);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = term
        ? suggestions.filter((s) =>
              s.toLowerCase().includes(term.toLowerCase()),
          )
        : suggestions;
    const expanded = open && filtered.length > 0;

    const submit = (q: string) => {
        setOpen(false);
        if (onSearch) {
            onSearch(q);
        } else {
            router.get(search({ query: { q } }).url);
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown' && filtered.length) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((i) => (i + 1) % filtered.length);
        } else if (event.key === 'ArrowUp' && filtered.length) {
            event.preventDefault();
            setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
        } else if (event.key === 'Escape') {
            setOpen(false);
            setActiveIndex(-1);
        } else if (event.key === 'Enter') {
            event.preventDefault();
            submit(activeIndex >= 0 && expanded ? filtered[activeIndex] : term);
        }
    };

    return (
        <form
            role="search"
            className={cn('relative', className)}
            onSubmit={(e: FormEvent) => {
                e.preventDefault();
                submit(term);
            }}
        >
            <label htmlFor={inputId} className="sr-only">
                {label}
            </label>
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
            />
            <input
                ref={inputRef}
                id={inputId}
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={listId}
                aria-activedescendant={
                    activeIndex >= 0
                        ? `${inputId}-opt-${activeIndex}`
                        : undefined
                }
                autoComplete="off"
                enterKeyHint="search"
                value={term}
                placeholder={placeholder}
                onChange={(e) => {
                    setTerm(e.target.value);
                    setOpen(true);
                    setActiveIndex(-1);
                }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                onKeyDown={onKeyDown}
                className={cn(
                    'field rounded-search pl-10',
                    size === 'lg' && 'min-h-touch-primary',
                )}
            />
            <ul
                id={listId}
                role="listbox"
                aria-label="Suggestions"
                hidden={!expanded}
                className="absolute inset-x-0 top-full z-sheet mt-1 max-h-80 overflow-auto rounded-panel border border-border bg-surface py-1 shadow-popover"
            >
                {recent && (
                    <li
                        role="presentation"
                        className="px-3 pt-2 pb-1 text-eyebrow text-muted-foreground uppercase"
                    >
                        {recent}
                    </li>
                )}
                {filtered.map((s, i) => (
                    <li
                        key={s}
                        id={`${inputId}-opt-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            submit(s);
                        }}
                        className="flex min-h-touch cursor-pointer items-center gap-3 px-3 text-body hover:bg-surface-muted aria-selected:bg-primary-soft"
                    >
                        <Search
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                        />
                        <span>{s}</span>
                    </li>
                ))}
            </ul>
        </form>
    );
}
