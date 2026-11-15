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
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
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
}: {
    categories: Category[];
    category?: Category;
    errors: Record<string, string>;
}) {
    // Slug is generated on create and fixed afterwards, so only the create form allows editing it.
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
                        ? 'Lowercase, hyphenated. Generated from the name when empty.'
                        : undefined
                }
                error={errors.slug}
            >
                <Input
                    name="slug"
                    defaultValue={category?.slug ?? ''}
                    readOnly={!isNew}
                />
            </FormField>
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
                        category?.commission_bps != null
                            ? category.commission_bps / 100
                            : ''
                    }
                />
            </FormField>
            <div className="border-t border-border pt-2 sm:col-span-2">
                <Switch
                    id="requires_certification"
                    name="requires_certification"
                    value="1"
                    defaultChecked={category?.requires_certification ?? true}
                    label="Requires halal certification"
                    inline
                />
                {errors.category && (
                    <p className="mt-1 text-body-sm font-bold text-danger-text">
                        {errors.category}
                    </p>
                )}
            </div>
        </div>
    );
}

type CategoryNode = {
    category: Category;
    depth: number;
    children: CategoryNode[];
};

function buildCategoryTree(categories: Category[]): CategoryNode[] {
    const ids = new Set(categories.map((c) => c.id));
    const buildNodes = (
        parentId: string | null,
        depth: number,
    ): CategoryNode[] => {
        return categories
            .filter((c) => {
                if (parentId === null) {
                    return c.parent_id === null || !ids.has(c.parent_id);
                }
                return c.parent_id === parentId;
            })
            .map((category) => ({
                category,
                depth,
                children: buildNodes(category.id, depth + 1),
            }));
    };

    return buildNodes(null, 0);
}

function CategoryItem({
    node,
    onEdit,
}: {
    node: CategoryNode;
    onEdit: (category: Category) => void;
}) {
    const { category, depth, children } = node;
    const hasChildren = children.length > 0;
    const metaText = `/${category.slug} · icon ${category.icon} · sort ${category.sort_order} · ${category.products_count} products${category.children_count > 0 ? ` · ${category.children_count} subcategories` : ''}`;

    return (
        <li className="relative">
            {depth > 0 && (
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[1.125rem] -left-2.5 w-2.5 border-t border-border sm:-left-4 sm:w-4"
                />
            )}

            <div
                className={cn(
                    'panel flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 md:flex-nowrap',
                    depth > 0 && 'border-border/80 bg-surface-subtle',
                )}
                data-test="category-row"
            >
                <div className="order-1 flex max-w-[calc(100%-2.5rem)] min-w-0 items-center md:max-w-none md:shrink-0">
                    <p
                        className={cn(
                            'truncate',
                            depth === 0
                                ? 'text-label font-bold text-foreground'
                                : 'text-body-sm font-medium text-foreground',
                        )}
                    >
                        {category.name}
                    </p>
                </div>

                <div className="order-2 ml-auto shrink-0 md:order-4 md:ml-0">
                    <IconButton
                        variant="plain"
                        icon={<Pencil aria-hidden="true" className="size-4" />}
                        label={`Edit ${category.name}`}
                        onClick={() => onEdit(category)}
                        data-test="edit-category"
                    />
                </div>

                <p
                    className="order-3 min-w-0 basis-full truncate text-body-sm text-muted-foreground md:order-2 md:flex-1 md:basis-auto"
                    title={metaText}
                >
                    {metaText}
                </p>

                {(category.requires_certification ||
                    category.commission_bps !== null) && (
                    <div className="order-4 flex shrink-0 flex-wrap items-center gap-1.5 md:order-3">
                        {category.requires_certification && (
                            <Badge variant="info">certification</Badge>
                        )}
                        {category.commission_bps !== null && (
                            <Badge variant="neutral">
                                {category.commission_bps / 100}% commission
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {hasChildren && (
                <ul
                    role="group"
                    aria-label={`Subcategories of ${category.name}`}
                    className="relative mt-1.5 ml-2.5 space-y-1.5 border-l border-border pl-2.5 sm:ml-4 sm:pl-4"
                >
                    {children.map((child) => (
                        <CategoryItem
                            key={child.category.id}
                            node={child}
                            onEdit={onEdit}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default function AdminCategories({
    categories,
}: {
    categories: Category[];
}) {
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<Category | null>(null);

    const tree = buildCategoryTree(categories);

    return (
        <AdminLayout>
            <Head title="Categories" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <h1 className="text-h1">Categories</h1>
                    <Button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="w-full md:w-auto"
                        data-test="new-category-button"
                    >
                        New category
                    </Button>
                </div>

                {tree.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        No categories yet.
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {tree.map((node) => (
                            <CategoryItem
                                key={node.category.id}
                                node={node}
                                onEdit={setEditing}
                            />
                        ))}
                    </ul>
                )}
            </div>

            {creating && (
                <FormModal
                    title="New category"
                    action={storeCategory().url}
                    method="post"
                    submitLabel="Create category"
                    onClose={() => setCreating(false)}
                >
                    {(errors) => (
                        <CategoryFields
                            categories={categories}
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
                        editing.products_count === 0 &&
                        editing.children_count === 0 ? (
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
                        <CategoryFields
                            categories={categories}
                            category={editing}
                            errors={errors}
                        />
                    )}
                </FormModal>
            )}
        </AdminLayout>
    );
}
