import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { VariantMatrix, type VariationItem } from '@/components/variant-matrix';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
};

type PageProps = {
    product: ProductData | null;
    categories: Category[];
};

export default function SellerProductForm({ product, categories }: PageProps) {
    const isEditing = product !== null;
    const [name, setName] = useState(product?.name ?? '');
    const [description, setDescription] = useState(product?.description ?? '');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<
        { id: string; url: string }[]
    >(
        () =>
            product?.images
                ?.filter((img) => !!img.url)
                .map((img) => ({ id: img.id, url: img.url })) ?? [],
    );
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
                    }
                );
            }),
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
                    option1_name: hasVariations ? option1Name : null,
                    option2_name: hasVariations ? option2Name || null : null,
                })}
            >
                {({ errors, processing }) => (
                    <div className="mx-auto max-w-4xl p-gutter py-8 pb-28 lg:pb-8">
                        <h1 className="mb-6 text-h1">{title}</h1>

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
                                    existing={existingImages}
                                    onRemoveExisting={(id) =>
                                        setExistingImages((prev) =>
                                            prev.filter((img) => img.id !== id),
                                        )
                                    }
                                    max={9}
                                    label="Add product photos"
                                />
                            </section>

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
                                                    defaultValue={
                                                        product?.price ??
                                                        product?.variations?.[0]
                                                            ?.price ??
                                                        ''
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
                                                    defaultValue={
                                                        product?.sale_price ??
                                                        product?.variations?.[0]
                                                            ?.sale_price ??
                                                        ''
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
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Shipping */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">Shipping</h2>
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                                            defaultValue={product?.weight ?? ''}
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
                                            defaultValue={product?.length ?? ''}
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
                                            defaultValue={product?.width ?? ''}
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
                                            defaultValue={product?.height ?? ''}
                                        />
                                    </FormField>
                                </div>
                            </section>
                        </div>

                        {/* Sticky bottom bar */}
                        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom,0px))] z-sticky-bar border-t border-border bg-surface px-[var(--gutter)] pt-3 pb-safe md:bottom-0 lg:left-[var(--sidebar-w)]">
                            <div className="mx-auto flex max-w-4xl items-center gap-3">
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
