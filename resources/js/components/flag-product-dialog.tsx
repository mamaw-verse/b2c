import { Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { TextArea } from '@/components/ui/textarea';
import { store as flagProduct } from '@/actions/App/Http/Controllers/Admin/ModerationFlagController';
import { index as searchProducts } from '@/actions/App/Http/Controllers/Admin/ProductSearchController';

export type FlagProductDialogProps = {
    open: boolean;
    onClose: () => void;
    initialProduct?: {
        id: string;
        name: string;
        shop_name?: string;
        thumbnail_url?: string | null;
    } | null;
    reasons?: Record<string, string>;
};

type SearchResultProduct = {
    id: string;
    name: string;
    slug: string;
    price: number | string;
    shop_name?: string;
    thumbnail_url?: string | null;
};

const DEFAULT_REASONS: Record<string, string> = {
    misleading_content: 'Misleading content',
    inappropriate_content: 'Inappropriate content',
    spam: 'Spam',
    counterfeit_goods: 'Counterfeit goods',
    other: 'Other',
};

export function FlagProductDialog({
    open,
    onClose,
    initialProduct = null,
    reasons = DEFAULT_REASONS,
}: FlagProductDialogProps) {
    const [selectedProduct, setSelectedProduct] = useState<{
        id: string;
        name: string;
        shop_name?: string;
        thumbnail_url?: string | null;
    } | null>(initialProduct);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResultProduct[]>(
        [],
    );
    const [searching, setSearching] = useState(false);
    const [reason, setReason] = useState('');
    const [note, setNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync initialProduct if passed
    useEffect(() => {
        if (initialProduct) {
            setSelectedProduct(initialProduct);
        }
    }, [initialProduct]);

    // Reset when modal closes/opens
    useEffect(() => {
        if (!open) {
            if (!initialProduct) {
                setSelectedProduct(null);
            }
            setSearchQuery('');
            setSearchResults([]);
            setReason('');
            setNote('');
            setError(null);
        }
    }, [open, initialProduct]);

    // Debounced search
    useEffect(() => {
        if (!open || selectedProduct) {
            return;
        }

        const trimmed = searchQuery.trim();
        if (trimmed.length < 2) {
            setSearchResults([]);
            return;
        }

        const timeout = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await fetch(
                    searchProducts.url({ query: { q: trimmed } }),
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );
                if (res.ok) {
                    const data = (await res.json()) as {
                        products?: SearchResultProduct[];
                    };
                    setSearchResults(data.products ?? []);
                }
            } catch {
                // Ignore transient search network errors
            } finally {
                setSearching(false);
            }
        }, 250);

        return () => clearTimeout(timeout);
    }, [searchQuery, open, selectedProduct]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct) {
            setError('Please select a product to flag.');
            return;
        }

        if (!reason) {
            setError('Please select a flag reason.');
            return;
        }

        if (!note.trim()) {
            setError('Please provide a note explaining the reason.');
            return;
        }

        setError(null);
        setSubmitting(true);

        router.post(
            flagProduct.url(),
            {
                product_id: selectedProduct.id,
                reason,
                note: note.trim(),
            },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (errs) => {
                    const firstError = Object.values(errs)[0];
                    setError(
                        typeof firstError === 'string'
                            ? firstError
                            : 'Failed to flag product.',
                    );
                },
                onFinish: () => {
                    setSubmitting(false);
                },
            },
        );
    };

    return (
        <Modal
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    onClose();
                }
            }}
            title="Flag product for moderation"
            kind="responsive"
            footer={
                <div className="flex w-full items-center justify-end gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={
                            !selectedProduct ||
                            !reason ||
                            !note.trim() ||
                            submitting
                        }
                    >
                        {submitting ? 'Flagging...' : 'Flag product'}
                    </Button>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="grid gap-4">
                {error && (
                    <div
                        role="alert"
                        className="rounded-tile border border-danger/30 bg-danger-soft p-3 text-body-sm text-danger-text"
                    >
                        {error}
                    </div>
                )}

                {/* Product Selection */}
                <FormField label="Product" id="flag-product">
                    {selectedProduct ? (
                        <div className="flex items-center justify-between gap-3 rounded-tile border border-border bg-surface-muted p-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                                {selectedProduct.thumbnail_url ? (
                                    <img
                                        src={selectedProduct.thumbnail_url}
                                        alt=""
                                        className="size-10 shrink-0 rounded-tile object-cover"
                                    />
                                ) : (
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-tile border border-border bg-surface text-caption text-muted-foreground">
                                        No img
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-body-sm font-bold text-foreground">
                                        {selectedProduct.name}
                                    </p>
                                    {selectedProduct.shop_name && (
                                        <p className="truncate text-caption text-muted-foreground">
                                            Shop: {selectedProduct.shop_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {!initialProduct && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedProduct(null);
                                        setSearchQuery('');
                                    }}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    Change
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="relative flex items-center">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-3 size-4 text-muted-foreground"
                                />
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    placeholder="Search by product name, slug, or shop..."
                                    className="pr-9 pl-9"
                                    autoFocus
                                />
                                {searching && (
                                    <Loader2
                                        aria-hidden="true"
                                        className="pointer-events-none absolute right-3 size-4 animate-spin text-muted-foreground"
                                    />
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <ul
                                    className="z-dropdown shadow-elevated absolute mt-1 max-h-52 w-full overflow-y-auto rounded-panel border border-border bg-surface"
                                    aria-label="Matching products"
                                >
                                    {searchResults.map((product) => (
                                        <li key={product.id}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedProduct(product);
                                                    setSearchResults([]);
                                                }}
                                                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-surface-muted"
                                            >
                                                {product.thumbnail_url ? (
                                                    <img
                                                        src={
                                                            product.thumbnail_url
                                                        }
                                                        alt=""
                                                        className="size-8 shrink-0 rounded-tile object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-tile border border-border bg-surface-muted text-caption text-muted-foreground">
                                                        –
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-body-sm font-bold text-foreground">
                                                        {product.name}
                                                    </p>
                                                    <p className="truncate text-caption text-muted-foreground">
                                                        {product.shop_name
                                                            ? `Shop: ${product.shop_name}`
                                                            : product.slug}
                                                    </p>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {searchQuery.trim().length >= 2 &&
                                !searching &&
                                searchResults.length === 0 && (
                                    <p className="mt-1 text-caption text-muted-foreground">
                                        No products matching &ldquo;
                                        {searchQuery}&rdquo;.
                                    </p>
                                )}
                        </div>
                    )}
                </FormField>

                {/* Reason Selection */}
                <FormField label="Reason" required>
                    <Select
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Select a reason..."
                        options={Object.entries(reasons).map(
                            ([value, label]) => ({ value, label }),
                        )}
                    />
                </FormField>

                {/* Note */}
                <FormField label="Note / Explanation" required>
                    <TextArea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Explain why this product requires moderator action..."
                        rows={3}
                    />
                </FormField>
            </form>
        </Modal>
    );
}
