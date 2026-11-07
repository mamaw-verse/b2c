import { Eye, EyeOff } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export default function PasswordInput({
    className,
    ref,
    ...props
}: Omit<ComponentProps<'input'>, 'type'> & { ref?: Ref<HTMLInputElement> }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <Input
                type={showPassword ? 'text' : 'password'}
                className={cn('pr-12', className)}
                ref={ref}
                {...props}
            />
            <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute inset-y-0 right-0 flex min-w-touch items-center justify-center rounded-r-field px-3 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
            >
                {showPassword ? (
                    <EyeOff className="size-5" aria-hidden="true" />
                ) : (
                    <Eye className="size-5" aria-hidden="true" />
                )}
            </button>
        </div>
    );
}
