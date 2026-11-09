import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export type Voucher = {
    id: string;
    code: string;
    kind: 'shop' | 'platform' | 'shipping';
    discount_type: 'fixed' | 'percent';
    discount_value: number;
    max_discount: number | null;
    min_spend: number;
    max_uses: number | null;
    used_count: number;
    starts_at: string | null;
    expires_at: string | null;
    is_active: boolean;
    shop: string | null;
};

const pesos = (centavos: number | null) =>
    centavos === null ? '' : centavos / 100;

export function voucherSummary(voucher: Voucher): string {
    const value =
        voucher.discount_type === 'percent'
            ? `${voucher.discount_value}% off`
            : `₱${(voucher.discount_value / 100).toLocaleString()} off`;

    const parts = [voucher.kind, value];
    if (voucher.min_spend > 0) {
        parts.push(`min. spend ₱${(voucher.min_spend / 100).toLocaleString()}`);
    }
    if (voucher.max_uses !== null) {
        parts.push(`${voucher.used_count}/${voucher.max_uses} used`);
    } else {
        parts.push(`${voucher.used_count} used`);
    }
    if (voucher.expires_at) {
        parts.push(`until ${voucher.expires_at}`);
    } else {
        parts.push('no expiry');
    }

    return parts.join(' · ');
}

export function VoucherFields({
    voucher,
    errors,
    includeKind = false,
    fieldPrefix = '',
}: {
    voucher?: Voucher;
    errors: Record<string, string>;
    includeKind?: boolean;
    fieldPrefix?: string;
}) {
    const id = (name: string) => `${fieldPrefix}${name}`;

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Code" required error={errors.code}>
                <Input name="code" defaultValue={voucher?.code ?? ''} />
            </FormField>
            {includeKind && (
                <FormField label="Kind" required error={errors.kind}>
                    <Select
                        name="kind"
                        defaultValue={voucher?.kind ?? 'platform'}
                        options={[
                            { value: 'platform', label: 'Platform' },
                            { value: 'shipping', label: 'Free shipping' },
                        ]}
                    />
                </FormField>
            )}
            <FormField
                label="Discount type"
                required
                error={errors.discount_type}
            >
                <Select
                    name="discount_type"
                    defaultValue={voucher?.discount_type ?? 'fixed'}
                    options={[
                        { value: 'fixed', label: 'Fixed amount (₱)' },
                        { value: 'percent', label: 'Percent (%)' },
                    ]}
                />
            </FormField>
            <FormField
                label="Discount value"
                required
                help="Pesos for fixed, 1–100 for percent."
                error={errors.discount_value}
            >
                <Input
                    name="discount_value"
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={
                        voucher === undefined
                            ? ''
                            : voucher.discount_type === 'percent'
                              ? voucher.discount_value
                              : pesos(voucher.discount_value)
                    }
                />
            </FormField>
            <FormField
                label="Max discount (₱)"
                optional
                help="Required for percent vouchers."
                error={errors.max_discount}
            >
                <Input
                    name="max_discount"
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={pesos(voucher?.max_discount ?? null)}
                />
            </FormField>
            <FormField label="Min. spend (₱)" optional error={errors.min_spend}>
                <Input
                    name="min_spend"
                    type="number"
                    min={0}
                    step={0.01}
                    defaultValue={pesos(voucher?.min_spend ?? null)}
                />
            </FormField>
            <FormField label="Max uses" optional error={errors.max_uses}>
                <Input
                    name="max_uses"
                    type="number"
                    min={1}
                    defaultValue={voucher?.max_uses ?? ''}
                />
            </FormField>
            <FormField
                label="Starts"
                optional
                error={errors.starts_at}
                help="Active from the start of this day."
            >
                <Input
                    name="starts_at"
                    type="date"
                    defaultValue={voucher?.starts_at ?? ''}
                />
            </FormField>
            <FormField
                label="Expires"
                optional
                error={errors.expires_at}
                help="Valid until the end of this day."
            >
                <Input
                    name="expires_at"
                    type="date"
                    defaultValue={voucher?.expires_at ?? ''}
                />
            </FormField>
            <div className="flex items-center gap-2 sm:col-span-2">
                <input
                    id={id('is_active')}
                    type="checkbox"
                    name="is_active"
                    defaultChecked={voucher?.is_active ?? true}
                    className="size-4"
                />
                <label htmlFor={id('is_active')} className="text-body-sm">
                    Active
                </label>
            </div>
        </div>
    );
}
