import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type SelectOption = string | { value: string; label: string };

type SelectProps = ComponentProps<'select'> & {
    options?: SelectOption[];
    placeholder?: string;
};

function Select({
    className,
    options,
    placeholder,
    children,
    ...props
}: SelectProps) {
    return (
        <select
            data-slot="select"
            className={cn('field', className)}
            {...props}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((option) =>
                typeof option === 'string' ? (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ) : (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ),
            )}
            {children}
        </select>
    );
}

export { Select };
