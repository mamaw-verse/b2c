import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as React from 'react';
import { cn } from '@/lib/utils';

function TooltipProvider({
    delayDuration = 0,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delayDuration={delayDuration}
            {...props}
        />
    );
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger(
    props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
    className,
    sideOffset = 4,
    children,
    ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn(
                    'z-toast max-w-56 rounded-badge bg-surface-inverse px-2 py-1 text-caption text-foreground-inverse shadow-popover',
                    className,
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className="fill-surface-inverse" />
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
