import { ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type AddressData = {
    id: string;
    name: string;
    phone: string;
    street: string;
    postal_code: string;
    landmark?: string | null;
    label?: string;
    is_default?: boolean;
    formatted?: string;
    region_code?: string;
    province_code?: string;
    city_code?: string;
    barangay_code?: string;
};

type AddressCardProps = {
    address: AddressData;
    select?: boolean;
    selected?: boolean;
    onChange?: () => void;
    onSelect?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onSetDefault?: () => void;
    className?: string;
};

export function AddressCard({
    address,
    select = false,
    selected = false,
    onChange,
    onSelect,
    onEdit,
    onDelete,
    onSetDefault,
    className,
}: AddressCardProps) {
    const fullAddress =
        address.formatted ?? `${address.street}, ${address.postal_code}`;
    const labelTitle =
        address.label === 'work'
            ? 'Work'
            : address.label === 'other'
              ? 'Other'
              : 'Home';

    if (select) {
        return (
            <label
                className={cn(
                    'flex min-h-touch-primary cursor-pointer items-start gap-3 rounded-card border bg-surface p-4 select-none',
                    selected
                        ? 'border-primary bg-primary-soft'
                        : 'border-border hover:bg-surface-subtle',
                    'focus-ring',
                    className,
                )}
            >
                <input
                    type="radio"
                    name="address-picker"
                    checked={selected}
                    onChange={onSelect}
                    className="mt-1 size-5 shrink-0 accent-primary"
                />
                <div className="grid min-w-0 flex-1 grid-cols-1 gap-1">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-label">{address.name}</span>
                        <span className="tabular text-body-sm text-muted-foreground">
                            {address.phone}
                        </span>
                    </p>
                    <p className="text-body text-muted-foreground">
                        {fullAddress}
                    </p>
                    {address.landmark && (
                        <p className="text-body-sm text-subtle-foreground italic">
                            Landmark: {address.landmark}
                        </p>
                    )}
                    <p className="mt-1 flex flex-wrap gap-1.5">
                        {address.is_default && <Badge>Default</Badge>}
                        <Badge variant="neutral">{labelTitle}</Badge>
                    </p>
                </div>
                {onEdit && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="self-start text-body-sm text-primary-text hover:underline"
                    >
                        Edit
                    </button>
                )}
            </label>
        );
    }

    return (
        <div
            className={cn(
                'flex gap-3 bg-surface p-gutter md:rounded-panel md:border md:border-border md:p-4',
                className,
            )}
        >
            <MapPin
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            />
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-label">{address.name}</span>
                    <span className="tabular text-body-sm text-muted-foreground">
                        {address.phone}
                    </span>
                </p>
                <p className="text-body text-muted-foreground">{fullAddress}</p>
                {address.landmark && (
                    <p className="text-body-sm text-subtle-foreground italic">
                        Landmark: {address.landmark}
                    </p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                    {address.is_default && <Badge>Default</Badge>}
                    <Badge variant="neutral">{labelTitle}</Badge>

                    {/* Additional action links for address book view */}
                    {!address.is_default && onSetDefault && (
                        <button
                            type="button"
                            onClick={onSetDefault}
                            className="ml-2 text-body-sm text-muted-foreground hover:text-foreground hover:underline"
                        >
                            Set as default
                        </button>
                    )}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="ml-2 text-body-sm text-primary-text hover:underline"
                        >
                            Edit
                        </button>
                    )}
                    {onDelete && !address.is_default && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="ml-2 text-body-sm text-danger-text hover:underline"
                        >
                            Delete
                        </button>
                    )}
                </p>
            </div>
            {onChange && (
                <button
                    type="button"
                    onClick={onChange}
                    className="inline-flex min-h-touch items-center self-center text-label text-primary-text hover:underline"
                >
                    Change
                    <ChevronRight aria-hidden="true" className="size-4" />
                </button>
            )}
        </div>
    );
}
