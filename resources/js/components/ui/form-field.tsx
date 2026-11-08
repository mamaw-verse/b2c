import { CircleAlert } from 'lucide-react';
import {
    cloneElement,
    isValidElement,
    useId,
    type ComponentProps,
    type ReactElement,
    type ReactNode,
} from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type FormFieldProps = ComponentProps<'div'> & {
    id?: string;
    label: string;
    required?: boolean;
    optional?: boolean;
    help?: ReactNode;
    error?: string;
    counter?: ReactNode;
    hideLabel?: boolean;
    labelAction?: ReactNode;
    children: ReactElement;
};

function FormField({
    id,
    label,
    required = false,
    optional = false,
    help,
    error,
    counter,
    hideLabel = false,
    labelAction,
    className,
    children,
    ...props
}: FormFieldProps) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    const helpId = `${fieldId}-help`;
    const errorId = `${fieldId}-error`;
    const countId = `${fieldId}-count`;
    const describedBy = [
        help ? helpId : null,
        error ? errorId : null,
        counter ? countId : null,
    ]
        .filter(Boolean)
        .join(' ');

    const control = isValidElement(children)
        ? cloneElement(children, {
              id: fieldId,
              required,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': describedBy || undefined,
          } as Record<string, unknown>)
        : children;

    return (
        <div className={cn('grid gap-1.5', className)} {...props}>
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={fieldId} className={hideLabel ? 'sr-only' : ''}>
                    {label}
                    {required && (
                        <span className="text-danger-text" aria-hidden="true">
                            {' '}
                            *
                        </span>
                    )}
                    {optional && (
                        <span className="font-normal text-muted-foreground">
                            {' '}
                            (optional)
                        </span>
                    )}
                </Label>
                {labelAction}
            </div>
            {control}
            {(help || counter) && (
                <div className="flex gap-2">
                    {help && (
                        <p
                            id={helpId}
                            className="text-body-sm text-muted-foreground"
                        >
                            {help}
                        </p>
                    )}
                    {counter && (
                        <p
                            id={countId}
                            className="tabular ml-auto shrink-0 text-body-sm text-muted-foreground"
                            aria-live="polite"
                        >
                            {counter}
                        </p>
                    )}
                </div>
            )}
            {error && (
                <p
                    id={errorId}
                    className="flex items-start gap-1 text-body-sm font-bold text-danger-text"
                >
                    <CircleAlert className="mt-px size-4" aria-hidden="true" />
                    <span>{error}</span>
                </p>
            )}
        </div>
    );
}

export { FormField };
