import { KeyRound, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Passkey } from '@/types/auth';

type Props = {
    passkey: Passkey;
    onDelete: (id: number, onError: () => void) => void;
};

export default function PasskeyItem({ passkey, onDelete }: Props) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        onDelete(passkey.id, () => setIsDeleting(false));
        setConfirmOpen(false);
    };

    return (
        <div className="flex items-center justify-between gap-4 border-b border-border p-4 last:border-b-0">
            <div className="flex min-w-0 items-center gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-primary-soft text-primary-text">
                    <KeyRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-label">{passkey.name}</p>
                        {passkey.authenticator && (
                            <Badge variant="neutral">
                                {passkey.authenticator}
                            </Badge>
                        )}
                    </div>
                    <p className="text-body-sm text-muted-foreground">
                        Added {passkey.created_at_diff}
                        {passkey.last_used_at_diff &&
                            ` · Last used ${passkey.last_used_at_diff}`}
                    </p>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="text-danger-text hover:bg-danger-soft"
                aria-label={`Remove ${passkey.name}`}
                onClick={() => setConfirmOpen(true)}
            >
                <Trash2 aria-hidden="true" />
            </Button>
            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={`Remove ${passkey.name}?`}
                text="You will no longer be able to use this passkey to sign in."
                confirmLabel="Remove passkey"
                cancelLabel="Keep passkey"
                onConfirm={handleDelete}
                loading={isDeleting}
            />
        </div>
    );
}
