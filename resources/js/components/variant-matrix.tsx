import { useState, useId } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface VariationItem {
    option1_value: string;
    option2_value?: string | null;
    price: number;
    stock: number;
    sku?: string | null;
}

export interface VariantMatrixProps {
    option1Name?: string;
    option2Name?: string;
    option1Values?: string[];
    option2Values?: string[];
    variations: VariationItem[];
    onChangeVariations: (variations: VariationItem[]) => void;
    onAddOption1Value?: (val: string) => void;
    onRemoveOption1Value?: (val: string) => void;
    onAddOption2Value?: (val: string) => void;
    onRemoveOption2Value?: (val: string) => void;
    error?: string;
    className?: string;
}

export function VariantMatrix({
    option1Name = 'Grade',
    option2Name = 'Weight',
    option1Values = [],
    option2Values = [],
    variations,
    onChangeVariations,
    onAddOption1Value,
    onRemoveOption1Value,
    onAddOption2Value,
    onRemoveOption2Value,
    error,
    className,
}: VariantMatrixProps) {
    const id = useId();
    const [applyPrice, setApplyPrice] = useState<string>('');
    const [applyStock, setApplyStock] = useState<string>('');
    const [newVal1, setNewVal1] = useState('');
    const [newVal2, setNewVal2] = useState('');
    const [showAddVal1, setShowAddVal1] = useState(false);
    const [showAddVal2, setShowAddVal2] = useState(false);

    const handleApplyAll = () => {
        if (!applyPrice && !applyStock) return;

        const updated = variations.map((v) => ({
            ...v,
            ...(applyPrice !== ''
                ? { price: parseFloat(applyPrice) || 0 }
                : {}),
            ...(applyStock !== ''
                ? { stock: parseInt(applyStock, 10) || 0 }
                : {}),
        }));
        onChangeVariations(updated);
    };

    const handleCellChange = (
        index: number,
        field: 'price' | 'stock' | 'sku',
        value: string,
    ) => {
        const updated = [...variations];
        if (field === 'price') {
            updated[index] = {
                ...updated[index],
                price: parseFloat(value) || 0,
            };
        } else if (field === 'stock') {
            updated[index] = {
                ...updated[index],
                stock: parseInt(value, 10) || 0,
            };
        } else {
            updated[index] = {
                ...updated[index],
                sku: value,
            };
        }
        onChangeVariations(updated);
    };

    return (
        <div className={cn('grid gap-4', className)}>
            <div className="grid gap-4 md:grid-cols-2">
                {/* Option 1 */}
                <div className="grid gap-2">
                    <p className="text-label">
                        Option 1: {option1Name || 'Option 1'}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                        {option1Values.map((v) => (
                            <li
                                key={v}
                                className="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body"
                            >
                                <span>{v}</span>
                                {onRemoveOption1Value && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveOption1Value(v)}
                                        className="btn btn-ghost btn-icon btn-sm text-muted-foreground hover:text-foreground"
                                        aria-label={`Remove ${v}`}
                                    >
                                        <DsIcon name="x" className="size-4" />
                                    </button>
                                )}
                            </li>
                        ))}
                        {onAddOption1Value && (
                            <li>
                                {showAddVal1 ? (
                                    <div className="flex items-center gap-1">
                                        <Input
                                            value={newVal1}
                                            onChange={(e) =>
                                                setNewVal1(e.target.value)
                                            }
                                            placeholder="New value"
                                            className="h-8 w-28 text-body-sm"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (newVal1.trim()) {
                                                        onAddOption1Value(
                                                            newVal1.trim(),
                                                        );
                                                        setNewVal1('');
                                                        setShowAddVal1(false);
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                if (newVal1.trim()) {
                                                    onAddOption1Value(
                                                        newVal1.trim(),
                                                    );
                                                    setNewVal1('');
                                                    setShowAddVal1(false);
                                                }
                                            }}
                                        >
                                            Add
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAddVal1(true)}
                                    >
                                        <DsIcon
                                            name="plus"
                                            className="size-3.5"
                                        />
                                        <span>Add</span>
                                    </Button>
                                )}
                            </li>
                        )}
                    </ul>
                </div>

                {/* Option 2 (optional) */}
                {option2Name && (
                    <div className="grid gap-2">
                        <p className="text-label">Option 2: {option2Name}</p>
                        <ul className="flex flex-wrap gap-2">
                            {option2Values.map((v) => (
                                <li
                                    key={v}
                                    className="inline-flex items-center gap-1 rounded-button border border-border-control bg-surface pl-3 text-body"
                                >
                                    <span>{v}</span>
                                    {onRemoveOption2Value && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onRemoveOption2Value(v)
                                            }
                                            className="btn btn-ghost btn-icon btn-sm text-muted-foreground hover:text-foreground"
                                            aria-label={`Remove ${v}`}
                                        >
                                            <DsIcon
                                                name="x"
                                                className="size-4"
                                            />
                                        </button>
                                    )}
                                </li>
                            ))}
                            {onAddOption2Value && (
                                <li>
                                    {showAddVal2 ? (
                                        <div className="flex items-center gap-1">
                                            <Input
                                                value={newVal2}
                                                onChange={(e) =>
                                                    setNewVal2(e.target.value)
                                                }
                                                placeholder="New value"
                                                className="h-8 w-28 text-body-sm"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (newVal2.trim()) {
                                                            onAddOption2Value(
                                                                newVal2.trim(),
                                                            );
                                                            setNewVal2('');
                                                            setShowAddVal2(
                                                                false,
                                                            );
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => {
                                                    if (newVal2.trim()) {
                                                        onAddOption2Value(
                                                            newVal2.trim(),
                                                        );
                                                        setNewVal2('');
                                                        setShowAddVal2(false);
                                                    }
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowAddVal2(true)}
                                        >
                                            <DsIcon
                                                name="plus"
                                                className="size-3.5"
                                            />
                                            <span>Add</span>
                                        </Button>
                                    )}
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </div>

            {/* Apply to all */}
            <div className="flex flex-wrap items-end gap-2 rounded-panel bg-surface-muted p-3">
                <p className="w-full text-label">Apply to all</p>
                <div className="min-w-28 flex-1">
                    <label className="sr-only" htmlFor={`${id}-price-all`}>
                        Price for all variations
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            ₱
                        </span>
                        <input
                            id={`${id}-price-all`}
                            inputMode="numeric"
                            type="number"
                            value={applyPrice}
                            onChange={(e) => setApplyPrice(e.target.value)}
                            placeholder="Price"
                            className="field tabular pl-7"
                        />
                    </div>
                </div>
                <div className="min-w-28 flex-1">
                    <label className="sr-only" htmlFor={`${id}-stock-all`}>
                        Stock for all variations
                    </label>
                    <div className="relative">
                        <input
                            id={`${id}-stock-all`}
                            inputMode="numeric"
                            type="number"
                            value={applyStock}
                            onChange={(e) => setApplyStock(e.target.value)}
                            placeholder="Stock"
                            className="field tabular"
                        />
                    </div>
                </div>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={handleApplyAll}
                >
                    Apply
                </Button>
            </div>

            {error && (
                <p className="flex items-center gap-1 text-body-sm font-bold text-danger-text">
                    <DsIcon name="circle-alert" className="size-4" />
                    <span>{error}</span>
                </p>
            )}

            {variations.length === 0 ? (
                <p className="text-body-sm text-muted-foreground">
                    Add at least one value to generate variations.
                </p>
            ) : (
                <>
                    {/* Desktop Table (md+) */}
                    <div className="hidden overflow-x-auto rounded-panel border border-border md:block">
                        <table className="w-full table-fixed text-body">
                            <caption className="sr-only">
                                Price and stock per variation
                            </caption>
                            <thead className="bg-surface-subtle">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                    >
                                        {option1Name || 'Option 1'}
                                    </th>
                                    {option2Name && (
                                        <th
                                            scope="col"
                                            className="w-28 px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                        >
                                            {option2Name}
                                        </th>
                                    )}
                                    <th
                                        scope="col"
                                        className="w-36 px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                    >
                                        Price
                                    </th>
                                    <th
                                        scope="col"
                                        className="w-32 px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                    >
                                        Stock
                                    </th>
                                    <th
                                        scope="col"
                                        className="w-40 px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                    >
                                        SKU
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {variations.map((v, i) => (
                                    <tr key={i}>
                                        <th
                                            scope="row"
                                            className="px-3 py-2 text-left text-label"
                                        >
                                            {v.option1_value}
                                        </th>
                                        {option2Name && (
                                            <td className="px-3 py-2">
                                                {v.option2_value ?? '—'}
                                            </td>
                                        )}
                                        <td className="w-36 px-3 py-2">
                                            <label
                                                className="sr-only"
                                                htmlFor={`${id}-p-${i}`}
                                            >
                                                Price, {v.option1_value}{' '}
                                                {v.option2_value}
                                            </label>
                                            <div className="relative">
                                                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                                    ₱
                                                </span>
                                                <input
                                                    id={`${id}-p-${i}`}
                                                    type="number"
                                                    inputMode="numeric"
                                                    value={v.price}
                                                    onChange={(e) =>
                                                        handleCellChange(
                                                            i,
                                                            'price',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="field tabular pl-7"
                                                />
                                            </div>
                                        </td>
                                        <td className="w-32 px-3 py-2">
                                            <label
                                                className="sr-only"
                                                htmlFor={`${id}-st-${i}`}
                                            >
                                                Stock, {v.option1_value}{' '}
                                                {v.option2_value}
                                            </label>
                                            <input
                                                id={`${id}-st-${i}`}
                                                type="number"
                                                inputMode="numeric"
                                                value={v.stock}
                                                onChange={(e) =>
                                                    handleCellChange(
                                                        i,
                                                        'stock',
                                                        e.target.value,
                                                    )
                                                }
                                                className="field tabular"
                                            />
                                        </td>
                                        <td className="px-3 py-2">
                                            <label
                                                className="sr-only"
                                                htmlFor={`${id}-sku-${i}`}
                                            >
                                                SKU, {v.option1_value}{' '}
                                                {v.option2_value}
                                            </label>
                                            <input
                                                id={`${id}-sku-${i}`}
                                                type="text"
                                                value={v.sku ?? ''}
                                                onChange={(e) =>
                                                    handleCellChange(
                                                        i,
                                                        'sku',
                                                        e.target.value,
                                                    )
                                                }
                                                className="field tabular"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards (<md) */}
                    <ul
                        className="grid gap-2 md:hidden"
                        aria-label="Price and stock per variation"
                    >
                        {variations.map((v, i) => (
                            <li key={i} className="card grid gap-2 p-3">
                                <p className="text-label">
                                    {v.option1_value}{' '}
                                    {v.option2_value
                                        ? `· ${v.option2_value}`
                                        : ''}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="grid gap-1">
                                        <span
                                            className="text-body-sm text-muted-foreground"
                                            aria-hidden="true"
                                        >
                                            Price
                                        </span>
                                        <div className="relative">
                                            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                                                ₱
                                            </span>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={v.price}
                                                onChange={(e) =>
                                                    handleCellChange(
                                                        i,
                                                        'price',
                                                        e.target.value,
                                                    )
                                                }
                                                className="field tabular pl-7"
                                                aria-label={`Price, ${v.option1_value} ${v.option2_value ?? ''}`}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-1">
                                        <span
                                            className="text-body-sm text-muted-foreground"
                                            aria-hidden="true"
                                        >
                                            Stock
                                        </span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            value={v.stock}
                                            onChange={(e) =>
                                                handleCellChange(
                                                    i,
                                                    'stock',
                                                    e.target.value,
                                                )
                                            }
                                            className="field tabular"
                                            aria-label={`Stock, ${v.option1_value} ${v.option2_value ?? ''}`}
                                        />
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
