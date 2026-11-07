import * as AvatarPrimitive from '@radix-ui/react-avatar';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const sizes = {
    sm: 'size-8 text-caption',
    md: 'size-10 text-label',
    lg: 'size-14 text-h4',
    xl: 'size-20 text-h3',
};

function Avatar({
    className,
    size = 'sm',
    shape = 'circle',
    ...props
}: ComponentProps<typeof AvatarPrimitive.Root> & {
    size?: keyof typeof sizes;
    shape?: 'circle' | 'tile';
}) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(
                'relative inline-grid shrink-0 place-items-center overflow-hidden bg-success-soft font-bold text-success',
                shape === 'tile' ? 'rounded-tile' : 'rounded-full',
                sizes[size],
                className,
            )}
            {...props}
        />
    );
}

function AvatarImage({
    className,
    ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn('aspect-square size-full object-cover', className)}
            {...props}
        />
    );
}

function AvatarFallback({
    className,
    ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                'grid size-full place-items-center font-bold',
                className,
            )}
            {...props}
        />
    );
}

export { Avatar, AvatarImage, AvatarFallback };
