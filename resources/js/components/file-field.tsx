import { CircleAlert, FileText, Upload } from 'lucide-react';
import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type FileFieldProps = {
    id?: string;
    label: string;
    /** Human-readable list of accepted types, e.g. "JPG, PNG or PDF". */
    acceptLabel: string;
    accept?: string;
    maxSizeMb?: number;
    variant?: 'image' | 'document' | 'avatar';
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    optional?: boolean;
    disabled?: boolean;
    helper?: ReactNode;
    existingUrl?: string | null;
    existingLabel?: string;
    /** Button text in the empty state. */
    addLabel?: string;
};

function formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    }

    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function FileField({
    id: explicitId,
    label,
    acceptLabel,
    accept = 'image/*',
    maxSizeMb = 5,
    variant = 'document',
    value,
    onChange,
    error,
    optional = false,
    disabled = false,
    helper,
    existingUrl = null,
    existingLabel,
    addLabel,
}: FileFieldProps) {
    const generatedId = useId();
    const id = explicitId ?? generatedId;
    const inputId = `${id}-file`;
    const helpId = `${id}-help`;
    const errorId = `${id}-error`;
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFile = (file: File | null) => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(
            file && variant !== 'document' ? URL.createObjectURL(file) : null,
        );
        onChange(file);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (!disabled && e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const describedBy = [
        helpId,
        error ? errorId : null,
        helper && variant !== 'avatar' ? `${id}-helper` : null,
    ]
        .filter(Boolean)
        .join(' ');

    const isPdf = value?.type === 'application/pdf';
    const currentFileLabel = existingLabel
        ? `Current file: ${existingLabel}`
        : 'Current file';

    return (
        <div className="grid gap-1.5" data-file-field={id}>
            <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={inputId}>{label}</Label>
                {optional && (
                    <span className="text-body-sm text-muted-foreground">
                        (optional)
                    </span>
                )}
            </div>

            {variant === 'avatar' ? (
                <div className="flex items-center gap-4">
                    {value === null ? (
                        existingUrl ? (
                            <>
                                <img
                                    src={existingUrl}
                                    alt=""
                                    className="size-24 shrink-0 rounded-tile border border-border object-cover"
                                />
                                <div className="grid gap-1">
                                    <p className="text-body-sm text-foreground">
                                        {currentFileLabel}
                                    </p>
                                    <a
                                        href={existingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="min-h-touch text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                                    >
                                        View file
                                    </a>
                                    <button
                                        type="button"
                                        className="min-h-touch text-left text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                                        onClick={() =>
                                            inputRef.current?.click()
                                        }
                                        disabled={disabled}
                                    >
                                        Replace
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                type="button"
                                id={id}
                                disabled={disabled}
                                onClick={() => inputRef.current?.click()}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    if (!disabled) {
                                        setIsDraggingOver(true);
                                    }
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    setIsDraggingOver(false);
                                }}
                                onDrop={handleDrop}
                                aria-describedby={describedBy || undefined}
                                aria-invalid={error ? true : undefined}
                                className={cn(
                                    'focus-ring grid size-24 shrink-0 cursor-pointer place-items-center gap-1 rounded-tile border-2 border-dashed p-2 text-center transition-colors',
                                    isDraggingOver
                                        ? 'border-primary bg-primary-soft text-primary-text'
                                        : 'border-border-control bg-surface text-primary-text hover:bg-primary-soft',
                                    error && 'border-danger',
                                    disabled && 'cursor-not-allowed opacity-50',
                                )}
                            >
                                <Upload className="size-5" aria-hidden="true" />
                                <span className="text-caption font-bold">
                                    {addLabel ?? 'Add logo'}
                                </span>
                            </button>
                        )
                    ) : (
                        <>
                            {previewUrl && (
                                <img
                                    src={previewUrl}
                                    alt=""
                                    className="size-24 shrink-0 rounded-tile border border-border object-cover"
                                />
                            )}
                            <div className="flex shrink-0 gap-3">
                                <button
                                    type="button"
                                    className="min-h-touch text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                                    onClick={() => inputRef.current?.click()}
                                    disabled={disabled}
                                >
                                    Replace
                                </button>
                                <button
                                    type="button"
                                    className="min-h-touch text-body-sm font-bold text-danger-text underline decoration-1 underline-offset-2"
                                    onClick={() => handleFile(null)}
                                    disabled={disabled}
                                >
                                    Remove
                                </button>
                            </div>
                        </>
                    )}
                    <p
                        id={helpId}
                        className="text-body-sm text-muted-foreground"
                    >
                        {acceptLabel} · up to {maxSizeMb} MB
                        {helper ? <> {helper}</> : null}
                    </p>
                </div>
            ) : value === null && existingUrl ? (
                <div className="flex items-center gap-3 rounded-field border border-border bg-surface p-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-tile bg-surface-muted text-muted-foreground">
                        <FileText className="size-6" aria-hidden="true" />
                    </span>
                    <div className="grid min-w-0 flex-1">
                        <p className="text-body font-bold text-foreground">
                            {currentFileLabel}
                        </p>
                        <a
                            href={existingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                        >
                            View file
                        </a>
                    </div>
                    <button
                        type="button"
                        className="min-h-touch shrink-0 text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                        onClick={() => inputRef.current?.click()}
                        disabled={disabled}
                    >
                        Replace
                    </button>
                </div>
            ) : value === null ? (
                <button
                    type="button"
                    id={id}
                    disabled={disabled}
                    onClick={() => inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled) {
                            setIsDraggingOver(true);
                        }
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        setIsDraggingOver(false);
                    }}
                    onDrop={handleDrop}
                    aria-describedby={describedBy || undefined}
                    aria-invalid={error ? true : undefined}
                    className={cn(
                        'focus-ring grid min-h-22 w-full cursor-pointer place-items-center gap-1 rounded-field border-2 border-dashed p-4 text-center transition-colors',
                        isDraggingOver
                            ? 'border-primary bg-primary-soft text-primary-text'
                            : 'border-border-control bg-surface text-primary-text hover:bg-primary-soft',
                        error && 'border-danger',
                        disabled && 'cursor-not-allowed opacity-50',
                    )}
                >
                    <Upload className="size-6" aria-hidden="true" />
                    <span className="text-body font-bold">
                        {addLabel ??
                            (variant === 'image' ? 'Add logo' : 'Upload file')}
                    </span>
                    <span
                        id={helpId}
                        className="text-body-sm font-normal text-muted-foreground"
                    >
                        {acceptLabel} · up to {maxSizeMb} MB
                    </span>
                </button>
            ) : (
                <div
                    className={cn(
                        'flex items-center gap-3 rounded-field border border-border bg-surface p-3',
                        error && 'border-danger',
                    )}
                >
                    {variant === 'image' && previewUrl ? (
                        <img
                            src={previewUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-tile border border-border object-cover"
                        />
                    ) : (
                        <span className="grid size-12 shrink-0 place-items-center rounded-tile bg-surface-muted text-muted-foreground">
                            <FileText className="size-6" aria-hidden="true" />
                            <span className="sr-only">
                                {isPdf ? 'PDF file' : 'File'}
                            </span>
                        </span>
                    )}
                    <div className="grid min-w-0 flex-1">
                        <p className="truncate text-body font-bold text-foreground">
                            {value.name}
                        </p>
                        <p
                            id={helpId}
                            className="text-body-sm text-muted-foreground"
                        >
                            {formatSize(value.size)} · {acceptLabel} · up to{' '}
                            {maxSizeMb} MB
                        </p>
                    </div>
                    <div className="flex shrink-0 gap-3">
                        <button
                            type="button"
                            className="min-h-touch text-body-sm font-bold text-primary-text underline decoration-1 underline-offset-2"
                            onClick={() => inputRef.current?.click()}
                            disabled={disabled}
                        >
                            Replace
                        </button>
                        <button
                            type="button"
                            className="min-h-touch text-body-sm font-bold text-danger-text underline decoration-1 underline-offset-2"
                            onClick={() => handleFile(null)}
                            disabled={disabled}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            )}

            {helper && variant !== 'avatar' && (
                <p
                    id={`${id}-helper`}
                    className="text-body-sm text-muted-foreground"
                >
                    {helper}
                </p>
            )}
            {error && (
                <p
                    id={errorId}
                    className="flex items-start gap-1 text-body-sm font-bold text-danger-text"
                >
                    <CircleAlert
                        className="mt-px size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span>{error}</span>
                </p>
            )}

            <input
                ref={inputRef}
                id={inputId}
                type="file"
                accept={accept}
                disabled={disabled}
                onChange={(e) => {
                    handleFile(e.target.files?.[0] ?? null);
                    e.target.value = '';
                }}
                className="sr-only"
            />
        </div>
    );
}
