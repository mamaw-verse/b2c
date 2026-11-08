import { CircleAlert, Clock, Store, Tag, Truck } from 'lucide-react';
import { useId, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

export type VoucherItem = {
    id: string;
    shop_id?: string | null;
    code: string;
    kind: 'shop' | 'platform' | 'shipping';
    discount_type: 'fixed' | 'percent';
    discount_value: number;
    max_discount?: number | null;
    min_spend: number;
    expires_at?: string | null;
    disabledReason?: string | null;
};

type VoucherPickerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    vouchers: VoucherItem[];
    selected: Record<string, string | null>;
    onSelect: (kind: string, voucherId: string | null) => void;
    onApplyCode?: (code: string) => Promise<void> | void;
    totalSavings?: number;
};

const KIND_META = {
    shop: {
        title: 'Shop vouchers',
        tag: 'Shop',
        icon: Store,
        bg: 'bg-primary text-primary-foreground',
    },
    platform: {
        title: 'Platform vouchers',
        tag: 'Platform',
        icon: Tag,
        bg: 'bg-promo-solid-bg text-primary-foreground',
    },
    shipping: {
        title: 'Free shipping',
        tag: 'Shipping',
        icon: Truck,
        bg: 'bg-success text-primary-foreground',
    },
} as const;

export function VoucherPicker({
    open,
    onOpenChange,
    vouchers,
    selected,
    onSelect,
    onApplyCode,
    totalSavings = 0,
}: VoucherPickerProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [codeError, setCodeError] = useState<string | null>(null);
    const inputId = useId();

    const handleApply = async () => {
        if (!code.trim()) return;
        setCodeError(null);
        setLoading(true);
        try {
            await onApplyCode?.(code.trim());
            setCode('');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setCodeError(err.message);
            } else {
                setCodeError('Could not apply voucher.');
            }
        } finally {
            setLoading(false);
        }
    };

    const grouped = {
        shop: vouchers.filter((v) => v.kind === 'shop'),
        platform: vouchers.filter((v) => v.kind === 'platform'),
        shipping: vouchers.filter((v) => v.kind === 'shipping'),
    };

    const footer = (
        <div className="flex w-full items-center justify-between gap-4">
            <p
                className="text-body-sm text-muted-foreground"
                aria-live="polite"
            >
                Saving{' '}
                <span className="font-bold text-promo">
                    {totalSavings > 0 ? formatPeso(totalSavings) : '₱0'}
                </span>
            </p>
            <button
                type="button"
                className="btn sm:min-w-32"
                onClick={() => onOpenChange(false)}
            >
                Done
            </button>
        </div>
    );

    return (
        <Modal
            open={open}
            onOpenChange={onOpenChange}
            title="Select vouchers"
            kind="responsive"
            footer={footer}
        >
            <div className="grid gap-4">
                {/* Code input */}
                <div>
                    <div className="flex gap-2">
                        <label htmlFor={inputId} className="sr-only">
                            Voucher code
                        </label>
                        <input
                            id={inputId}
                            className="field uppercase"
                            placeholder="Enter voucher code"
                            autoComplete="off"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    void handleApply();
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-outline"
                            disabled={loading || !code.trim()}
                            aria-busy={loading}
                            onClick={handleApply}
                        >
                            <span>{loading ? 'Applying...' : 'Apply'}</span>
                        </button>
                    </div>
                    {codeError && (
                        <p className="mt-1 flex items-center gap-1 text-body-sm font-medium text-danger-text">
                            <CircleAlert className="size-3.5 shrink-0" />
                            {codeError}
                        </p>
                    )}
                </div>

                {/* Vouchers lists */}
                {(['shop', 'platform', 'shipping'] as const).map((kind) => {
                    const list = grouped[kind];
                    if (list.length === 0) return null;
                    const meta = KIND_META[kind];
                    const Icon = meta.icon;

                    return (
                        <fieldset key={kind} className="grid gap-2">
                            <legend className="mb-1 text-label">
                                {meta.title}
                            </legend>
                            {list.map((v) => {
                                const isChecked = selected[kind] === v.id;
                                const isDisabled = Boolean(v.disabledReason);
                                const vLabel =
                                    v.discount_type === 'percent'
                                        ? `${v.discount_value}% off${v.max_discount ? `, up to ${formatPeso(v.max_discount)}` : ''}`
                                        : `${formatPeso(v.discount_value)} off`;
                                const minSpendLabel =
                                    v.min_spend > 0
                                        ? `Min. spend ${formatPeso(v.min_spend)}`
                                        : 'No min. spend';

                                return (
                                    <label
                                        key={v.id}
                                        htmlFor={`voucher-${v.id}`}
                                        className={cn(
                                            'flex cursor-pointer overflow-hidden rounded-card border bg-surface select-none',
                                            isDisabled
                                                ? 'cursor-not-allowed border-border opacity-75'
                                                : 'border-border-outline',
                                            'has-[:checked]:border-primary has-[:checked]:bg-primary-soft',
                                            'focus-ring',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'flex w-20 shrink-0 flex-col items-center justify-center gap-1 p-2 text-center text-caption font-bold',
                                                isDisabled
                                                    ? 'bg-surface-muted text-muted-foreground'
                                                    : meta.bg,
                                            )}
                                        >
                                            <Icon
                                                aria-hidden="true"
                                                className="size-4"
                                            />
                                            <span className="line-clamp-2 break-words">
                                                {meta.tag}
                                            </span>
                                        </div>

                                        <div className="relative grid min-w-0 flex-1 content-center gap-0.5 border-l-2 border-dashed border-border py-2 pr-2 pl-3">
                                            <p className="text-label">
                                                {vLabel}
                                            </p>
                                            <p className="text-body-sm text-muted-foreground">
                                                {minSpendLabel}
                                            </p>
                                            <p
                                                className={cn(
                                                    'flex items-center gap-1 text-caption',
                                                    isDisabled
                                                        ? 'text-danger-text'
                                                        : 'text-muted-foreground',
                                                )}
                                            >
                                                {isDisabled ? (
                                                    <CircleAlert
                                                        aria-hidden="true"
                                                        className="size-3.5 shrink-0"
                                                    />
                                                ) : (
                                                    <Clock
                                                        aria-hidden="true"
                                                        className="size-3.5 shrink-0"
                                                    />
                                                )}
                                                {isDisabled
                                                    ? v.disabledReason
                                                    : v.expires_at
                                                      ? `Valid till ${v.expires_at}`
                                                      : 'No expiry'}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center pr-3">
                                            <input
                                                type="radio"
                                                name={`voucher-group-${kind}`}
                                                id={`voucher-${v.id}`}
                                                className="size-5 accent-primary"
                                                checked={isChecked}
                                                disabled={isDisabled}
                                                onChange={() => {
                                                    if (isChecked) {
                                                        onSelect(kind, null);
                                                    } else {
                                                        onSelect(kind, v.id);
                                                    }
                                                }}
                                            />
                                        </div>
                                    </label>
                                );
                            })}
                        </fieldset>
                    );
                })}
            </div>
        </Modal>
    );
}
