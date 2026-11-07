import { useId, useMemo, useState } from 'react';
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
import type { ProductDetail } from '@/types/catalogue';

type VariationPickerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductDetail;
    onConfirm?: (selection: {
        option1: string;
        option2: string | null;
        quantity: number;
        buyNow: boolean;
    }) => void;
};

/** Bottom-sheet variation picker: option chips + quantity + add/buy actions. */
export function VariationPicker({
    open,
    onOpenChange,
    product,
    onConfirm,
}: VariationPickerProps) {
    const baseId = useId();
    const option1Values = useMemo(
        () => [...new Set(product.variations.map((v) => v.option1_value))],
        [product.variations],
    );
    const [option1, setOption1] = useState(option1Values[0] ?? '');
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
    const [option2, setOption2] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);

    const selected =
        product.variations.find(
            (v) =>
                v.option1_value === option1 &&
                (option2Values.length === 0 ||
                    v.option2_value === (option2 ?? option2Values[0])),
        ) ?? null;
    const activeOption2 = option2 ?? option2Values[0] ?? null;
    const price = selected?.price ?? product.price;
    const stock = selected?.stock ?? product.stock;

    const chipCls =
        'relative flex min-h-touch cursor-pointer items-center gap-2 rounded-button border border-border-control bg-surface px-3 text-body hover:border-primary has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-soft-foreground has-disabled:cursor-not-allowed has-disabled:border-dashed has-disabled:text-muted-foreground has-disabled:hover:border-border-control has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring';

    const hasOptions = product.option1_name != null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent kind="sheet">
                <DialogTitle>Select variation</DialogTitle>
                <DialogDescription className="sr-only">
                    Choose options and quantity for {product.name}
                </DialogDescription>
                <div className="grid gap-5 p-4">
                    <div className="flex gap-3">
                        <div className="w-20 shrink-0 overflow-hidden rounded-tile">
                            <Media
                                label={product.name}
                                icon={product.icon}
                                decorative
                            />
                        </div>
                        <div className="grid content-end gap-1">
                            <PriceBlock
                                price={price}
                                was={product.was_price}
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
                                {product.option1_name}:{' '}
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
                                                    setOption2(null);
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
                    {product.option2_name && option2Values.length > 0 && (
                        <fieldset>
                            <legend className="mb-2 text-label">
                                {product.option2_name}
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
                    <div className="flex items-center justify-between">
                        <p className="text-label" id={`${baseId}-qty-l`}>
                            Quantity
                        </p>
                        <QuantityStepper
                            value={quantity}
                            max={Math.max(stock, 1)}
                            onChange={setQuantity}
                        />
                    </div>
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
                                })
                            }
                        >
                            Buy now
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
