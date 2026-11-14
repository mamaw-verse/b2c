import { AlertTriangle, Film, X } from 'lucide-react';
import {
    useId,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type DragEvent,
} from 'react';
import { cn } from '@/lib/utils';

export type VideoUploaderProps = {
    file: File | null;
    onChange: (file: File | null, duration: number | null) => void;
    existing?: { url: string; duration: number | null } | null;
    onRemoveExisting?: () => void;
    maxSizeMb?: number;
    maxDurationSec?: number;
    error?: string;
    idPrefix?: string;
    disabled?: boolean;
    className?: string;
};

export function VideoUploader({
    file,
    onChange,
    existing = null,
    onRemoveExisting,
    maxSizeMb = 30,
    maxDurationSec = 60,
    error,
    idPrefix,
    disabled = false,
    className = '',
}: VideoUploaderProps) {
    const autoId = useId();
    const prefix = idPrefix ?? autoId;
    const inputRef = useRef<HTMLInputElement>(null);
    const [liveMessage, setLiveMessage] = useState<string>('');
    const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const localPreviewUrl = useMemo(() => {
        if (!file) {
            return null;
        }
        return URL.createObjectURL(file);
    }, [file]);

    const activeVideoUrl = localPreviewUrl ?? existing?.url ?? null;
    const activeDuration = file ? null : (existing?.duration ?? null);

    const handleFile = (selectedFile: File) => {
        setLocalError(null);

        if (!selectedFile.type.match(/^video\/(mp4|webm)$/)) {
            const msg = 'Please upload an MP4 or WebM video.';
            setLocalError(msg);
            setLiveMessage(msg);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        if (selectedFile.size > maxSizeMb * 1024 * 1024) {
            const msg = `Video must be ≤ ${maxSizeMb} MB.`;
            setLocalError(msg);
            setLiveMessage(msg);
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        const objectUrl = URL.createObjectURL(selectedFile);
        const tempVideo = document.createElement('video');
        tempVideo.preload = 'metadata';
        tempVideo.src = objectUrl;

        tempVideo.onloadedmetadata = () => {
            URL.revokeObjectURL(objectUrl);
            const duration = Math.max(1, Math.round(tempVideo.duration) || 1);

            if (duration > maxDurationSec) {
                const msg = `Video must be ≤ ${maxDurationSec} seconds (selected video is ${duration}s).`;
                setLocalError(msg);
                setLiveMessage(msg);
                if (inputRef.current) inputRef.current.value = '';
                return;
            }

            setLocalError(null);
            onChange(selectedFile, duration);
            setLiveMessage(`Added video (${duration}s).`);
            if (inputRef.current) inputRef.current.value = '';
        };

        tempVideo.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            const msg = 'Unable to read video file metadata.';
            setLocalError(msg);
            setLiveMessage(msg);
            if (inputRef.current) inputRef.current.value = '';
        };
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled && !activeVideoUrl) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDraggingOver(false);
        if (disabled || activeVideoUrl) return;

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            handleFile(files[0]);
        }
    };

    const handleRemove = () => {
        setLocalError(null);
        if (file) {
            onChange(null, null);
        } else if (existing) {
            onRemoveExisting?.();
            onChange(null, null);
        }
        setLiveMessage('Removed product video.');
        if (inputRef.current) inputRef.current.value = '';
    };

    const displayError = localError || error;

    return (
        <div data-ds-video-uploader className={cn('grid gap-3', className)}>
            <div aria-live="polite" className="sr-only">
                {liveMessage}
            </div>

            <input
                ref={inputRef}
                id={`${prefix}-input`}
                type="file"
                accept="video/mp4,video/webm"
                onChange={handleInputChange}
                disabled={disabled || !!activeVideoUrl}
                className="sr-only"
                aria-describedby={
                    displayError ? `${prefix}-error` : `${prefix}-hint`
                }
            />

            {activeVideoUrl ? (
                <div className="relative aspect-video max-w-md overflow-hidden rounded-panel border border-border bg-surface-muted">
                    <video
                        controls
                        playsInline
                        preload="metadata"
                        src={activeVideoUrl}
                        className="size-full object-contain"
                        aria-label="Product video preview"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                        {activeDuration !== null && (
                            <span className="rounded-full bg-surface-inverse/80 px-2 py-0.5 text-caption font-medium text-foreground-inverse backdrop-blur">
                                {activeDuration}s
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={handleRemove}
                            disabled={disabled}
                            className="btn btn-icon btn-neutral size-8 rounded-full border-transparent bg-surface-inverse/80 text-foreground-inverse shadow-popover backdrop-blur hover:bg-surface-inverse"
                            aria-label="Remove product video"
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => !disabled && inputRef.current?.click()}
                    className={cn(
                        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-panel border-2 border-dashed p-6 text-center transition-colors',
                        isDraggingOver
                            ? 'border-primary bg-primary/5'
                            : 'hover:border-foreground-muted border-border hover:bg-surface-muted/50',
                        disabled && 'cursor-not-allowed opacity-50',
                    )}
                >
                    <div className="text-foreground-muted grid size-12 place-items-center rounded-full bg-surface-muted">
                        <Film className="size-6" aria-hidden="true" />
                    </div>
                    <div>
                        <p className="text-body font-medium">
                            <span className="text-primary hover:underline">
                                Upload a video
                            </span>{' '}
                            or drag and drop
                        </p>
                        <p
                            id={`${prefix}-hint`}
                            className="text-caption text-muted-foreground"
                        >
                            MP4 or WebM, max {maxSizeMb} MB, up to{' '}
                            {maxDurationSec} seconds
                        </p>
                    </div>
                </div>
            )}

            {displayError && (
                <p
                    id={`${prefix}-error`}
                    className="text-destructive flex items-center gap-1.5 text-body-sm"
                >
                    <AlertTriangle
                        className="size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span>{displayError}</span>
                </p>
            )}
        </div>
    );
}
