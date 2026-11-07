import {
    Ban,
    Check,
    Ellipsis,
    EyeOff,
    FileBadge,
    SquarePen,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { ReasonPicker } from '@/components/reason-picker';

export type ModerationAction =
    | 'approve'
    | 'reject'
    | 'request_changes'
    | 'request_certificate'
    | 'hide'
    | 'warn'
    | 'suspend';

export type ModerationActionBarProps = {
    onDecide: (decision: {
        action: string;
        reason?: string;
        note?: string;
        internalNote?: boolean;
    }) => void;
    templates?: string[];
    processing?: boolean;
    resolved?: boolean;
    resolvedState?: string;
};

const DEFAULT_TEMPLATES = [
    'Halal claim not supported by a valid certificate',
    'Certifier is not recognised or certificate is expired',
    'Ingredients conflict with the halal claim',
    'Prohibited or restricted item',
    'Misleading title, photos or price',
    'Contact details or off-platform payment',
    'Incomplete documents',
];

export function ModerationActionBar({
    onDecide,
    templates = DEFAULT_TEMPLATES,
    processing = false,
    resolved = false,
    resolvedState,
}: ModerationActionBarProps) {
    const [rejectOpen, setRejectOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [note, setNote] = useState('');
    const [internalNote, setInternalNote] = useState(false);
    const [rejectError, setRejectError] = useState<string | null>(null);

    if (resolved) {
        return (
            <div className="border-t border-border bg-surface-muted px-gutter py-3 md:px-4">
                <p className="text-body-sm font-semibold text-muted-foreground">
                    This item has been {resolvedState ?? 'resolved'}.
                </p>
            </div>
        );
    }

    const handleRejectSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedReason) {
            setRejectError('Please select a reason.');
            return;
        }
        setRejectError(null);
        onDecide({
            action: 'rejected',
            reason: selectedReason,
            note: note || undefined,
            internalNote,
        });
        setRejectOpen(false);
    };

    return (
        <div className="overflow-hidden rounded-panel border border-border">
            <div className="@container relative border-t border-border bg-surface pb-safe shadow-sticky">
                <div className="flex items-center gap-2 px-gutter py-2 md:px-4">
                    {/* Wide container query inline actions */}
                    <div className="hidden flex-1 flex-wrap gap-2 @3xl:flex">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                                onDecide({
                                    action: 'hidden',
                                    reason: 'Requested changes by moderator',
                                })
                            }
                            className="btn btn-neutral"
                        >
                            <SquarePen aria-hidden="true" className="icon" />
                            <span>Request changes</span>
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                                onDecide({
                                    action: 'flagged',
                                    reason: 'Certificate requested',
                                })
                            }
                            className="btn btn-neutral"
                        >
                            <FileBadge aria-hidden="true" className="icon" />
                            <span>Request certificate</span>
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                                onDecide({
                                    action: 'hidden',
                                    reason: 'Hidden by moderator',
                                })
                            }
                            className="btn btn-neutral"
                        >
                            <EyeOff aria-hidden="true" className="icon" />
                            <span>Hide</span>
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                                onDecide({
                                    action: 'flagged',
                                    reason: 'Warning issued',
                                })
                            }
                            className="btn btn-neutral"
                        >
                            <TriangleAlert
                                aria-hidden="true"
                                className="icon"
                            />
                            <span>Warn</span>
                        </button>
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() =>
                                onDecide({
                                    action: 'suspended',
                                    reason: 'Target suspended by moderator',
                                })
                            }
                            className="btn btn-neutral text-danger"
                        >
                            <Ban aria-hidden="true" className="icon" />
                            <span>Suspend</span>
                        </button>
                    </div>

                    {/* Narrow container query More popover */}
                    <span className="relative @3xl:hidden">
                        <button
                            type="button"
                            className="btn btn-icon btn-neutral"
                            aria-label="More actions"
                            aria-expanded={moreOpen}
                            onClick={() => setMoreOpen(!moreOpen)}
                        >
                            <Ellipsis aria-hidden="true" className="icon" />
                        </button>

                        {moreOpen && (
                            <div
                                role="menu"
                                aria-label="More actions"
                                className="absolute bottom-full left-0 z-modal mb-2 min-w-48 rounded-panel border border-border bg-surface p-1 shadow-popover"
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onDecide({
                                            action: 'hidden',
                                            reason: 'Requested changes',
                                        });
                                    }}
                                    className="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted focus-visible:outline-offset-0"
                                >
                                    <SquarePen
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Request changes
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onDecide({
                                            action: 'flagged',
                                            reason: 'Certificate requested',
                                        });
                                    }}
                                    className="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted focus-visible:outline-offset-0"
                                >
                                    <FileBadge
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Request certificate
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onDecide({
                                            action: 'hidden',
                                            reason: 'Hidden by moderator',
                                        });
                                    }}
                                    className="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted focus-visible:outline-offset-0"
                                >
                                    <EyeOff
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Hide
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onDecide({
                                            action: 'flagged',
                                            reason: 'Warned seller',
                                        });
                                    }}
                                    className="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-foreground hover:bg-surface-muted focus-visible:outline-offset-0"
                                >
                                    <TriangleAlert
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Warn seller
                                </button>
                                <div
                                    role="separator"
                                    className="my-1 border-t border-border"
                                />
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onDecide({
                                            action: 'suspended',
                                            reason: 'Shop suspended',
                                        });
                                    }}
                                    className="flex min-h-touch w-full items-center gap-3 rounded-button px-3 text-left text-body text-danger hover:bg-danger-soft focus-visible:outline-offset-0"
                                >
                                    <Ban
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                    Suspend shop
                                </button>
                            </div>
                        )}
                    </span>

                    {/* Reject button */}
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() => setRejectOpen(true)}
                        className="btn btn-danger btn-lg flex-1 @3xl:flex-none"
                    >
                        <X aria-hidden="true" className="icon" />
                        <span>Reject</span>
                    </button>

                    {/* Approve button */}
                    <button
                        type="button"
                        disabled={processing}
                        onClick={() =>
                            onDecide({
                                action: 'approved',
                                reason: 'Approved by moderator',
                            })
                        }
                        className="btn btn-lg flex-1 @3xl:flex-none"
                    >
                        <Check aria-hidden="true" className="icon" />
                        <span>Approve</span>
                    </button>
                </div>
            </div>

            {/* Reject reason dialog */}
            {rejectOpen && (
                <dialog
                    open
                    aria-labelledby="mab-reject-title"
                    className="z-modal mt-auto mb-0 max-h-[90dvh] w-full rounded-t-panel bg-surface p-0 shadow-sheet transition-[translate,opacity,scale,display,overlay] transition-discrete duration-token md:m-auto md:max-h-[85dvh] md:w-[min(32rem,calc(100vw-2rem))] md:rounded-panel"
                >
                    <form
                        onSubmit={handleRejectSubmit}
                        className="flex max-h-[inherit] flex-col"
                    >
                        <div className="flex justify-center pt-2 md:hidden">
                            <span
                                className="h-1.5 w-10 rounded-full bg-border-control"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="flex items-center gap-2 border-b border-border py-1 pr-1 pl-4 md:py-2">
                            <h2
                                id="mab-reject-title"
                                className="flex-1 text-h3"
                            >
                                Reject listing
                            </h2>
                            <button
                                type="button"
                                className="btn btn-icon btn-ghost text-foreground"
                                aria-label="Close"
                                onClick={() => setRejectOpen(false)}
                            >
                                <X aria-hidden="true" className="icon" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto overscroll-contain p-4">
                            <ReasonPicker
                                templates={templates}
                                required
                                value={selectedReason}
                                note={note}
                                internalNote={internalNote}
                                onChangeValue={setSelectedReason}
                                onChangeNote={setNote}
                                onChangeInternalNote={setInternalNote}
                                error={rejectError ?? undefined}
                            />
                        </div>
                        <div className="flex flex-col gap-2 border-t border-border px-4 pt-3 pb-[calc(.75rem+env(safe-area-inset-bottom,0px))] sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                className="btn btn-neutral"
                                onClick={() => setRejectOpen(false)}
                            >
                                <span>Cancel</span>
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn btn-danger"
                            >
                                <span>Reject listing</span>
                            </button>
                        </div>
                    </form>
                </dialog>
            )}
        </div>
    );
}
