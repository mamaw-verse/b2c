import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

type DrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
};

function Drawer({ open, onOpenChange, title, children }: DrawerProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent kind="drawer" showClose={false}>
                <div className="flex items-center gap-2 border-b border-border py-2 pr-1 pl-4">
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
            </DialogContent>
        </Dialog>
    );
}

export { Drawer };
