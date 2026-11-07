import { useForm } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { Media } from '@/components/media';
import { RatingInput } from '@/components/rating-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TextArea } from '@/components/ui/textarea';

export type ReviewFormProps = {
    orderItem: {
        id: string;
        product_name: string;
        variation_label?: string | null;
        image_url?: string | null;
    };
    actionUrl: string;
    className?: string;
};

export function ReviewForm({
    orderItem,
    actionUrl,
    className = '',
}: ReviewFormProps) {
    const [rating, setRating] = useState<number>(5);
    const [photos, setPhotos] = useState<File[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        rating: 5,
        body: '',
        anonymous: false,
        photos: [] as File[],
    });

    const handleRatingChange = (newRating: number) => {
        setRating(newRating);
        setData('rating', newRating);
    };

    const handlePhotosChange = (newPhotos: File[]) => {
        setPhotos(newPhotos);
        setData('photos', newPhotos);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(actionUrl, {
            forceFormData: true,
        });
    };

    return (
        <form onSubmit={handleSubmit} className={`grid gap-6 ${className}`}>
            {/* Product summary */}
            <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="size-16 shrink-0 overflow-hidden rounded-tile">
                    {orderItem.image_url ? (
                        <img
                            src={orderItem.image_url}
                            alt={orderItem.product_name}
                            className="aspect-square size-full object-cover"
                        />
                    ) : (
                        <Media
                            label={orderItem.product_name}
                            icon="package"
                            decorative
                        />
                    )}
                </div>
                <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="line-clamp-2 text-label font-bold text-foreground">
                        {orderItem.product_name}
                    </p>
                    {orderItem.variation_label && (
                        <p className="text-body-sm text-muted-foreground">
                            Variation: {orderItem.variation_label}
                        </p>
                    )}
                </div>
            </div>

            {/* Rating input */}
            <div>
                <RatingInput
                    value={rating}
                    onChange={handleRatingChange}
                    error={errors.rating}
                    legend="Rate this product"
                />
            </div>

            {/* Review text area with character counter */}
            <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <label
                        htmlFor="review-text"
                        className="text-label text-foreground"
                    >
                        Your review{' '}
                        <span className="font-normal text-muted-foreground">
                            (optional)
                        </span>
                    </label>
                </div>
                <TextArea
                    id="review-text"
                    rows={4}
                    value={data.body}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setData('body', e.target.value)
                    }
                    placeholder="What did you like? How was the taste, quality, packaging?"
                    maxLength={500}
                    aria-describedby="review-text-help review-text-count"
                />
                <div className="flex gap-2">
                    <p
                        id="review-text-help"
                        className="text-body-sm text-muted-foreground"
                    >
                        At least 20 characters earns reward points.
                    </p>
                    <p
                        id="review-text-count"
                        className="tabular ml-auto shrink-0 text-body-sm text-muted-foreground"
                    >
                        {data.body.length} / 500
                    </p>
                </div>
                {errors.body && (
                    <p className="flex items-start gap-1 text-body-sm font-bold text-danger">
                        <AlertCircle
                            className="mt-px size-4 shrink-0"
                            aria-hidden="true"
                        />
                        <span>{errors.body}</span>
                    </p>
                )}
            </div>

            {/* Image uploader */}
            <ImageUploader
                files={photos}
                onChange={handlePhotosChange}
                max={5}
                label="Add photos"
                error={errors.photos}
            />

            {/* Anonymous checkbox */}
            <div className="flex items-start gap-3 py-2">
                <Checkbox
                    id="review-anon"
                    checked={data.anonymous}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setData('anonymous', e.target.checked)
                    }
                />
                <label
                    htmlFor="review-anon"
                    className="grid cursor-pointer gap-0.5 text-body"
                >
                    <span className="font-bold text-foreground">
                        Post anonymously
                    </span>
                    <span className="text-body-sm text-muted-foreground">
                        Your name shows as a*****z.
                    </span>
                </label>
            </div>

            {/* Submit button */}
            <div className="pt-2">
                <Button
                    type="submit"
                    size="lg"
                    disabled={processing}
                    className="w-full md:w-auto"
                >
                    {processing ? 'Submitting...' : 'Submit review'}
                </Button>
            </div>
        </form>
    );
}
