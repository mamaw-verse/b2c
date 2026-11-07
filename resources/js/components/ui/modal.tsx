import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    kind?: 'responsive' | 'modal' | 'sheet';
    footer?: ReactNode;
    initialFocus?: string;
    children: ReactNode;
};

function Modal({
    open,
    onOpenChange,
    title,
    kind = 'responsive',
    footer,
    initialFocus,
    children,
}: ModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                kind={kind}
                showClose={false}
                initialFocus={initialFocus}
            >
                {kind !== 'modal' && (
                    <div className="flex justify-center pt-2 md:hidden">
                        <span
                            className="h-1.5 w-10 rounded-full bg-border-control"
                            aria-hidden="true"
                        />
                    </div>
                )}
                <div className="flex items-center gap-2 border-b border-border py-1 pr-1 pl-4 md:py-2">
                    <DialogTitle className="flex-1">{title}</DialogTitle>
                    <DialogClose
                        className="btn btn-icon btn-ghost text-foreground"
                        aria-label="Close"
                    >
                        <X aria-hidden="true" />
                    </DialogClose>
                </div>
                <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                    {children}
                </div>
                {footer && (
                    <div
                        className={cn(
                            'flex flex-col gap-2 border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] sm:flex-row sm:justify-end',
                        )}
                    >
                        {footer}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export { Modal };
