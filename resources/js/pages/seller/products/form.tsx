import { Form, Head, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { VideoUploader } from '@/components/video-uploader';
import { VariantMatrix, type VariationItem } from '@/components/variant-matrix';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { formatPeso } from '@/lib/format';
import {
    store as storeRoute,
    update as updateRoute,
} from '@/routes/seller/products';

type Category = { id: number; name: string };

type ProductData = {
    id: string;
    name: string;
    category_id: number | null;
    description: string;
    price: number | null;
    sale_price?: number | null;
    was_price?: number | null;
    stock: number | null;
    weight: number | null;
    length: number | null;
    width: number | null;
    height: number | null;
    is_published: boolean;
    has_variations: boolean;
    variations: VariationItem[];
    option1_name: string;
    option1_values: string[];
    option2_name: string;
    option2_values: string[];
    images?: { id: string; url: string; name: string; icon: string }[];
    video?: { url: string; duration: number | null } | null;
    affiliate_enabled?: boolean;
    affiliate_commission_percent?: number | null;
};

type ShareBreakdown = {
    total: number;
    recent: number;
    by_channel: Record<string, { all: number; recent: number }>;
};

type PageProps = {
    product: ProductData | null;
    categories: Category[];
    sharing?: ShareBreakdown | null;
};

const channelLabels: Record<string, string> = {
    copy: 'Copy link',
    facebook: 'Facebook',
    x: 'X',
    messenger: 'Messenger',
    native: 'Mobile share sheet (incl. Instagram)',
};

/**
 * Lists every validation error at the top of the form and moves focus to it
 * after a failed submit. Some errors belong to fields that are collapsed or
 * off-screen (a variation row, default shipping), so this guarantees a failed
 * save is never silent.
 */
function ErrorSummary({ errors }: { errors: Record<string, string> }) {
    const ref = useRef<HTMLDivElement>(null);
    const messages = Object.values(errors);
    const signature = Object.keys(errors).join('|');

    useEffect(() => {
        if (signature !== '') {
            ref.current?.focus();
            ref.current?.scrollIntoView({
                block: 'center',
                behavior: 'smooth',
            });
        }
    }, [signature]);

    if (messages.length === 0) {
        return null;
    }

    return (
        <div
            ref={ref}
            role="alert"
            tabIndex={-1}
            className="mb-6 rounded-panel border border-danger bg-danger-soft p-4 text-danger-text"
        >
            <p className="text-label">
                {messages.length === 1
                    ? 'Fix this issue before saving:'
                    : `Fix these ${messages.length} issues before saving:`}
            </p>
            <ul className="mt-2 list-disc pl-5 text-body-sm">
                {messages.map((message, i) => (
                    <li key={i}>{message}</li>
                ))}
            </ul>
        </div>
    );
}

export default function SellerProductForm({
    product,
    categories,
    sharing,
}: PageProps) {
    const { props } = usePage<{
        seller?: { role?: 'owner' | 'staff' } | null;
        marketplace?: {
            commission?: { default_bps?: number };
            affiliate?: {
                default_bps?: number;
                min_bps?: number;
                max_bps?: number;
            };
        };
    }>();
    const isOwner = props.seller?.role === 'owner';

    const isEditing = product !== null;
    const [name, setName] = useState(product?.name ?? '');
    const [description, setDescription] = useState(product?.description ?? '');
    const [regularPrice, setRegularPrice] = useState<string | number>(
        product?.price ?? product?.variations?.[0]?.price ?? '',
    );
    const [salePrice, setSalePrice] = useState<string | number>(
        product?.sale_price ?? product?.variations?.[0]?.sale_price ?? '',
    );
    // Product-level shipping values. With variations enabled they act as the
    // defaults every variation inherits unless it sets its own.
    const [shipping, setShipping] = useState({
        weight: String(product?.weight ?? ''),
        length: String(product?.length ?? ''),
        width: String(product?.width ?? ''),
        height: String(product?.height ?? ''),
    });
    const [affiliateEnabled, setAffiliateEnabled] = useState(
        product?.affiliate_enabled ?? false,
    );
    const [affiliatePercent, setAffiliatePercent] = useState<string | number>(
        product?.affiliate_commission_percent ??
            (props.marketplace?.affiliate?.default_bps
                ? props.marketplace.affiliate.default_bps / 100
                : 5),
    );
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    // Only rows with a real URL are tracked: placeholder rows (url === '')
    // must not be sent in keep_image_ids, or they linger in the gallery
    // after real photos are added.
    const [existingImages, setExistingImages] = useState<
        { id: string; url: string }[]
    >(
        () =>
            product?.images
                ?.filter((img) => (img.url ?? '') !== '')
                .map((img) => ({ id: img.id, url: img.url as string })) ?? [],
    );
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoDuration, setVideoDuration] = useState<number | null>(
        product?.video?.duration ?? null,
    );
    const [existingVideo, setExistingVideo] = useState<{
        url: string;
        duration: number | null;
    } | null>(product?.video ?? null);
    const [removeVideo, setRemoveVideo] = useState(false);
    const [hasVariations, setHasVariations] = useState(
        product?.has_variations ?? (product?.variations?.length ?? 0) > 0,
    );
    const [variations, setVariations] = useState<VariationItem[]>(
        product?.variations ?? [],
    );
    const [option1Name, setOption1Name] = useState(
        product?.option1_name ?? 'Size',
    );
    const [option2Name, setOption2Name] = useState(
        product?.option2_name ?? 'Colour',
    );
    const [option1Values, setOption1Values] = useState<string[]>(
        product?.option1_values ?? [
            ...new Set(product?.variations?.map((v) => v.option1_value)),
        ],
    );
    const [option2Values, setOption2Values] = useState<string[]>(
        product?.option2_values ?? [
            ...new Set(
                product?.variations
                    ?.map((v) => v.option2_value)
                    .filter((v): v is string => v != null),
            ),
        ],
    );

    const buildVariations = (
        o1: string[],
        o2: string[],
        useO2: boolean,
        prev: VariationItem[],
    ): VariationItem[] =>
        o1.flatMap((a) =>
            (useO2 && o2.length ? o2 : [null]).map((b) => {
                const old = prev.find(
                    (v) =>
                        v.option1_value === a &&
                        (v.option2_value ?? null) === b,
                );
                return (
                    old ?? {
                        option1_value: a,
                        option2_value: b,
                        price: 0,
                        sale_price: null,
                        stock: 0,
                        sku: null,
                        weight: null,
                        length: null,
                        width: null,
                        height: null,
                    }
                );
            }),
        );

    const effectivePricePesos = hasVariations
        ? variations[0]?.sale_price || variations[0]?.price || 0
        : salePrice !== '' && !isNaN(Number(salePrice)) && Number(salePrice) > 0
          ? Number(salePrice)
          : regularPrice !== '' && !isNaN(Number(regularPrice))
            ? Number(regularPrice)
            : 0;

    const priceInCentavos = Math.round(Number(effectivePricePesos) * 100);
    const commissionPercent = Number(affiliatePercent) || 0;
    const affiliateCentavos = Math.round(
        (priceInCentavos * commissionPercent) / 100,
    );

    const platformBps = props.marketplace?.commission?.default_bps ?? 0;
    const platformCentavos = Math.round(
        (priceInCentavos * platformBps) / 10000,
    );

    const netCentavos = Math.max(
        0,
        priceInCentavos - affiliateCentavos - platformCentavos,
    );

    const action = isEditing
        ? updateRoute({ product: product!.id })
        : storeRoute();

    const title = isEditing ? `Edit: ${product!.name}` : 'Add product';

    return (
        <>
            <Head title={title} />
            <Form
                action={action.url}
                method={isEditing ? 'put' : 'post'}
                encType="multipart/form-data"
                transform={(data) => ({
                    ...data,
                    images: imageFiles,
                    keep_image_ids: existingImages.map((img) => img.id),
                    video: videoFile,
                    video_duration: videoDuration,
                    remove_video: removeVideo ? 1 : 0,
                    option1_name: hasVariations ? option1Name : null,
                    option2_name: hasVariations ? option2Name || null : null,
                    ...(isOwner
                        ? {
                              affiliate_enabled: affiliateEnabled ? 1 : 0,
                              affiliate_commission_percent: affiliateEnabled
                                  ? affiliatePercent
                                  : undefined,
                          }
                        : {}),
                })}
            >
                {({ errors, processing }) => (
                    <div className="mx-auto max-w-container p-gutter py-8 pb-28 lg:pb-8">
                        <h1 className="mb-6 text-h1">{title}</h1>

                        <ErrorSummary errors={errors} />

                        <div className="grid gap-6">
                            {/* Basic information */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">
                                    Basic information
                                </h2>
                                <div className="grid gap-4">
                                    <FormField
                                        label="Product name"
                                        error={errors.name}
                                        required
                                        counter={
                                            <span className="text-caption text-muted-foreground">
                                                {name.length}/120
                                            </span>
                                        }
                                    >
                                        <Input
                                            name="name"
                                            value={name}
                                            onChange={(e) =>
                                                setName(e.target.value)
                                            }
                                            maxLength={120}
                                            required
                                        />
                                    </FormField>

                                    <FormField
                                        label="Category"
                                        error={errors.category_id}
                                        required
                                    >
                                        <select
                                            name="category_id"
                                            className="field"
                                            defaultValue={
                                                product?.category_id ?? ''
                                            }
                                            required
                                        >
                                            <option value="">
                                                Select a category
                                            </option>
                                            {categories.map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </FormField>

                                    <FormField
                                        label="Description"
                                        error={errors.description}
                                        counter={
                                            <span className="text-caption text-muted-foreground">
                                                {description.length}/3000
                                            </span>
                                        }
                                    >
                                        <TextArea
                                            name="description"
                                            value={description}
                                            onChange={(e) =>
                                                setDescription(e.target.value)
                                            }
                                            rows={6}
                                            maxLength={3000}
                                        />
                                    </FormField>
                                </div>
                            </section>

                            {/* Media */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">Photos</h2>
                                <ImageUploader
                                    files={imageFiles}
                                    onChange={setImageFiles}
                                    existing={existingImages.filter(
                                        (img) => !!img.url,
                                    )}
                                    onRemoveExisting={(id) =>
                                        setExistingImages((prev) =>
                                            prev.filter((img) => img.id !== id),
                                        )
                                    }
                                    max={9}
                                    label="Add product photos"
                                />
                            </section>

                            {/* Product video */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">Product video</h2>
                                <VideoUploader
                                    file={videoFile}
                                    onChange={(file, duration) => {
                                        setVideoFile(file);
                                        setVideoDuration(duration);
                                        if (file) {
                                            setRemoveVideo(false);
                                        }
                                    }}
                                    existing={existingVideo}
                                    onRemoveExisting={() => {
                                        setExistingVideo(null);
                                        setRemoveVideo(true);
                                        setVideoDuration(null);
                                    }}
                                    error={errors.video}
                                />
                            </section>

                            {/* Affiliate (owner-only) */}
                            {isOwner && (
                                <section
                                    className="panel p-4 md:p-6"
                                    data-testid="affiliate-panel"
                                >
                                    <div className="mb-4">
                                        <h2 className="text-h3">
                                            Affiliate program
                                        </h2>
                                        <p className="mt-1 text-body-sm text-muted-foreground">
                                            Earnings accrue only once the
                                            program launches.
                                        </p>
                                    </div>
                                    <div className="grid gap-4">
                                        <Switch
                                            id="affiliate_enabled"
                                            name="affiliate_enabled"
                                            label="Allow affiliates to promote this product"
                                            checked={affiliateEnabled}
                                            onChange={(e) =>
                                                setAffiliateEnabled(
                                                    e.target.checked,
                                                )
                                            }
                                        />

                                        {affiliateEnabled && (
                                            <div className="grid gap-4 pt-2">
                                                <FormField
                                                    label="Affiliate commission (%)"
                                                    error={
                                                        errors.affiliate_commission_percent
                                                    }
                                                    help="Between 1% and 30%. Paid to creators when their referral leads to a completed order."
                                                    required
                                                >
                                                    <Input
                                                        type="number"
                                                        name="affiliate_commission_percent"
                                                        min="1"
                                                        max="30"
                                                        step="0.1"
                                                        value={affiliatePercent}
                                                        onChange={(e) =>
                                                            setAffiliatePercent(
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                </FormField>

                                                {priceInCentavos > 0 && (
                                                    <div className="bg-muted/40 rounded-lg border border-border p-4 text-body-sm">
                                                        <h3 className="mb-2 font-medium text-foreground">
                                                            Live payout
                                                            breakdown (based on{' '}
                                                            {formatPeso(
                                                                priceInCentavos,
                                                            )}
                                                            )
                                                        </h3>
                                                        <div className="space-y-1.5 text-muted-foreground">
                                                            <div className="flex justify-between">
                                                                <span>
                                                                    Affiliate
                                                                    commission (
                                                                    {
                                                                        commissionPercent
                                                                    }
                                                                    %):
                                                                </span>
                                                                <span className="font-medium text-foreground">
                                                                    {formatPeso(
                                                                        affiliateCentavos,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>
                                                                    Platform fee
                                                                    (
                                                                    {(
                                                                        platformBps /
                                                                        100
                                                                    ).toFixed(
                                                                        1,
                                                                    )}
                                                                    %):
                                                                </span>
                                                                <span className="font-medium text-foreground">
                                                                    {formatPeso(
                                                                        platformCentavos,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 flex justify-between border-t border-border pt-2 font-medium text-foreground">
                                                                <span>
                                                                    Estimated
                                                                    seller
                                                                    payout:
                                                                </span>
                                                                <span className="font-semibold text-primary">
                                                                    {formatPeso(
                                                                        netCentavos,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Sales information */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">
                                    Sales information
                                </h2>
                                <div className="grid gap-4">
                                    {!hasVariations && (
                                        <>
                                            <FormField
                                                label="Regular price (₱)"
                                                error={errors.price}
                                                required
                                            >
                                                <Input
                                                    type="number"
                                                    name="price"
                                                    min="1"
                                                    step="0.01"
                                                    value={regularPrice}
                                                    onChange={(e) =>
                                                        setRegularPrice(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </FormField>
                                            <FormField
                                                label="Sale price (₱, optional)"
                                                error={errors.sale_price}
                                            >
                                                <Input
                                                    type="number"
                                                    name="sale_price"
                                                    min="1"
                                                    step="0.01"
                                                    value={salePrice}
                                                    onChange={(e) =>
                                                        setSalePrice(
                                                            e.target.value,
                                                        )
                                                    }
                                                />
                                            </FormField>
                                            <FormField
                                                label="Stock"
                                                error={errors.stock}
                                                required
                                            >
                                                <Input
                                                    type="number"
                                                    name="stock"
                                                    min="0"
                                                    step="1"
                                                    defaultValue={
                                                        product?.stock ??
                                                        product?.variations?.[0]
                                                            ?.stock ??
                                                        ''
                                                    }
                                                />
                                            </FormField>
                                        </>
                                    )}

                                    <Switch
                                        id="has_variations"
                                        name="has_variations"
                                        label="This product has multiple variants (e.g. size, colour)"
                                        checked={hasVariations}
                                        onChange={(e) => {
                                            setHasVariations(e.target.checked);
                                            if (e.target.checked) {
                                                setVariations((p) =>
                                                    buildVariations(
                                                        option1Values,
                                                        option2Values,
                                                        !!option2Name,
                                                        p,
                                                    ),
                                                );
                                            }
                                        }}
                                    />

                                    {hasVariations && (
                                        <div className="mt-2">
                                            <div className="mb-3 grid gap-3 sm:grid-cols-2">
                                                <FormField label="Option 1 name">
                                                    <Input
                                                        name="option1_name"
                                                        value={option1Name}
                                                        onChange={(e) =>
                                                            setOption1Name(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="e.g. Size"
                                                    />
                                                </FormField>
                                                <FormField label="Option 2 name (optional)">
                                                    <Input
                                                        name="option2_name"
                                                        value={option2Name}
                                                        onChange={(e) => {
                                                            const next =
                                                                e.target.value;
                                                            const wasEmpty =
                                                                !option2Name;
                                                            const isEmpty =
                                                                !next;
                                                            setOption2Name(
                                                                next,
                                                            );
                                                            if (
                                                                wasEmpty !==
                                                                isEmpty
                                                            ) {
                                                                setVariations(
                                                                    (p) =>
                                                                        buildVariations(
                                                                            option1Values,
                                                                            option2Values,
                                                                            !isEmpty,
                                                                            p,
                                                                        ),
                                                                );
                                                            }
                                                        }}
                                                        placeholder="e.g. Colour"
                                                    />
                                                </FormField>
                                            </div>
                                            <VariantMatrix
                                                option1Name={option1Name}
                                                option2Name={
                                                    option2Name || undefined
                                                }
                                                option1Values={option1Values}
                                                option2Values={option2Values}
                                                variations={variations}
                                                onChangeVariations={
                                                    setVariations
                                                }
                                                onAddOption1Value={(v) => {
                                                    const next1 = [
                                                        ...option1Values,
                                                        v,
                                                    ];
                                                    setOption1Values(next1);
                                                    setVariations((p) =>
                                                        buildVariations(
                                                            next1,
                                                            option2Values,
                                                            !!option2Name,
                                                            p,
                                                        ),
                                                    );
                                                }}
                                                onRemoveOption1Value={(v) => {
                                                    const next1 =
                                                        option1Values.filter(
                                                            (x) => x !== v,
                                                        );
                                                    setOption1Values(next1);
                                                    setVariations((p) =>
                                                        buildVariations(
                                                            next1,
                                                            option2Values,
                                                            !!option2Name,
                                                            p,
                                                        ),
                                                    );
                                                }}
                                                onAddOption2Value={(v) => {
                                                    const next2 = [
                                                        ...option2Values,
                                                        v,
                                                    ];
                                                    setOption2Values(next2);
                                                    setVariations((p) =>
                                                        buildVariations(
                                                            option1Values,
                                                            next2,
                                                            !!option2Name,
                                                            p,
                                                        ),
                                                    );
                                                }}
                                                onRemoveOption2Value={(v) => {
                                                    const next2 =
                                                        option2Values.filter(
                                                            (x) => x !== v,
                                                        );
                                                    setOption2Values(next2);
                                                    setVariations((p) =>
                                                        buildVariations(
                                                            option1Values,
                                                            next2,
                                                            !!option2Name,
                                                            p,
                                                        ),
                                                    );
                                                }}
                                                error={errors.variations}
                                                errors={errors}
                                                defaults={shipping}
                                            />
                                            {/* Hidden inputs for variations */}
                                            {variations.map((v, i) => (
                                                <div key={i} hidden>
                                                    <input
                                                        type="hidden"
                                                        name={`variations[${i}][option1_value]`}
                                                        value={v.option1_value}
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`variations[${i}][option2_value]`}
                                                        value={
                                                            v.option2_value ??
                                                            ''
                                                        }
                                                    />
                                                    <input
                                                        type="hidden"
                                                        name={`variations[${i}][price]`}
                                                        value={v.price}
                                                    />
                                                    {v.sale_price != null &&
                                                        v.sale_price > 0 && (
                                                            <input
                                                                type="hidden"
                                                                name={`variations[${i}][sale_price]`}
                                                                value={
                                                                    v.sale_price
                                                                }
                                                            />
                                                        )}
                                                    <input
                                                        type="hidden"
                                                        name={`variations[${i}][stock]`}
                                                        value={v.stock}
                                                    />
                                                    {v.sku && (
                                                        <input
                                                            type="hidden"
                                                            name={`variations[${i}][sku]`}
                                                            value={v.sku}
                                                        />
                                                    )}
                                                    {v.weight != null && (
                                                        <input
                                                            type="hidden"
                                                            name={`variations[${i}][weight]`}
                                                            value={v.weight}
                                                        />
                                                    )}
                                                    {v.length != null && (
                                                        <input
                                                            type="hidden"
                                                            name={`variations[${i}][length]`}
                                                            value={v.length}
                                                        />
                                                    )}
                                                    {v.width != null && (
                                                        <input
                                                            type="hidden"
                                                            name={`variations[${i}][width]`}
                                                            value={v.width}
                                                        />
                                                    )}
                                                    {v.height != null && (
                                                        <input
                                                            type="hidden"
                                                            name={`variations[${i}][height]`}
                                                            value={v.height}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Shipping. With variations enabled these are the defaults
                                every variation inherits; a variation can override
                                them in the variations table. */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-1 text-h3">
                                    {hasVariations
                                        ? 'Default shipping'
                                        : 'Shipping'}
                                </h2>
                                {hasVariations && (
                                    <p className="mb-4 text-body-sm text-muted-foreground">
                                        Applies to every variation unless you
                                        set its own weight or size in the
                                        variations table above.
                                    </p>
                                )}
                                <div
                                    className={`grid grid-cols-2 gap-4 sm:grid-cols-4 ${
                                        hasVariations ? '' : 'mt-3'
                                    }`}
                                >
                                    <FormField
                                        label="Weight (kg)"
                                        error={errors.weight}
                                        required
                                    >
                                        <Input
                                            type="number"
                                            name="weight"
                                            min="0"
                                            step="0.01"
                                            value={shipping.weight}
                                            onChange={(e) =>
                                                setShipping((s) => ({
                                                    ...s,
                                                    weight: e.target.value,
                                                }))
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Length (cm)"
                                        error={errors.length}
                                    >
                                        <Input
                                            type="number"
                                            name="length"
                                            min="0"
                                            step="0.1"
                                            value={shipping.length}
                                            onChange={(e) =>
                                                setShipping((s) => ({
                                                    ...s,
                                                    length: e.target.value,
                                                }))
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Width (cm)"
                                        error={errors.width}
                                    >
                                        <Input
                                            type="number"
                                            name="width"
                                            min="0"
                                            step="0.1"
                                            value={shipping.width}
                                            onChange={(e) =>
                                                setShipping((s) => ({
                                                    ...s,
                                                    width: e.target.value,
                                                }))
                                            }
                                        />
                                    </FormField>
                                    <FormField
                                        label="Height (cm)"
                                        error={errors.height}
                                    >
                                        <Input
                                            type="number"
                                            name="height"
                                            min="0"
                                            step="0.1"
                                            value={shipping.height}
                                            onChange={(e) =>
                                                setShipping((s) => ({
                                                    ...s,
                                                    height: e.target.value,
                                                }))
                                            }
                                        />
                                    </FormField>
                                </div>
                            </section>

                            {/* Sharing */}
                            {isEditing && sharing && (
                                <section className="panel p-4 md:p-6">
                                    <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h2 className="text-h3">Sharing</h2>
                                            <p className="text-body-sm text-muted-foreground">
                                                Track how buyers share this
                                                product.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6 text-body-sm">
                                            <div>
                                                <span className="text-caption text-muted-foreground">
                                                    Last 30 days:{' '}
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {sharing.recent}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-caption text-muted-foreground">
                                                    All time:{' '}
                                                </span>
                                                <span className="font-semibold text-foreground">
                                                    {sharing.total}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-border">
                                        {Object.entries(sharing.by_channel).map(
                                            ([channel, counts]) => (
                                                <div
                                                    key={channel}
                                                    className="flex items-center justify-between py-3 text-body-sm"
                                                >
                                                    <span className="font-medium text-foreground">
                                                        {channelLabels[
                                                            channel
                                                        ] ?? channel}
                                                    </span>
                                                    <div className="flex items-center gap-6 text-caption text-muted-foreground">
                                                        <span>
                                                            Last 30 days:{' '}
                                                            <strong className="text-foreground">
                                                                {counts.recent}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            All time:{' '}
                                                            <strong className="text-foreground">
                                                                {counts.all}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sticky bottom bar */}
                        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] z-sticky-bar border-t border-border bg-surface px-[var(--gutter)] pt-3 pb-safe md:bottom-0 lg:left-[var(--sidebar-w)]">
                            <div className="mx-auto flex max-w-container items-center gap-3">
                                <span className="hidden flex-1 text-body-sm text-muted-foreground lg:block">
                                    {isEditing
                                        ? 'Editing draft'
                                        : 'New product'}
                                </span>
                                <Button
                                    type="submit"
                                    name="published"
                                    value="0"
                                    variant="neutral"
                                    disabled={processing}
                                >
                                    Save draft
                                </Button>
                                <Button
                                    type="submit"
                                    name="published"
                                    value="1"
                                    disabled={processing}
                                >
                                    Publish
                                </Button>
                            </div>
                        </div>

                        {/* Bottom spacer for sticky bar */}
                        <div className="h-20" />
                    </div>
                )}
            </Form>
        </>
    );
}
