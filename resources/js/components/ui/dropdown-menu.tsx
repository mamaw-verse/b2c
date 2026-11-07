import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { CheckIcon, ChevronRightIcon, CircleIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

const itemClass =
    'relative flex min-h-touch cursor-default items-center gap-3 rounded-button px-3 text-body text-foreground outline-none select-none hover:bg-surface-muted focus:bg-surface-muted data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4';
const panelClass =
    'z-sheet min-w-48 overflow-hidden rounded-panel border border-border bg-surface p-1 text-foreground shadow-popover';

function DropdownMenu(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.Root>,
) {
    return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>,
) {
    return (
        <DropdownMenuPrimitive.Portal
            data-slot="dropdown-menu-portal"
            {...props}
        />
    );
}

function DropdownMenuTrigger(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>,
) {
    return (
        <DropdownMenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            {...props}
        />
    );
}

function DropdownMenuContent({
    className,
    sideOffset = 4,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.Content
                data-slot="dropdown-menu-content"
                sideOffset={sideOffset}
                className={cn(panelClass, className)}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

function DropdownMenuGroup(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.Group>,
) {
    return (
        <DropdownMenuPrimitive.Group
            data-slot="dropdown-menu-group"
            {...props}
        />
    );
}

function DropdownMenuItem({
    className,
    inset,
    variant = 'default',
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
}) {
    return (
        <DropdownMenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-inset={inset}
            data-variant={variant}
            className={cn(
                itemClass,
                inset && 'pl-8',
                variant === 'destructive' &&
                    'text-danger hover:bg-danger-soft focus:bg-danger-soft',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuCheckboxItem({
    className,
    children,
    checked,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
    return (
        <DropdownMenuPrimitive.CheckboxItem
            data-slot="dropdown-menu-checkbox-item"
            className={cn(itemClass, 'pl-8', className)}
            checked={checked}
            {...props}
        >
            <span className="absolute left-2 grid size-4 place-items-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CheckIcon className="size-4" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.CheckboxItem>
    );
}

function DropdownMenuRadioGroup(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>,
) {
    return (
        <DropdownMenuPrimitive.RadioGroup
            data-slot="dropdown-menu-radio-group"
            {...props}
        />
    );
}

function DropdownMenuRadioItem({
    className,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
    return (
        <DropdownMenuPrimitive.RadioItem
            data-slot="dropdown-menu-radio-item"
            className={cn(itemClass, 'pl-8', className)}
            {...props}
        >
            <span className="absolute left-2 grid size-4 place-items-center">
                <DropdownMenuPrimitive.ItemIndicator>
                    <CircleIcon className="size-2 fill-current" />
                </DropdownMenuPrimitive.ItemIndicator>
            </span>
            {children}
        </DropdownMenuPrimitive.RadioItem>
    );
}

function DropdownMenuLabel({
    className,
    inset,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.Label
            data-slot="dropdown-menu-label"
            data-inset={inset}
            className={cn(
                'px-3 pt-2 pb-1 text-eyebrow text-muted-foreground uppercase',
                inset && 'pl-8',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSeparator({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
    return (
        <DropdownMenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn('my-1 border-t border-border', className)}
            {...props}
        />
    );
}

function DropdownMenuShortcut({
    className,
    ...props
}: React.ComponentProps<'span'>) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn(
                'ml-auto text-caption tracking-widest text-muted-foreground',
                className,
            )}
            {...props}
        />
    );
}

function DropdownMenuSub(
    props: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>,
) {
    return (
        <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />
    );
}

function DropdownMenuSubTrigger({
    className,
    inset,
    children,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
}) {
    return (
        <DropdownMenuPrimitive.SubTrigger
            data-slot="dropdown-menu-sub-trigger"
            data-inset={inset}
            className={cn(itemClass, inset && 'pl-8', className)}
            {...props}
        >
            {children}
            <ChevronRightIcon className="ml-auto size-4" />
        </DropdownMenuPrimitive.SubTrigger>
    );
}

function DropdownMenuSubContent({
    className,
    ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
    return (
        <DropdownMenuPrimitive.Portal>
            <DropdownMenuPrimitive.SubContent
                data-slot="dropdown-menu-sub-content"
                className={cn(panelClass, className)}
                {...props}
            />
        </DropdownMenuPrimitive.Portal>
    );
}

export {
    DropdownMenu,
    DropdownMenuPortal,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuLabel,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
};
