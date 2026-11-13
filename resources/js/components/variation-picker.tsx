import { useEffect, useId, useMemo, useState } from 'react';
import { Media } from '@/components/media';
import { PriceBlock } from '@/components/price-block';
import { QuantityStepper } from '@/components/quantity-stepper';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import type { ProductDetail, ProductVariation } from '@/types/catalogue';

export type VariationProduct = {
    name: string;
    price: number;
    was_price?: number | null;
    stock: number;
    icon?: string;
    image_url?: string | null;
    option1_name?: string | null;
    option2_name?: string | null;
    variations: ProductVariation[];
};

type VariationPickerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductDetail | VariationProduct;
    mode?: 'select' | 'edit';
    initial?: {
        option1?: string;
        option2?: string | null;
    };
    confirmLabel?: string;
    onConfirm?: (selection: {
        option1: string;
        option2: string | null;
        quantity: number;
        buyNow: boolean;
        variation?: ProductVariation | null;
    }) => void;
};

/** Bottom-sheet variation picker: option chips + quantity + add/buy actions. */
export function VariationPicker({
    open,
    onOpenChange,
    product,
    mode = 'select',
    initial,
    confirmLabel,
    onConfirm,
}: VariationPickerProps) {
    const baseId = useId();
    const option1Values = useMemo(
        () => [...new Set(product.variations.map((v) => v.option1_value))],
        [product.variations],
    );
    const firstInStock = useMemo(
        () => product.variations.find((v) => v.stock > 0),
        [product.variations],
    );
    const [option1, setOption1] = useState(
        initial?.option1 ??
            firstInStock?.option1_value ??
            option1Values[0] ??
            '',
    );
    const option2Values = useMemo(
        () => [
            ...new Set(
                product.variations
                    .filter((v) => v.option1_value === option1)
                    .map((v) => v.option2_value)
                    .filter((v): v is string => v != null),
            ),
        ],
        [product.variations, option1],
    );
    const [option2, setOption2] = useState<string | null>(
        initial?.option2 !== undefined
            ? initial.option2
            : (firstInStock?.option2_value ?? null),
    );
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (open) {
            setOption1(
                initial?.option1 ??
                    firstInStock?.option1_value ??
                    option1Values[0] ??
                    '',
            );
            setOption2(
                initial?.option2 !== undefined
                    ? initial.option2
                    : (firstInStock?.option2_value ?? null),
            );
            setQuantity(1);
        }
    }, [open, initial?.option1, initial?.option2, firstInStock, option1Values]);

    const activeOption2 =
        option2 && option2Values.includes(option2)
            ? option2
            : (option2Values[0] ?? null);

    const selected =
        product.variations.find(
            (v) =>
                v.option1_value === option1 &&
                (option2Values.length === 0 ||
                    v.option2_value === activeOption2),
        ) ?? null;
    const price = selected?.price ?? product.price;
    const stock = selected?.stock ?? product.stock;

    const chipCls =
        'relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-soft-foreground has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:text-muted-foreground has-disabled:hover:border-border-control focus-ring';

    const hasOptions = product.variations.length > 0;
    const option1Name = product.option1_name || 'Option';
    const option2Name =
        product.option2_name || (option2Values.length > 0 ? 'Option 2' : null);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent kind="sheet">
                <div className="flex items-center border-b border-border px-4 py-3">
                    <DialogTitle className="text-h4">
                        {mode === 'edit'
                            ? 'Change variation'
                            : 'Select variation'}
                    </DialogTitle>
                </div>
                <DialogDescription className="sr-only">
                    Choose options and quantity for {product.name}
                </DialogDescription>
                <div className="grid gap-5 overflow-y-auto p-4">
                    <div className="flex gap-3">
                        <div className="w-20 shrink-0 overflow-hidden rounded-tile">
                            <Media
                                label={product.name}
                                icon={product.icon}
                                src={product.image_url}
                                decorative
                            />
                        </div>
                        <div className="grid content-center gap-1">
                            <PriceBlock
                                price={price}
                                was={selected?.was_price ?? product.was_price}
                                size="lg"
                            />
                            <p className="text-body-sm text-muted-foreground">
                                Stock: <span className="tabular">{stock}</span>
                            </p>
                        </div>
                    </div>
                    {hasOptions && (
                        <fieldset>
                            <legend className="mb-2 text-label">
                                {option1Name}:{' '}
                                <span className="font-normal text-muted-foreground">
                                    {option1}
                                </span>
                            </legend>
                            <div className="flex flex-wrap gap-2">
                                {option1Values.map((value) => {
                                    const available = product.variations.some(
                                        (v) =>
                                            v.option1_value === value &&
                                            v.stock > 0,
                                    );
                                    return (
                                        <label key={value} className={chipCls}>
                                            <input
                                                type="radio"
                                                name={`${baseId}-o1`}
                                                className="sr-only"
                                                checked={option1 === value}
                                                disabled={!available}
                                                onChange={() => {
                                                    setOption1(value);
                                                    const inStockOpt2 =
                                                        product.variations.find(
                                                            (v) =>
                                                                v.option1_value ===
                                                                    value &&
                                                                v.stock > 0,
                                                        )?.option2_value;
                                                    const fallbackOpt2 =
                                                        product.variations
                                                            .filter(
                                                                (v) =>
                                                                    v.option1_value ===
                                                                    value,
                                                            )
                                                            .map(
                                                                (v) =>
                                                                    v.option2_value,
                                                            )
                                                            .find(
                                                                (
                                                                    v,
                                                                ): v is string =>
                                                                    v != null,
                                                            );
                                                    setOption2(
                                                        inStockOpt2 ??
                                                            fallbackOpt2 ??
                                                            null,
                                                    );
                                                }}
                                            />
                                            {value}
                                            {!available && (
                                                <span className="text-caption">
                                                    (sold out)
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                    )}
                    {option2Name && option2Values.length > 0 && (
                        <fieldset>
                            <legend className="mb-2 text-label">
                                {option2Name}
                            </legend>
                            <div className="flex flex-wrap gap-2">
                                {option2Values.map((value) => {
                                    const variation = product.variations.find(
                                        (v) =>
                                            v.option1_value === option1 &&
                                            v.option2_value === value,
                                    );
                                    const available =
                                        (variation?.stock ?? 0) > 0;
                                    return (
                                        <label key={value} className={chipCls}>
                                            <input
                                                type="radio"
                                                name={`${baseId}-o2`}
                                                className="sr-only"
                                                checked={
                                                    activeOption2 === value
                                                }
                                                disabled={!available}
                                                onChange={() =>
                                                    setOption2(value)
                                                }
                                            />
                                            {value}
                                            {!available && (
                                                <span className="text-caption">
                                                    (sold out)
                                                </span>
                                            )}
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>
                    )}
                    {mode !== 'edit' && (
                        <div className="flex items-center justify-between gap-4">
                            <p className="text-label" id={`${baseId}-qty-l`}>
                                Quantity
                            </p>
                            <QuantityStepper
                                value={quantity}
                                max={Math.max(stock, 1)}
                                onChange={setQuantity}
                            />
                        </div>
                    )}
                    {mode === 'edit' ? (
                        <Button
                            size="lg"
                            className="w-full"
                            disabled={stock === 0 || !selected}
                            onClick={() =>
                                onConfirm?.({
                                    option1,
                                    option2: activeOption2,
                                    quantity,
                                    buyNow: false,
                                    variation: selected,
                                })
                            }
                        >
                            {confirmLabel ?? 'Update'}
                        </Button>
                    ) : (
                        <div className="flex flex-row gap-2">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="flex-1"
                                disabled={stock === 0}
                                onClick={() =>
                                    onConfirm?.({
                                        option1,
                                        option2: activeOption2,
                                        quantity,
                                        buyNow: false,
                                        variation: selected,
                                    })
                                }
                            >
                                Add to cart
                            </Button>
                            <Button
                                size="lg"
                                className="flex-1"
                                disabled={stock === 0}
                                onClick={() =>
                                    onConfirm?.({
                                        option1,
                                        option2: activeOption2,
                                        quantity,
                                        buyNow: true,
                                        variation: selected,
                                    })
                                }
                            >
                                Buy now
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
