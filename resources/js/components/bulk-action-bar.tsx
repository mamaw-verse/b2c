import { Check, EyeOff, X } from 'lucide-react';

export type BulkActionBarProps = {
    selectedCount: number;
    onApprove?: () => void;
    onReject?: () => void;
    onHide?: () => void;
    onAssignToMe?: () => void;
    onClearSelection?: () => void;
    processing?: boolean;
};

export function BulkActionBar({
    selectedCount,
    onApprove,
    onReject,
    onHide,
    onAssignToMe,
    onClearSelection,
    processing = false,
}: BulkActionBarProps) {
    if (selectedCount <= 0) {
        return null;
    }

    return (
        <div
            data-ds-bulk-bar
            className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top,0px))] z-sticky-bar hidden border-b border-border bg-surface-inverse md:block"
        >
            <div className="on-inverse flex flex-wrap items-center gap-2 px-3 py-2 text-foreground-inverse">
                <p className="flex-1 text-label" aria-live="polite">
                    {selectedCount} selected
                </p>
                {onClearSelection && (
                    <button
                        type="button"
                        onClick={onClearSelection}
                        disabled={processing}
                        className="btn btn-inverse btn-sm"
                    >
                        <span>Deselect all</span>
                    </button>
                )}
                {onApprove && (
                    <button
                        type="button"
                        onClick={onApprove}
                        disabled={processing}
                        className="btn btn-inverse btn-sm"
                    >
                        <Check aria-hidden="true" className="icon" />
                        <span>Approve</span>
                    </button>
                )}
                {onReject && (
                    <button
                        type="button"
                        onClick={onReject}
                        disabled={processing}
                        className="btn btn-inverse btn-sm"
                    >
                        <X aria-hidden="true" className="icon" />
                        <span>Reject</span>
                    </button>
                )}
                {onHide && (
                    <button
                        type="button"
                        onClick={onHide}
                        disabled={processing}
                        className="btn btn-inverse btn-sm"
                    >
                        <EyeOff aria-hidden="true" className="icon" />
                        <span>Hide</span>
                    </button>
                )}
                {onAssignToMe && (
                    <button
                        type="button"
                        onClick={onAssignToMe}
                        disabled={processing}
                        className="btn btn-inverse btn-sm"
                    >
                        <span>Assign to me</span>
                    </button>
                )}
            </div>
        </div>
    );
}
