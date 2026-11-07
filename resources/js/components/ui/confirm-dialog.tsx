import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';

type ConfirmDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    text: string;
    confirmLabel: string;
    cancelLabel: string;
    tone?: 'danger' | 'primary';
    onConfirm?: () => void;
    loading?: boolean;
    children?: ReactNode;
};

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    text,
    confirmLabel,
    cancelLabel,
    tone = 'danger',
    onConfirm,
    loading = false,
    children,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                showClose={false}
                className="w-[min(24rem,calc(100vw-2rem))]"
            >
                <div className="flex items-center gap-2 px-5 pt-5">
                    <DialogTitle className="flex-1">{title}</DialogTitle>
                </div>
                <DialogDescription className="overflow-y-auto overscroll-contain px-5 pt-2 pb-5">
                    {text}
                    {children}
                </DialogDescription>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="neutral" autoFocus>
                            {cancelLabel}
                        </Button>
                    </DialogClose>
                    <Button
                        variant={tone}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export { ConfirmDialog };
