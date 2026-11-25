import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { ImageUploadDialog, type BlogImage } from './image-upload-dialog';

export type AuthorLink = { label: string; url: string };

export type AuthorFormValues = {
    job_title: string | null;
    bio: string | null;
    links: AuthorLink[];
    avatar: BlogImage | null;
};

/** Job title, bio, avatar and up to four https links: shared by the admin and self-service forms. */
export function AuthorContentFields({
    author,
    errors,
}: {
    author?: AuthorFormValues;
    errors: Record<string, string>;
}) {
    const [avatar, setAvatar] = useState<BlogImage | null>(
        author?.avatar ?? null,
    );
    const [uploading, setUploading] = useState(false);
    const links = Array.from(
        { length: 4 },
        (_, i) => author?.links[i] ?? { label: '', url: '' },
    );

    return (
        <>
            <FormField label="Job title" optional error={errors.job_title}>
                <Input
                    name="job_title"
                    defaultValue={author?.job_title ?? ''}
                />
            </FormField>
            <div className="flex items-center gap-3">
                {avatar && (
                    <img
                        src={avatar.preview_url}
                        alt=""
                        className="size-14 rounded-full object-cover"
                    />
                )}
                <input
                    type="hidden"
                    name="avatar_image_id"
                    value={avatar?.id ?? ''}
                />
                <Button
                    type="button"
                    variant="neutral"
                    onClick={() => setUploading(true)}
                >
                    {avatar ? 'Replace photo' : 'Upload photo'}
                </Button>
                {avatar && (
                    <Button
                        type="button"
                        variant="plain"
                        onClick={() => setAvatar(null)}
                    >
                        Remove
                    </Button>
                )}
                {errors.avatar_image_id && (
                    <span className="text-body-sm font-bold text-danger-text">
                        {errors.avatar_image_id}
                    </span>
                )}
            </div>
            <FormField
                label="Bio"
                optional
                help="Plain text, up to 600 characters."
                error={errors.bio}
            >
                <TextArea
                    name="bio"
                    maxLength={600}
                    defaultValue={author?.bio ?? ''}
                />
            </FormField>
            <fieldset className="grid gap-2">
                <legend className="text-label font-bold">
                    Links (https only, up to 4)
                </legend>
                {links.map((link, i) => (
                    <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                        <Input
                            name={`links[${i}][label]`}
                            placeholder="Label"
                            aria-label={`Link ${i + 1} label`}
                            defaultValue={link.label}
                        />
                        <Input
                            name={`links[${i}][url]`}
                            placeholder="https://"
                            aria-label={`Link ${i + 1} URL`}
                            defaultValue={link.url}
                        />
                    </div>
                ))}
                {(errors.links ||
                    Object.keys(errors).some((k) =>
                        k.startsWith('links.'),
                    )) && (
                    <p className="text-body-sm font-bold text-danger-text">
                        {errors.links ??
                            Object.entries(errors).find(([k]) =>
                                k.startsWith('links.'),
                            )?.[1]}
                    </p>
                )}
            </fieldset>
            {uploading && (
                <ImageUploadDialog
                    purpose="avatar"
                    title="Upload a profile photo"
                    onClose={() => setUploading(false)}
                    onUploaded={setAvatar}
                />
            )}
        </>
    );
}
