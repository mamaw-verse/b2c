import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

/** A button that asks first, then sends a POST/PUT/DELETE with the Inertia router. */
export function ConfirmActionButton({
    label,
    url,
    method = 'delete',
    title,
    text,
    variant = 'outline',
}: {
    label: string;
    url: string;
    method?: 'post' | 'put' | 'delete';
    title: string;
    text: string;
    variant?: 'outline' | 'neutral';
}) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant={variant}
                onClick={() => setOpen(true)}
            >
                {label}
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={title}
                text={text}
                confirmLabel={label}
                cancelLabel="Cancel"
                loading={processing}
                onConfirm={() => {
                    setProcessing(true);
                    router.visit(url, {
                        method,
                        preserveScroll: true,
                        onSuccess: () => setOpen(false),
                        onFinish: () => setProcessing(false),
                    });
                }}
            />
        </>
    );
}
