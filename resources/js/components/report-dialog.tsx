import { ImagePlus, X } from 'lucide-react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { toast } from 'sonner';

export interface ReportDialogProps {
    open: boolean;
    onClose: () => void;
    targetType: 'product' | 'review' | 'shop' | 'conversation' | 'user';
    targetId: string;
    targetTitle?: string;
    reasons?: string[];
}

const defaultListingReasons = [
    'Halal claim conflicts with ingredients',
    'Prohibited item',
    'Misleading description or price',
    'Offensive content',
    'Scam or asks to pay outside the app',
    'Other',
];

const defaultUserShopReasons = [
    'Harassment or inappropriate behaviour',
    'Asks to pay outside the app',
    'Suspected fraudulent seller or scam',
    'Prohibited products sold',
    'Other',
];

const defaultReviewReasons = [
    'Fake or spam review',
    'Inappropriate language or photo',
    'Irrelevant to the product',
    'Harassment or personal information',
    'Other',
];

export function ReportDialog({
    open,
    onClose,
    targetType,
    targetId,
    targetTitle,
    reasons,
}: ReportDialogProps) {
    const reasonList =
        reasons ??
        (targetType === 'review'
            ? defaultReviewReasons
            : targetType === 'shop' ||
                targetType === 'user' ||
                targetType === 'conversation'
              ? defaultUserShopReasons
              : defaultListingReasons);

    const [selectedReason, setSelectedReason] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) {
            return;
        }
        const incoming = Array.from(e.target.files);
        const combined = [...files, ...incoming].slice(0, 5);
        setFiles(combined);

        // Revoke existing previews and generate new ones
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        const newUrls = combined.map((f) => URL.createObjectURL(f));
        setPreviewUrls(newUrls);
    };

    const handleRemoveFile = (index: number) => {
        const nextFiles = files.filter((_, i) => i !== index);
        setFiles(nextFiles);
        URL.revokeObjectURL(previewUrls[index]);
        setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedReason) {
            setError('Please select a reason.');
            return;
        }

        setError(null);
        setSubmitting(true);

        const formData = new FormData();
        formData.append('target_type', targetType);
        formData.append('target_id', targetId);
        formData.append('reason', selectedReason);
        if (details.trim()) {
            formData.append('details', details.trim());
        }
        files.forEach((file) => {
            formData.append('evidence[]', file);
        });

        try {
            const csrfToken =
                document
                    .querySelector('meta[name="csrf-token"]')
                    ?.getAttribute('content') ?? '';

            const res = await fetch('/reports', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    Accept: 'application/json',
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message ?? 'Failed to submit report');
            }

            toast('Report received. Our team reviews within 24 hours.');
            handleClose();
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to submit report. Please try again.';
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setFiles([]);
        setSelectedReason('');
        setDetails('');
        setError(null);
        onClose();
    };

    const titleText =
        targetTitle ??
        `Report ${targetType === 'product' ? 'listing' : targetType}`;

    return (
        <Modal
            open={open}
            onOpenChange={(isOpen) => !isOpen && handleClose()}
            title={titleText}
        >
            <form onSubmit={handleSubmit} className="grid gap-4">
                <fieldset className="grid">
                    <legend className="mb-1 text-label">
                        Why are you reporting this{' '}
                        {targetType === 'product' ? 'listing' : targetType}?
                    </legend>
                    {reasonList.map((reason, idx) => (
                        <label
                            key={reason}
                            htmlFor={`report-reason-${idx}`}
                            className="flex min-h-touch cursor-pointer items-start gap-3 py-2"
                        >
                            <input
                                id={`report-reason-${idx}`}
                                type="radio"
                                name="report-reason"
                                value={reason}
                                checked={selectedReason === reason}
                                onChange={(e) => {
                                    setSelectedReason(e.target.value);
                                    setError(null);
                                }}
                                required
                                className="mt-0.5 size-5 shrink-0 accent-primary"
                            />
                            <span className="text-body">{reason}</span>
                        </label>
                    ))}
                </fieldset>

                {error && (
                    <p className="text-body-sm text-danger-text">{error}</p>
                )}

                <div className="grid gap-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <label
                            htmlFor="report-details"
                            className="text-label text-foreground"
                        >
                            Details{' '}
                            <span className="font-normal text-muted-foreground">
                                (optional)
                            </span>
                        </label>
                    </div>
                    <textarea
                        id="report-details"
                        rows={3}
                        maxLength={1000}
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="What should our team look at?"
                        className="field max-h-40 resize-none text-input"
                    />
                    <div className="flex justify-between text-body-sm text-muted-foreground">
                        <span>Screenshots help us act faster.</span>
                        <span className="tabular">{details.length} / 1000</span>
                    </div>
                </div>

                {/* Evidence Photo Uploader */}
                <div className="grid gap-2">
                    <div className="flex items-baseline justify-between">
                        <p className="text-label">Evidence</p>
                        <p className="tabular text-body-sm text-muted-foreground">
                            {files.length} / 5
                        </p>
                    </div>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-2">
                        {previewUrls.map((url, i) => (
                            <li
                                key={url}
                                className="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted"
                            >
                                <img
                                    src={url}
                                    alt="Evidence preview"
                                    className="size-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(i)}
                                    className="btn btn-icon btn-neutral btn-sm absolute top-0.5 right-0.5 rounded-full text-danger-text shadow-popover"
                                    aria-label="Remove photo"
                                >
                                    <X
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                </button>
                            </li>
                        ))}
                        {files.length < 5 && (
                            <li>
                                <label
                                    htmlFor="report-file-input"
                                    className="grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed border-border-control bg-surface text-center text-body-sm font-bold text-primary-text hover:bg-primary-soft"
                                >
                                    <span>
                                        <ImagePlus
                                            aria-hidden="true"
                                            className="mx-auto size-5"
                                        />
                                        Add photo
                                    </span>
                                </label>
                                <input
                                    id="report-file-input"
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="sr-only"
                                />
                            </li>
                        )}
                    </ul>
                </div>

                <p className="text-body-sm text-muted-foreground">
                    The seller won’t know who reported. False reports may limit
                    your account.
                </p>

                <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="neutral"
                        onClick={handleClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="danger"
                        disabled={submitting}
                    >
                        {submitting ? 'Submitting…' : 'Submit report'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
