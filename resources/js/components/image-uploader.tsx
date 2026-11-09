import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    ImagePlus,
    X,
} from 'lucide-react';
import { useId, useMemo, useRef, useState, type DragEvent } from 'react';

export type ImageUploadItem = {
    file: File;
    previewUrl: string;
    error?: string;
};

export type ImageUploaderProps = {
    files: File[];
    onChange: (files: File[]) => void;
    max?: number;
    label?: string;
    accept?: string;
    maxSizeMb?: number;
    error?: string;
    idPrefix?: string;
    disabled?: boolean;
    className?: string;
};

export function ImageUploader({
    files,
    onChange,
    max = 5,
    label = 'Add photos',
    accept = 'image/*',
    maxSizeMb = 5,
    error,
    idPrefix,
    disabled = false,
    className = '',
}: ImageUploaderProps) {
    const autoId = useId();
    const prefix = idPrefix ?? autoId;
    const inputRef = useRef<HTMLInputElement>(null);
    const [liveMessage, setLiveMessage] = useState<string>('');
    const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

    // Create object URLs for previews
    const previews = useMemo(() => {
        return files.map((file) => {
            const isTooLarge = file.size > maxSizeMb * 1024 * 1024;
            return {
                file,
                url: URL.createObjectURL(file),
                isTooLarge,
            };
        });
    }, [files, maxSizeMb]);

    const handleAddFiles = (newFiles: FileList | null) => {
        if (!newFiles || newFiles.length === 0) return;
        const availableSlots = max - files.length;
        if (availableSlots <= 0) return;

        const filesToAdd = Array.from(newFiles).slice(0, availableSlots);
        const updated = [...files, ...filesToAdd];
        onChange(updated);
        setLiveMessage(
            `Added ${filesToAdd.length} ${filesToAdd.length === 1 ? 'photo' : 'photos'}.`,
        );

        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const handleRemove = (index: number) => {
        const removedFile = files[index];
        const updated = files.filter((_, i) => i !== index);
        onChange(updated);
        setLiveMessage(`Removed ${removedFile.name}.`);
    };

    const handleMove = (index: number, direction: -1 | 1) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= files.length) return;

        const updated = [...files];
        const [movedFile] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, movedFile);
        onChange(updated);
        setLiveMessage(
            `Moved ${movedFile.name} to position ${targetIndex + 1}.`,
        );
    };

    const handleDragOver = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled && files.length < max) {
            setIsDraggingOver(true);
        }
    };

    const handleDragLeave = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (!disabled && files.length < max && e.dataTransfer.files) {
            handleAddFiles(e.dataTransfer.files);
        }
    };

    const canAddMore = files.length < max && !disabled;

    return (
        <div
            className={`grid gap-2 ${className}`}
            data-ds-uploader
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-baseline justify-between">
                <p
                    id={`${prefix}-label`}
                    className="text-label text-foreground"
                >
                    {label}
                </p>
                <p className="tabular text-body-sm text-muted-foreground">
                    {files.length} / {max}
                </p>
            </div>

            <ul
                className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-2"
                data-ds-tiles
                aria-labelledby={`${prefix}-label`}
            >
                {previews.map((item, index) => (
                    <li
                        key={`${item.file.name}-${index}`}
                        className="relative"
                        data-name={item.file.name}
                    >
                        {item.isTooLarge ? (
                            <div className="relative aspect-square overflow-hidden rounded-tile border border-danger bg-danger-soft">
                                <div className="grid h-full place-items-center p-2 text-center text-caption font-bold text-danger-text">
                                    <AlertTriangle
                                        className="mx-auto size-5"
                                        aria-hidden="true"
                                    />
                                    Over {maxSizeMb} MB
                                </div>
                            </div>
                        ) : (
                            <div className="relative aspect-square overflow-hidden rounded-tile border border-border bg-surface-muted">
                                <img
                                    src={item.url}
                                    alt={item.file.name}
                                    className="size-full object-cover"
                                />
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="btn btn-icon btn-neutral btn-sm absolute top-0 right-0 rounded-full border-transparent text-danger-text shadow-popover"
                            data-ds-remove
                            aria-label={`Remove ${item.file.name}`}
                        >
                            <X className="size-4" aria-hidden="true" />
                        </button>

                        <div className="mt-1 flex justify-between">
                            <button
                                type="button"
                                onClick={() => handleMove(index, -1)}
                                disabled={index === 0}
                                className="btn btn-ghost btn-icon text-foreground disabled:opacity-20"
                                data-ds-move="-1"
                                aria-label={`Move ${item.file.name} earlier`}
                            >
                                <ChevronLeft
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMove(index, 1)}
                                disabled={index === files.length - 1}
                                className="btn btn-ghost btn-icon text-foreground disabled:opacity-20"
                                data-ds-move="1"
                                aria-label={`Move ${item.file.name} later`}
                            >
                                <ChevronRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </button>
                        </div>
                    </li>
                ))}

                {canAddMore && (
                    <li data-ds-add>
                        <label
                            htmlFor={`${prefix}-input`}
                            className={`focus-ring grid aspect-square cursor-pointer place-items-center rounded-tile border-2 border-dashed bg-surface p-2 text-center text-body-sm font-bold transition-colors ${
                                isDraggingOver
                                    ? 'border-primary bg-primary-soft text-primary-text'
                                    : 'border-border-control text-primary-text hover:bg-primary-soft'
                            }`}
                        >
                            <span>
                                <ImagePlus
                                    className="mx-auto size-6"
                                    aria-hidden="true"
                                />
                                <span>Add photo</span>
                            </span>
                        </label>
                        <input
                            ref={inputRef}
                            id={`${prefix}-input`}
                            type="file"
                            accept={accept}
                            multiple
                            disabled={disabled}
                            onChange={(e) => handleAddFiles(e.target.files)}
                            className="sr-only"
                        />
                    </li>
                )}
            </ul>

            {error && (
                <p className="flex items-start gap-1 text-body-sm font-bold text-danger-text">
                    <AlertTriangle
                        className="mt-px size-4 shrink-0"
                        aria-hidden="true"
                    />
                    <span>{error}</span>
                </p>
            )}

            <p className="sr-only" aria-live="polite">
                {liveMessage}
            </p>
        </div>
    );
}
