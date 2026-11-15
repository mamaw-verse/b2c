import { Form, router } from '@inertiajs/react';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';

type FormModalProps = {
    title: string;
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    /** Called on Cancel, Esc, backdrop click and after a successful save. */
    onClose: () => void;
    /** Left side of the footer, e.g. a ModalDeleteButton. */
    footerStart?: ReactNode;
    children: (errors: Record<string, string>) => ReactNode;
};

/**
 * A create/edit form inside a modal. Mount it only while it is needed
 * (`{open && <FormModal … />}`): a fresh mount resets defaultValues and errors.
 * The modal sits inside the Inertia <Form>, so the footer submit button needs no
 * `form=` attribute and can read `processing`.
 */
export function FormModal({
    title,
    action,
    method,
    submitLabel,
    onClose,
    footerStart,
    children,
}: FormModalProps) {
    return (
        <Form
            action={action}
            method={method}
            options={{ preserveScroll: true }}
            onSuccess={onClose}
        >
            {({ errors, processing }) => (
                <Modal
                    open
                    onOpenChange={(open) => !open && onClose()}
                    title={title}
                    initialFocus='input:not([type="hidden"]), select, textarea'
                    footer={
                        <>
                            {footerStart && (
                                <div className="order-last sm:order-none sm:mr-auto">
                                    {footerStart}
                                </div>
                            )}
                            <Button
                                type="button"
                                variant="neutral"
                                onClick={onClose}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={processing}>
                                {submitLabel}
                            </Button>
                        </>
                    }
                >
                    {children(errors)}
                </Modal>
            )}
        </Form>
    );
}

/** Delete button with a confirm dialog. A plain button + router call, never a nested <form>. */
export function ModalDeleteButton({
    url,
    title,
    text,
    onDone,
}: {
    url: string;
    title: string;
    text: string;
    onDone: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const confirm = () => {
        setProcessing(true);
        router.delete(url, {
            preserveScroll: true,
            onSuccess: onDone,
            onError: (errors) =>
                setError(Object.values(errors)[0] ?? 'Could not delete.'),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={() => {
                    setError(null);
                    setOpen(true);
                }}
            >
                Delete
            </Button>
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title={title}
                text={text}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                loading={processing}
                onConfirm={confirm}
            >
                {error && (
                    <span
                        role="alert"
                        className="mt-2 block font-bold text-danger-text"
                    >
                        {error}
                    </span>
                )}
            </ConfirmDialog>
        </>
    );
}
