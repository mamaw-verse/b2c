import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { BulkActionBar } from '@/components/bulk-action-bar';
import { DataTable, type DataTableColumn } from '@/components/data-table';
import { Media } from '@/components/media';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPeso } from '@/lib/format';
import { create, destroy, edit } from '@/routes/seller/products';

type Product = {
    id: string;
    name: string;
    category_name: string;
    price: number;
    stock: number;
    halal_status: string;
    published: boolean;
    affiliate_enabled?: boolean;
    affiliate_commission_bps?: number | null;
    certifier: string | null;
    variations_count: number;
    image_url?: string | null;
    icon: string;
};

type Category = {
    id: number;
    name: string;
};

type PageProps = {
    products: { data: Product[]; total: number };
    filters: { search?: string; status?: string; category?: string };
    categories: Category[];
};

function halalBadge(status: string) {
    if (status === 'certified') {
        return <Badge variant="halal">Certified</Badge>;
    }
    if (status === 'not_ingestible' || status === 'na') {
        return <Badge variant="neutral">Not ingestible</Badge>;
    }
    return <Badge variant="neutral">{status}</Badge>;
}

export default function SellerProductsIndex({
    products,
    filters,
    categories,
}: PageProps) {
    const { seller } = usePage<{ seller?: { role?: 'owner' | 'staff' } }>()
        .props;
    const isOwner = seller?.role === 'owner';

    const [search, setSearch] = useState(filters.search ?? '');
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [bulkProcessing, setBulkProcessing] = useState(false);

    function applyFilter(params: Record<string, string | number | undefined>) {
        router.get(
            '/seller/products',
            { ...filters, ...params },
            { preserveState: true, replace: true },
        );
    }

    function handleBulkAffiliate(enabled: boolean) {
        if (selectedKeys.length === 0) return;
        setBulkProcessing(true);
        router.post(
            '/seller/products/bulk-affiliate',
            {
                product_ids: selectedKeys,
                enabled,
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setBulkProcessing(false);
                    setSelectedKeys([]);
                },
            },
        );
    }

    const columns: DataTableColumn<Product>[] = [
        {
            key: 'name',
            label: 'Product',
            render: (p) => (
                <div className="flex items-center gap-3">
                    <div className="size-10 shrink-0 overflow-hidden rounded-tile">
                        <Media src={p.image_url} icon={p.icon} label={p.name} />
                    </div>
                    <span className="truncate text-label">{p.name}</span>
                </div>
            ),
        },
        { key: 'category_name', label: 'Category' },
        {
            key: 'price',
            label: 'Price',
            align: 'end',
            render: (p) => (
                <span className="tabular">{formatPeso(p.price)}</span>
            ),
        },
        {
            key: 'stock',
            label: 'Stock',
            align: 'end',
            render: (p) => (
                <span
                    className={
                        p.stock <= 5
                            ? 'text-label text-danger-text'
                            : 'text-label'
                    }
                >
                    {p.stock}
                </span>
            ),
        },
        {
            key: 'halal_status',
            label: 'Halal',
            render: (p) => halalBadge(p.halal_status),
        },
        {
            key: 'published',
            label: 'Status',
            render: (p) => (
                <div className="flex flex-wrap items-center gap-1.5">
                    {p.published ? (
                        <Badge variant="success">Published</Badge>
                    ) : (
                        <Badge variant="neutral">Draft</Badge>
                    )}
                    {p.affiliate_enabled && (
                        <Badge variant="info">
                            Affiliate{' '}
                            {(p.affiliate_commission_bps ?? 500) / 100}%
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            align: 'end',
            render: (p) => (
                <div className="flex justify-end gap-2">
                    <Link
                        href={edit({ product: p.id })}
                        className="btn btn-ghost btn-sm text-label"
                    >
                        Edit
                    </Link>
                    <Link
                        href={destroy({ product: p.id })}
                        method="delete"
                        as="button"
                        className="btn btn-ghost btn-sm text-label text-danger-text"
                        onClick={(e) => {
                            if (
                                !confirm(
                                    'Delete this product? This cannot be undone.',
                                )
                            ) {
                                e.preventDefault();
                            }
                        }}
                    >
                        Delete
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <>
            <Head title="Products" />
            <div className="mx-auto max-w-container p-gutter py-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h1 className="text-h1">Products</h1>
                    <Link href={create()}>
                        <Button>
                            <Plus aria-hidden="true" className="size-4" />
                            Add product
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="mb-4 flex flex-wrap gap-3">
                    <Input
                        placeholder="Search products…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                applyFilter({ search });
                            }
                        }}
                        className="w-full sm:w-72"
                    />
                    <select
                        className="field w-full sm:w-auto"
                        value={filters.status ?? ''}
                        onChange={(e) =>
                            applyFilter({ status: e.target.value || undefined })
                        }
                        aria-label="Filter by status"
                    >
                        <option value="">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                    <select
                        className="field w-full sm:w-auto"
                        value={filters.category ?? ''}
                        onChange={(e) =>
                            applyFilter({
                                category: e.target.value || undefined,
                            })
                        }
                        aria-label="Filter by category"
                    >
                        <option value="">All categories</option>
                        {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                </div>

                {isOwner && (
                    <BulkActionBar
                        selectedCount={selectedKeys.length}
                        onClearSelection={() => setSelectedKeys([])}
                        processing={bulkProcessing}
                    >
                        <button
                            type="button"
                            disabled={bulkProcessing}
                            onClick={() => handleBulkAffiliate(true)}
                            className="btn btn-inverse btn-sm"
                        >
                            <span>Enable affiliate</span>
                        </button>
                        <button
                            type="button"
                            disabled={bulkProcessing}
                            onClick={() => handleBulkAffiliate(false)}
                            className="btn btn-inverse btn-sm"
                        >
                            <span>Disable affiliate</span>
                        </button>
                    </BulkActionBar>
                )}

                <DataTable
                    caption={`${products.total} products`}
                    columns={columns}
                    rows={products.data}
                    rowKey={(p) => String(p.id)}
                    selectable={isOwner}
                    selectedKeys={selectedKeys}
                    onSelectKeys={setSelectedKeys}
                    emptyText="No products yet. Add your first product!"
                />
            </div>
        </>
    );
}
