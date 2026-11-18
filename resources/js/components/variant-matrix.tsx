import { useState, useId } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface VariationItem {
    option1_value: string;
    option2_value?: string | null;
    price: number;
    sale_price?: number | null;
    stock: number;
    sku?: string | null;
    weight?: number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
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
    /** Server validation errors keyed like `variations.2.sale_price`. */
    errors?: Record<string, string>;
    /** The product's default shipping values; a blank cell inherits them. */
    defaults?: Partial<Record<ShippingField, number | string | null>>;
    className?: string;
}

export type ShippingField = 'weight' | 'length' | 'width' | 'height';

type CellField = 'price' | 'sale_price' | 'stock' | 'sku' | ShippingField;

interface CellSpec {
    field: CellField;
    label: string;
    mobileLabel: string;
    kind: 'money' | 'number' | 'text';
    step?: string;
    thClass: string;
    placeholder?: string;
}

const CELLS: CellSpec[] = [
    {
        field: 'price',
        label: 'Regular price',
        mobileLabel: 'Regular price',
        kind: 'money',
        thClass: 'w-36 min-w-36',
    },
    {
        field: 'sale_price',
        label: 'Sale price',
        mobileLabel: 'Sale price (opt)',
        kind: 'money',
        thClass: 'w-36 min-w-36',
        placeholder: 'Optional',
    },
    {
        field: 'stock',
        label: 'Stock',
        mobileLabel: 'Stock',
        kind: 'number',
        thClass: 'w-32 min-w-28',
    },
    {
        field: 'sku',
        label: 'SKU',
        mobileLabel: 'SKU',
        kind: 'text',
        thClass: 'w-40 min-w-36',
    },
    {
        field: 'weight',
        label: 'Weight (kg)',
        mobileLabel: 'Weight (kg)',
        kind: 'number',
        step: '0.01',
        thClass: 'w-28 min-w-28',
    },
    {
        field: 'length',
        label: 'Length (cm)',
        mobileLabel: 'Length (cm)',
        kind: 'number',
        step: '0.1',
        thClass: 'w-28 min-w-28',
    },
    {
        field: 'width',
        label: 'Width (cm)',
        mobileLabel: 'Width (cm)',
        kind: 'number',
        step: '0.1',
        thClass: 'w-28 min-w-28',
    },
    {
        field: 'height',
        label: 'Height (cm)',
        mobileLabel: 'Height (cm)',
        kind: 'number',
        step: '0.1',
        thClass: 'w-28 min-w-28',
    },
];

const isShippingField = (f: CellField): f is ShippingField =>
    f === 'weight' || f === 'length' || f === 'width' || f === 'height';

function cellValue(v: VariationItem, field: CellField): string | number {
    switch (field) {
        case 'price':
            return v.price;
        case 'stock':
            return v.stock;
        case 'sku':
            return v.sku ?? '';
        case 'sale_price':
            return v.sale_price ?? '';
        default:
            return v[field] ?? '';
    }
}

