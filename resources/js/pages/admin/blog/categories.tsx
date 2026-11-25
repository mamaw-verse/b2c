import { Head } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { FormModal, ModalDeleteButton } from '@/components/form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { IconButton } from '@/components/ui/icon-button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TextArea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import {
    destroy as destroyCategory,
    store as storeCategory,
    update as updateCategory,
} from '@/routes/admin/blog/categories';

type BlogCategory = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    sort_order: number;
    is_system: boolean;
    shop_category_id: string | null;
    shop_category_name: string | null;
    posts_count: number;
};
type ShopCategory = { id: string; name: string };

function Fields({
    category,
    shopCategories,
    errors,
}: {
    category?: BlogCategory;
    shopCategories: ShopCategory[];
    errors: Record<string, string>;
}) {
    const isNew = category === undefined;

    return (
        <div className="grid items-start gap-x-3 gap-y-4 sm:grid-cols-2">
            <FormField label="Name" required error={errors.name}>
                <Input name="name" defaultValue={category?.name ?? ''} />
            </FormField>
            <FormField
                label="Slug"
                optional
                help={
                    isNew
                        ? 'Generated from the name when empty.'
                        : 'Fixed after creation because it is part of the public URL.'
                }
                error={errors.slug}
            >
                <Input
                    name={isNew ? 'slug' : undefined}
                    defaultValue={category?.slug ?? ''}
                    readOnly={!isNew}
                />
            </FormField>
            <FormField
                label="Description"
                optional
                help="Real intro copy only. Leave blank until it is written."
                error={errors.description}
                className="sm:col-span-2"
            >
                <TextArea
                    name="description"
                    defaultValue={category?.description ?? ''}
                />
            </FormField>
            <FormField label="Sort order" optional error={errors.sort_order}>
                <Input
                    name="sort_order"
                    type="number"
                    min={0}
                    defaultValue={category?.sort_order ?? 0}
                />
            </FormField>
            <FormField
                label="Shop category for the end-of-post link"
                optional
                error={errors.shop_category_id}
            >
                <Select
                    name="shop_category_id"
                    defaultValue={category?.shop_category_id ?? ''}
                >
                    <option value="">None (hide the link)</option>
                    {shopCategories.map((option) => (
                        <option key={option.id} value={option.id}>
                            {option.name}
                        </option>
                    ))}
                </Select>
            </FormField>
            {errors.category && (
                <p className="text-body-sm font-bold text-danger-text sm:col-span-2">
                    {errors.category}
                </p>
            )}
        </div>
    );
}

export default function BlogCategories({
    categories,
    shop_categories,
}: {
    categories: BlogCategory[];
    shop_categories: ShopCategory[];
}) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<BlogCategory | null>(null);

    return (
        <AdminLayout>
            <Head title="Blog categories" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-h1">Blog categories</h1>
                    <Button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="w-full md:w-auto"
                    >
                        New category
                    </Button>
                </div>

                <ul className="grid gap-2">
                    {categories.map((category) => (
                        <li
                            key={category.id}
                            className="panel flex flex-wrap items-center gap-3 px-4 py-3"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-label font-bold">
                                    {category.name}
                                </p>
                                <p className="truncate text-body-sm text-muted-foreground">
                                    /{category.slug} · sort{' '}
                                    {category.sort_order} ·{' '}
                                    {category.posts_count} posts
                                    {category.shop_category_name
                                        ? ` · links to ${category.shop_category_name}`
                                        : ''}
                                </p>
                            </div>
                            {category.is_system && (
                                <Badge variant="info">system</Badge>
                            )}
                            <IconButton
                                variant="plain"
                                icon={
                                    <Pencil
                                        aria-hidden="true"
                                        className="size-4"
                                    />
                                }
                                label={`Edit ${category.name}`}
                                onClick={() => setEditing(category)}
                            />
                        </li>
                    ))}
                </ul>
            </div>

            {creating && (
                <FormModal
                    title="New blog category"
                    action={storeCategory().url}
                    method="post"
                    submitLabel="Create category"
                    onClose={() => setCreating(false)}
                >
                    {(errors) => (
                        <Fields
                            shopCategories={shop_categories}
                            errors={errors}
                        />
                    )}
                </FormModal>
            )}

            {editing && (
                <FormModal
                    key={editing.id}
                    title={`Edit ${editing.name}`}
                    action={updateCategory({ category: editing.id }).url}
                    method="put"
                    submitLabel="Save changes"
                    onClose={() => setEditing(null)}
                    footerStart={
                        !editing.is_system && editing.posts_count === 0 ? (
                            <ModalDeleteButton
                                url={
                                    destroyCategory({ category: editing.id })
                                        .url
                                }
                                title="Delete category"
                                text={`Delete ${editing.name}? This cannot be undone.`}
                                onDone={() => setEditing(null)}
                            />
                        ) : undefined
                    }
                >
                    {(errors) => (
                        <Fields
                            category={editing}
                            shopCategories={shop_categories}
                            errors={errors}
                        />
                    )}
                </FormModal>
            )}
        </AdminLayout>
    );
}
