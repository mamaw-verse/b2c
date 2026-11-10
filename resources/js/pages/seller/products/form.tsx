import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { VariantMatrix, type VariationItem } from '@/components/variant-matrix';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
    halal_status: 'certified' | 'not_ingestible' | null;
    certifying_body: string | null;
    certificate_number: string | null;
    valid_until: string | null;
    ingredients: string | null;
    no_pork_alcohol_declared: boolean;
    price: number | null;
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
};

type PageProps = {
    product: ProductData | null;
    categories: Category[];
    certifying_bodies: string[];
};

export default function SellerProductForm({
    product,
    categories,
    certifying_bodies,
}: PageProps) {
    const isEditing = product !== null;
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [halalStatus, setHalalStatus] = useState<string>(
        product?.halal_status ?? '',
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
        product?.option1_values ??
            [...new Set(product?.variations?.map((v) => v.option1_value))],
    );
    const [option2Values, setOption2Values] = useState<string[]>(
        product?.option2_values ??
            [
                ...new Set(
                    product?.variations
                        ?.map((v) => v.option2_value)
                        .filter((v): v is string => v != null),
                ),
            ],
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
                                                0/120
                                            </span>
                                        }
                                    >
                                        <Input
                                            name="name"
                                            defaultValue={product?.name ?? ''}
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
                                                0/3000
                                            </span>
                                        }
                                    >
                                        <TextArea
                                            name="description"
                                            defaultValue={
                                                product?.description ?? ''
                                            }
                                            rows={6}
                                            maxLength={3000}
                                        />
                                    </FormField>
                                </div>
                            </section>

                            {/* Halal information */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-1 text-h3">
                                    Halal information
                                </h2>
                                <p className="mb-4 text-body text-muted-foreground">
                                    Required for food, beverages, cosmetics, and
                                    other ingestible products.
                                </p>
                                <div className="grid gap-4">
                                    <fieldset className="grid gap-2">
                                        <legend className="text-label font-medium">
                                            Halal status
                                        </legend>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="halal_status"
                                                value="certified"
                                                defaultChecked={
                                                    product?.halal_status ===
                                                    'certified'
                                                }
                                                onChange={() =>
                                                    setHalalStatus('certified')
                                                }
                                                className="accent-primary"
                                            />
                                            <span>
                                                Halal certified — has a valid
                                                certificate
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="halal_status"
                                                value="not_ingestible"
                                                defaultChecked={
                                                    product?.halal_status ===
                                                    'not_ingestible'
                                                }
                                                onChange={() =>
                                                    setHalalStatus(
                                                        'not_ingestible',
                                                    )
                                                }
                                                className="accent-primary"
                                            />
                                            <span>
                                                Not ingestible — e.g. clothing,
                                                electronics
                                            </span>
                                        </label>
                                    </fieldset>

                                    {halalStatus === 'certified' && (
                                        <div className="grid gap-4 rounded-panel bg-halal-soft p-4">
                                            <FormField
                                                label="Certifying body"
                                                error={errors.certifying_body}
                                                required
                                            >
                                                <select
                                                    name="certifying_body"
                                                    className="field"
                                                    defaultValue={
                                                        product?.certifying_body ??
                                                        ''
                                                    }
                                                >
                                                    <option value="">
                                                        Select certifying body
                                                    </option>
                                                    {certifying_bodies.map(
                                                        (body) => (
                                                            <option
                                                                key={body}
                                                                value={body}
                                                            >
                                                                {body}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            </FormField>

                                            <FormField
                                                label="Certificate number"
                                                error={
                                                    errors.certificate_number
                                                }
                                                required
                                            >
                                                <Input
                                                    name="certificate_number"
                                                    defaultValue={
                                                        product?.certificate_number ??
                                                        ''
                                                    }
                                                />
                                            </FormField>

                                            <FormField
                                                label="Valid until"
                                                error={errors.valid_until}
                                                required
                                            >
                                                <Input
                                                    type="date"
                                                    name="valid_until"
                                                    defaultValue={
                                                        product?.valid_until ??
                                                        ''
                                                    }
                                                />
                                            </FormField>

                                            <FormField
                                                label="Ingredients"
                                                error={errors.ingredients}
                                            >
                                                <TextArea
                                                    name="ingredients"
                                                    defaultValue={
                                                        product?.ingredients ??
                                                        ''
                                                    }
                                                    rows={3}
                                                    placeholder="List of ingredients…"
                                                />
                                            </FormField>

                                            <label className="flex items-start gap-3 rounded-panel border border-halal bg-halal-soft/50 p-3">
                                                <Checkbox
                                                    name="no_pork_alcohol_declared"
                                                    value="1"
                                                    defaultChecked={
                                                        product?.no_pork_alcohol_declared
                                                    }
                                                    className="mt-0.5"
                                                />
                                                <span className="text-body">
                                                    I declare this product
                                                    contains no pork, lard,
                                                    alcohol, or any
                                                    haram-derived ingredients.
                                                </span>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Media */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">Photos</h2>
                                <ImageUploader
                                    files={imageFiles}
                                    onChange={setImageFiles}
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
                                                label="Price (₱)"
                                                error={errors.price}
                                                required
                                            >
                                                <Input
                                                    type="number"
                                                    name="price"
                                                    min="0"
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
                                        onChange={(e) =>
                                            setHasVariations(e.target.checked)
                                        }
                                    />

                                    {hasVariations && (
                                        <div className="mt-2">
                                            <div className="mb-3 grid gap-3 sm:grid-cols-2">
                                                <FormField label="Option 1 name">
                                                    <Input
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
                                                        value={option2Name}
                                                        onChange={(e) =>
                                                            setOption2Name(
                                                                e.target.value,
                                                            )
                                                        }
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
                                                onAddOption1Value={(v) =>
                                                    setOption1Values((prev) => [
                                                        ...prev,
                                                        v,
                                                    ])
                                                }
                                                onRemoveOption1Value={(v) =>
                                                    setOption1Values((prev) =>
                                                        prev.filter(
                                                            (x) => x !== v,
                                                        ),
                                                    )
                                                }
                                                onAddOption2Value={(v) =>
                                                    setOption2Values((prev) => [
                                                        ...prev,
                                                        v,
                                                    ])
                                                }
                                                onRemoveOption2Value={(v) =>
                                                    setOption2Values((prev) =>
                                                        prev.filter(
                                                            (x) => x !== v,
                                                        ),
                                                    )
                                                }
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