/** Mistakes the seller can see before submitting; the server stays the authority. */
function clientError(v: VariationItem, field: CellField): string | undefined {
    if (
        field === 'sale_price' &&
        v.sale_price != null &&
        v.sale_price > 0 &&
        v.sale_price >= v.price
    ) {
        return 'The sale price must be lower than the regular price.';
    }

    return undefined;
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
    errors,
    defaults,
    className,
}: VariantMatrixProps) {
    const id = useId();
    const [applyPrice, setApplyPrice] = useState<string>('');
    const [applySalePrice, setApplySalePrice] = useState<string>('');
    const [applyStock, setApplyStock] = useState<string>('');
    const [applyWeight, setApplyWeight] = useState<string>('');
    const [applyLength, setApplyLength] = useState<string>('');
    const [applyWidth, setApplyWidth] = useState<string>('');
    const [applyHeight, setApplyHeight] = useState<string>('');
    const [newVal1, setNewVal1] = useState('');
    const [newVal2, setNewVal2] = useState('');
    const [showAddVal1, setShowAddVal1] = useState(false);
    const [showAddVal2, setShowAddVal2] = useState(false);

    const handleApplyAll = () => {
        if (
            !applyPrice &&
            !applySalePrice &&
            !applyStock &&
            !applyWeight &&
            !applyLength &&
            !applyWidth &&
            !applyHeight
        )
            return;

        const updated = variations.map((v) => ({
            ...v,
            ...(applyPrice !== ''
                ? { price: parseFloat(applyPrice) || 0 }
                : {}),
            ...(applySalePrice !== ''
                ? {
                      sale_price: applySalePrice
                          ? parseFloat(applySalePrice)
                          : null,
                  }
                : {}),
            ...(applyStock !== ''
                ? { stock: parseInt(applyStock, 10) || 0 }
                : {}),
            ...(applyWeight !== ''
                ? { weight: applyWeight ? parseFloat(applyWeight) : null }
                : {}),
            ...(applyLength !== ''
                ? { length: applyLength ? parseFloat(applyLength) : null }
                : {}),
            ...(applyWidth !== ''
                ? { width: applyWidth ? parseFloat(applyWidth) : null }
                : {}),
            ...(applyHeight !== ''
                ? { height: applyHeight ? parseFloat(applyHeight) : null }
                : {}),
        }));
        onChangeVariations(updated);
    };

    const handleCellChange = (
        index: number,
        field:
            | 'price'
            | 'sale_price'
            | 'stock'
            | 'sku'
            | 'weight'
            | 'length'
            | 'width'
            | 'height',
        value: string,
    ) => {
        const updated = [...variations];
        if (field === 'price') {
            updated[index] = {
                ...updated[index],
                price: parseFloat(value) || 0,
            };
        } else if (field === 'sale_price') {
            updated[index] = {
                ...updated[index],
                sale_price: value === '' ? null : parseFloat(value) || 0,
            };
        } else if (field === 'stock') {
            updated[index] = {
                ...updated[index],
                stock: parseInt(value, 10) || 0,
            };
        } else if (field === 'sku') {
            updated[index] = {
                ...updated[index],
                sku: value,
            };
        } else {
            updated[index] = {
                ...updated[index],
                [field]: value === '' ? null : parseFloat(value) || null,
            };
        }
        onChangeVariations(updated);
    };

    const fieldError = (
        v: VariationItem,
        i: number,
        field: CellField,
    ): string | undefined =>
        clientError(v, field) ?? errors?.[`variations.${i}.${field}`];

    const renderCell = (
        v: VariationItem,
        i: number,
        c: CellSpec,
        mobile: boolean,
    ) => {
        const inputId = `${id}${mobile ? '-m' : ''}-${c.field}-${i}`;
        const error = fieldError(v, i, c.field);
        const errorId = error ? `${inputId}-error` : undefined;
        const inherited = isShippingField(c.field) ? defaults?.[c.field] : null;
        const placeholder =
            c.placeholder ??
            (inherited != null && inherited !== '' ? String(inherited) : '—');

        const input = (
            <input
                id={inputId}
                type={c.kind === 'text' ? 'text' : 'number'}
                inputMode={
                    c.kind === 'text'
                        ? undefined
                        : c.field === 'stock'
                          ? 'numeric'
                          : 'decimal'
                }
                min={c.kind === 'number' && c.step ? '0' : undefined}
                step={c.step}
                value={cellValue(v, c.field)}
                onChange={(e) => handleCellChange(i, c.field, e.target.value)}
                placeholder={
                    isShippingField(c.field) || c.field === 'sale_price'
                        ? placeholder
                        : undefined
                }
                aria-invalid={error ? true : undefined}
                aria-describedby={errorId}
                className={cn(
                    'field tabular',
                    c.kind === 'money' && 'pl-7',
                    error && 'border-danger',
                )}
            />
        );

        return (
            <div className="grid gap-1">
                <label className="sr-only" htmlFor={inputId}>
                    {c.label}, {v.option1_value} {v.option2_value}
                </label>
                {c.kind === 'money' ? (
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            ₱
                        </span>
                        {input}
                    </div>
                ) : (
                    input
                )}
                {error && (
                    <p
                        id={errorId}
                        className="text-caption font-bold text-danger-text"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
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
                        Regular price for all variations
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
                            placeholder="Regular price"
                            className="field tabular pl-7"
                        />
                    </div>
                </div>
                <div className="min-w-28 flex-1">
                    <label className="sr-only" htmlFor={`${id}-sale-price-all`}>
                        Sale price for all variations
                    </label>
                    <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
                            ₱
                        </span>
                        <input
                            id={`${id}-sale-price-all`}
                            inputMode="numeric"
                            type="number"
                            value={applySalePrice}
                            onChange={(e) => setApplySalePrice(e.target.value)}
                            placeholder="Sale price (opt)"
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
                <div className="min-w-24 flex-1">
                    <label className="sr-only" htmlFor={`${id}-weight-all`}>
                        Weight (kg) for all variations
                    </label>
                    <input
                        id={`${id}-weight-all`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="0.01"
                        value={applyWeight}
                        onChange={(e) => setApplyWeight(e.target.value)}
                        placeholder="Weight (kg)"
                        className="field tabular"
                    />
                </div>
                <div className="min-w-24 flex-1">
                    <label className="sr-only" htmlFor={`${id}-length-all`}>
                        Length (cm) for all variations
                    </label>
                    <input
                        id={`${id}-length-all`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="0.1"
                        value={applyLength}
                        onChange={(e) => setApplyLength(e.target.value)}
                        placeholder="Length (cm)"
                        className="field tabular"
                    />
                </div>
                <div className="min-w-24 flex-1">
                    <label className="sr-only" htmlFor={`${id}-width-all`}>
                        Width (cm) for all variations
                    </label>
                    <input
                        id={`${id}-width-all`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="0.1"
                        value={applyWidth}
                        onChange={(e) => setApplyWidth(e.target.value)}
                        placeholder="Width (cm)"
                        className="field tabular"
                    />
                </div>
                <div className="min-w-24 flex-1">
                    <label className="sr-only" htmlFor={`${id}-height-all`}>
                        Height (cm) for all variations
                    </label>
                    <input
                        id={`${id}-height-all`}
                        inputMode="numeric"
                        type="number"
                        min="0"
                        step="0.1"
                        value={applyHeight}
                        onChange={(e) => setApplyHeight(e.target.value)}
                        placeholder="Height (cm)"
                        className="field tabular"
                    />
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
                    {/* Desktop table (md+). Scrolls sideways instead of squeezing
                        columns, and keeps the option labels pinned on the left. */}
                    <div className="hidden overflow-x-auto rounded-panel border border-border md:block">
                        <table className="w-full min-w-[1200px] table-fixed text-body">
                            <caption className="sr-only">
                                Price, stock and shipping per variation
                            </caption>
                            <thead className="bg-surface-subtle">
                                <tr>
                                    <th
                                        scope="col"
                                        className="sticky left-0 z-10 w-32 min-w-32 bg-surface-subtle px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                    >
                                        {option1Name || 'Option 1'}
                                    </th>
                                    {option2Name && (
                                        <th
                                            scope="col"
                                            className="w-32 min-w-32 px-3 py-2 text-left text-th text-muted-foreground uppercase"
                                        >
                                            {option2Name}
                                        </th>
                                    )}
                                    {CELLS.map((c) => (
                                        <th
                                            key={c.field}
                                            scope="col"
                                            className={cn(
                                                'px-3 py-2 text-left text-th text-muted-foreground uppercase',
                                                c.thClass,
                                            )}
                                        >
                                            {c.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {variations.map((v, i) => (
                                    <tr key={i} className="align-top">
                                        <th
                                            scope="row"
                                            className="sticky left-0 z-10 bg-surface px-3 py-2 text-left text-label break-words"
                                        >
                                            {v.option1_value}
                                        </th>
                                        {option2Name && (
                                            <td className="px-3 py-2 break-words">
                                                {v.option2_value ?? '—'}
                                            </td>
                                        )}
                                        {CELLS.map((c) => (
                                            <td
                                                key={c.field}
                                                className="px-3 py-2"
                                            >
                                                {renderCell(v, i, c, false)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards (<md) */}
                    <ul
                        className="grid gap-2 md:hidden"
                        aria-label="Price, stock and shipping per variation"
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
                                    {CELLS.map((c) => (
                                        <div
                                            key={c.field}
                                            className="grid content-start gap-1"
                                        >
                                            <span
                                                className="text-body-sm text-muted-foreground"
                                                aria-hidden="true"
                                            >
                                                {c.mobileLabel}
                                            </span>
                                            {renderCell(v, i, c, true)}
                                        </div>
                                    ))}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
