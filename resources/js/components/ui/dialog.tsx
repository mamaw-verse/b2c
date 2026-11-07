import { Slot } from '@radix-ui/react-slot';
import { X } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useId,
    useRef,
    useState,
    type ComponentProps,
    type MouseEvent as ReactMouseEvent,
    type ReactNode,
    type Ref,
} from 'react';
import { cn } from '@/lib/utils';

type DialogContextValue = {
    open: boolean;
    setOpen: (open: boolean) => void;
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    titleId: string;
    descriptionId: string;
};

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string) {
    const context = useContext(DialogContext);

    if (!context) {
        throw new Error(`${component} must be used inside Dialog`);
    }

    return context;
}

function composeRefs<T>(...refs: Array<Ref<T> | undefined>) {
    return (node: T) => {
        refs.forEach((ref) => {
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        });
    };
}

type DialogProps = {
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: ReactNode;
};

function Dialog({
    open: controlledOpen,
    defaultOpen = false,
    onOpenChange,
    children,
}: DialogProps) {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = controlledOpen ?? uncontrolledOpen;
    const dialogRef = useRef<HTMLDialogElement | null>(null);
    const titleId = useId();
    const descriptionId = useId();

    const setOpen = useCallback(
        (nextOpen: boolean) => {
            if (controlledOpen === undefined) {
                setUncontrolledOpen(nextOpen);
            }
            onOpenChange?.(nextOpen);
        },
        [controlledOpen, onOpenChange],
    );

    return (
        <DialogContext.Provider
            value={{ open, setOpen, dialogRef, titleId, descriptionId }}
        >
            {children}
        </DialogContext.Provider>
    );
}

function DialogTrigger({
    asChild = false,
    onClick,
    children,
    ...props
}: ComponentProps<'button'> & { asChild?: boolean }) {
    const { setOpen } = useDialogContext('DialogTrigger');
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            type={asChild ? undefined : 'button'}
            data-slot="dialog-trigger"
            aria-haspopup="dialog"
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    setOpen(true);
                }
            }}
            {...props}
        >
            {children}
        </Comp>
    );
}

function DialogPortal({ children }: { children?: ReactNode }) {
    return children;
}

function DialogOverlay() {
    return null;
}

function DialogClose({
    asChild = false,
    onClick,
    children,
    ...props
}: ComponentProps<'button'> & { asChild?: boolean }) {
    const { setOpen } = useDialogContext('DialogClose');
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            type={asChild ? undefined : 'button'}
            data-slot="dialog-close"
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    setOpen(false);
                }
            }}
            {...props}
        >
            {children}
        </Comp>
    );
}

type DialogContentProps = ComponentProps<'dialog'> & {
    kind?: 'modal' | 'responsive' | 'sheet' | 'drawer';
    showClose?: boolean;
    initialFocus?: string;
};

function DialogContent({
    className,
    children,
    kind = 'modal',
    showClose = true,
    initialFocus,
    onClose,
    onCancel,
    onClick,
    onMouseDown,
    onMouseUp,
    ref,
    ...props
}: DialogContentProps) {
    const { open, setOpen, dialogRef, titleId, descriptionId } =
        useDialogContext('DialogContent');
    const backdropPointerDown = useRef(false);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        if (open && !dialog.open) {
            dialog.showModal();
            const target = initialFocus
                ? dialog.querySelector<HTMLElement>(initialFocus)
                : dialog.querySelector<HTMLElement>(
                      '[autofocus], input, select, textarea, button',
                  );
            target?.focus();
        }

        if (!open && dialog.open) {
            dialog.close();
        }
    }, [open, dialogRef, initialFocus]);

    const handleBackdropClick = (event: ReactMouseEvent<HTMLDialogElement>) => {
        if (
            event.target === event.currentTarget &&
            backdropPointerDown.current
        ) {
            setOpen(false);
        }
        backdropPointerDown.current = false;
    };

    const kindClasses = {
        modal: 'm-auto w-[min(32rem,calc(100vw-2rem))] max-h-[85dvh] rounded-panel starting:open:scale-95 starting:open:opacity-0',
        responsive:
            'mt-auto mb-0 max-h-[90dvh] w-full rounded-t-panel starting:open:translate-y-full md:m-auto md:max-h-[85dvh] md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel md:starting:open:translate-y-4 md:starting:open:opacity-0',
        sheet: 'mt-auto mb-0 max-h-[90dvh] w-full rounded-t-panel starting:open:translate-y-full',
        drawer: 'my-0 mr-auto ml-0 h-dvh max-h-dvh w-[min(20rem,85vw)] rounded-r-panel starting:open:-translate-x-full',
    };

    return (
        <dialog
            ref={composeRefs<HTMLDialogElement | null>(dialogRef, ref)}
            data-slot="dialog-content"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className={cn(
                'z-modal bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token',
                kindClasses[kind],
                className,
            )}
            onClose={(event) => {
                onClose?.(event);
                setOpen(false);
            }}
            onCancel={(event) => {
                onCancel?.(event);
                if (!event.defaultPrevented) {
                    setOpen(false);
                }
            }}
            onMouseDown={(event) => {
                onMouseDown?.(event);
                backdropPointerDown.current =
                    event.target === event.currentTarget;
            }}
            onMouseUp={onMouseUp}
            onClick={(event) => {
                onClick?.(event);
                handleBackdropClick(event);
            }}
            {...props}
        >
            <div
                className={cn(
                    'flex max-h-[inherit] flex-col',
                    kind === 'drawer' && 'h-full',
                )}
            >
                {children}
            </div>
            {showClose && (
                <DialogClose
                    className="btn btn-icon btn-ghost absolute top-2 right-2 text-foreground"
                    aria-label="Close"
                >
                    <X aria-hidden="true" />
                </DialogClose>
            )}
        </dialog>
    );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-header"
            className={cn('flex flex-col gap-2 px-5 pt-5', className)}
            {...props}
        />
    );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                'flex flex-col gap-2 px-5 pb-5 sm:flex-row sm:justify-end',
                className,
            )}
            {...props}
        />
    );
}

function DialogTitle({ className, ...props }: ComponentProps<'h2'>) {
    const { titleId } = useDialogContext('DialogTitle');

    return (
        <h2
            id={titleId}
            data-slot="dialog-title"
            className={cn('text-h3', className)}
            {...props}
        />
    );
}

function DialogDescription({ className, ...props }: ComponentProps<'p'>) {
    const { descriptionId } = useDialogContext('DialogDescription');

    return (
        <p
            id={descriptionId}
            data-slot="dialog-description"
            className={cn('text-body text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogOverlay,
    DialogPortal,
    DialogTitle,
    DialogTrigger,
};
