import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { getCsrfHeaders } from '@/lib/csrf';
import { store as storeImage } from '@/routes/admin/blog/images';

export type BlogImage = {
    id: string;
    purpose: string;
    alt: string | null;
    caption: string | null;
    width: number;
    height: number;
    preview_url: string;
    markdown: string;
};

/**
 * Picks a file, asks for alt text (required for cover and body images) and uploads it
 * through `admin.blog.images.store`. Hands the stored image back to the caller.
 */
export function ImageUploadDialog({
    purpose,
    title,
    onClose,
    onUploaded,
}: {
    purpose: 'cover' | 'thumbnail' | 'body' | 'avatar';
    title: string;
    onClose: () => void;
    onUploaded: (image: BlogImage) => void;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [alt, setAlt] = useState('');
    const [caption, setCaption] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const altRequired = purpose === 'cover' || purpose === 'body';

    const submit = async () => {
        if (!file) {
            setError('Choose an image first.');
            return;
        }
        setBusy(true);
        setError(null);

        const body = new FormData();
        body.append('image', file);
        body.append('purpose', purpose);
        body.append('alt', alt);
        if (caption) {
            body.append('caption', caption);
        }

        try {
            const response = await fetch(storeImage().url, {
                method: 'POST',
                headers: { Accept: 'application/json', ...getCsrfHeaders() },
                body,
                credentials: 'same-origin',
            });
            const json = await response.json();

            if (!response.ok) {
                setError(
                    json?.errors?.image?.[0] ??
                        json?.errors?.alt?.[0] ??
                        json?.message ??
                        'Upload failed.',
                );
                return;
            }
            onUploaded(json.data as BlogImage);
            onClose();
        } catch {
            setError('Upload failed. Check your connection and try again.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal
            open
            onOpenChange={(open) => !open && onClose()}
            title={title}
            footer={
                <>
                    <Button type="button" variant="neutral" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="button" loading={busy} onClick={submit}>
                        Upload
                    </Button>
                </>
            }
        >
            <div className="grid gap-4">
                <FormField
                    label="Image"
                    required
                    help="JPEG, PNG or WebP, up to 3 MB."
                >
                    <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                </FormField>
                <FormField
                    label="Alt text"
                    required={altRequired}
                    optional={!altRequired}
                    help="Describe the image for people who cannot see it."
                >
                    <Input
                        value={alt}
                        maxLength={200}
                        onChange={(e) => setAlt(e.target.value)}
                    />
                </FormField>
                {purpose === 'body' && (
                    <FormField label="Caption" optional>
                        <Input
                            value={caption}
                            maxLength={200}
                            onChange={(e) => setCaption(e.target.value)}
                        />
                    </FormField>
                )}
                {error && (
                    <p role="alert" className="font-bold text-danger-text">
                        {error}
                    </p>
                )}
            </div>
        </Modal>
    );
}
