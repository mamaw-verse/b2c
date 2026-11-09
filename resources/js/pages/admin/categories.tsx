import { Form, Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
    destroy as destroyCategory,
    store as storeCategory,
    update as updateCategory,
} from '@/routes/admin/categories';

type Category = {
    id: string;
    parent_id: string | null;
    parent_name: string | null;
    name: string;
    slug: string;
    icon: string;
    sort_order: number;
    commission_bps: number | null;
    requires_certification: boolean;
    products_count: number;
    children_count: number;
};

function CategoryFields({
    categories,
    category,
    errors,
    includeSlug = false,
}: {
    categories: Category[];
    category?: Category;
    errors: Record<string, string>;
    includeSlug?: boolean;
}) {
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Name" required error={errors.name}>
                <Input name="name" defaultValue={category?.name ?? ''} />
            </FormField>
            {includeSlug && (
                <FormField
                    label="Slug"
                    optional
                    help="Lowercase, hyphenated. Generated from the name when empty."
                    error={errors.slug}
                >
                    <Input name="slug" defaultValue={category?.slug ?? ''} />
                </FormField>
            )}
            <FormField label="Parent" optional error={errors.parent_id}>
                <Select
                    name="parent_id"
                    defaultValue={category?.parent_id ?? ''}
                >
                    <option value="">Top level</option>
                    {categories
                        .filter((option) => option.id !== category?.id)
                        .map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.parent_name
                                    ? `${option.parent_name} › ${option.name}`
                                    : option.name}
                            </option>
                        ))}
                </Select>
            </FormField>
            <FormField
                label="Icon"
                required
                help="Icon key shown in storefront navigation."
                error={errors.icon}
            >
                <Input name="icon" defaultValue={category?.icon ?? 'package'} />
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
                label="Commission %"
                optional
                help="Leave blank to inherit the parent or platform rate."
                error={errors.commission_rate}
            >
                <Input
                    name="commission_rate"
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    defaultValue={
                        category?.commission_bps !== null &&
                        category?.commission_bps !== undefined
                            ? category.commission_bps / 100
                            : ''
                    }
                />
            </FormField>
            <div className="flex items-center gap-2 sm:col-span-2">
                <input
                    id={category ? `cert-${category.id}` : 'cert-new'}
                    type="checkbox"
                    name="requires_certification"
                    defaultChecked={category?.requires_certification ?? true}
                    className="size-4"
                />
                <label
                    htmlFor={category ? `cert-${category.id}` : 'cert-new'}
                    className="text-body-sm"
                >
                    Requires halal certification
                </label>
            </div>
            {errors.category && (
                <p className="text-body-sm font-bold text-danger-text sm:col-span-2">
                    {errors.category}
                </p>
            )}
        </div>
    );
}

export default function AdminCategories({
    categories,
}: {
    categories: Category[];
}) {
    const rows: { category: Category; depth: number }[] = [];
    const walk = (parentId: string | null, depth: number) => {
        categories
            .filter((category) => category.parent_id === parentId)
            .forEach((category) => {
                rows.push({ category, depth });
                walk(category.id, depth + 1);
            });
    };
    walk(null, 0);

    const renderRow = (category: Category, depth = 0) => (
        <li key={category.id} className="panel grid gap-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p
                    className="text-label"
                    style={{ paddingLeft: `${depth * 1.5}rem` }}
                >
                    {depth > 0 && '↳ '}
                    {category.name}
                </p>
                <div className="flex items-center gap-2">
                    {category.requires_certification && (
                        <Badge variant="info">certification</Badge>
                    )}
                    {category.commission_bps !== null && (
                        <Badge variant="neutral">
                            {category.commission_bps / 100}% commission
                        </Badge>
                    )}
                </div>
            </div>
            <p className="text-body-sm text-muted-foreground">
                /{category.slug} · icon {category.icon} · sort{' '}
                {category.sort_order} · {category.products_count} products
                {category.children_count > 0 &&
                    ` · ${category.children_count} subcategories`}
            </p>
            <details className="group">
                <summary className="cursor-pointer text-body-sm font-medium text-primary-text">
                    Edit
                </summary>
                <div className="mt-3 grid gap-3">
                    <Form
                        action={updateCategory({ category: category.id }).url}
                        method="put"
                        options={{ preserveScroll: true }}
                    >
                        {({ errors }) => (
                            <div className="grid gap-3">
                                <CategoryFields
                                    categories={categories}
                                    category={category}
                                    errors={errors}
                                />
                                <div>
                                    <Button type="submit" size="sm">
                                        Save
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                    {category.products_count === 0 &&
                        category.children_count === 0 && (
                            <Form
                                action={
                                    destroyCategory({ category: category.id })
                                        .url
                                }
                                method="delete"
                                options={{ preserveScroll: true }}
                            >
                                {({ errors }) => (
                                    <div className="grid gap-1">
                                        <Button
                                            type="submit"
                                            variant="outline"
                                            size="sm"
                                        >
                                            Delete
                                        </Button>
                                        {errors.category && (
                                            <p className="text-body-sm font-bold text-danger-text">
                                                {errors.category}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </Form>
                        )}
                </div>
            </details>
        </li>
    );

    return (
        <AdminLayout>
            <Head title="Categories" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Categories</h1>

                <details className="panel p-4" data-test="new-category">
                    <summary className="cursor-pointer text-label">
                        New category
                    </summary>
                    <Form
                        action={storeCategory().url}
                        method="post"
                        className="mt-3"
                    >
                        {({ errors }) => (
                            <div className="grid gap-3">
                                <CategoryFields
                                    categories={categories}
                                    errors={errors}
                                    includeSlug
                                />
                                <div>
                                    <Button type="submit" size="sm">
                                        Create category
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Form>
                </details>

                <ul className="grid gap-3">
                    {rows.map(({ category, depth }) =>
                        renderRow(category, depth),
                    )}
                </ul>
            </div>
        </AdminLayout>
    );
}
