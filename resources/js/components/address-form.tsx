import { CircleAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Combobox } from '@/components/combobox';
import { PhoneInput } from '@/components/phone-input';
import { cn } from '@/lib/utils';
import type { Auth } from '@/types';

export type AddressFormData = {
    name: string;
    phone: string;
    region_code: string;
    province_code: string;
    city_code: string;
    barangay_code: string;
    street: string;
    postal_code: string;
    landmark?: string;
    label: 'home' | 'work' | 'other';
    is_default: boolean;
};

type AddressFormProps = {
    id?: string;
    initialValues?: Partial<AddressFormData>;
    errors?: Record<string, string>;
    onSubmit: (data: AddressFormData) => void;
    onCancel?: () => void;
    loading?: boolean;
    className?: string;
    /** When true, hides the inline Cancel/Save buttons (use when footer is rendered outside). */
    hideActions?: boolean;
};

type PsgcItem = {
    code: string;
    name: string;
    postal_code?: string;
};

export function AddressForm({
    id: formId = 'address-form',
    initialValues,
    errors = {},
    onSubmit,
    onCancel,
    loading = false,
    className,
    hideActions = false,
}: AddressFormProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const [name, setName] = useState(initialValues?.name ?? auth.user?.name ?? '');
    const [phone, setPhone] = useState(initialValues?.phone ?? '');
    const [regionCode, setRegionCode] = useState(
        initialValues?.region_code ?? '',
    );
    const [provinceCode, setProvinceCode] = useState(
        initialValues?.province_code ?? '',
    );
    const [cityCode, setCityCode] = useState(initialValues?.city_code ?? '');
    const [barangayCode, setBarangayCode] = useState(
        initialValues?.barangay_code ?? '',
    );
    const [street, setStreet] = useState(initialValues?.street ?? '');
    const [postalCode, setPostalCode] = useState(
        initialValues?.postal_code ?? '',
    );
    const [landmark, setLandmark] = useState(initialValues?.landmark ?? '');
    const [label, setLabel] = useState<'home' | 'work' | 'other'>(
        initialValues?.label ?? 'home',
    );
    const [isDefault, setIsDefault] = useState(
        initialValues?.is_default ?? false,
    );

    // Cascading PSGC lists
    const [regions, setRegions] = useState<PsgcItem[]>([]);
    const [provinces, setProvinces] = useState<PsgcItem[]>([]);
    const [cities, setCities] = useState<PsgcItem[]>([]);
    const [barangays, setBarangays] = useState<PsgcItem[]>([]);

    // Fetch regions
    useEffect(() => {
        fetch('/api/psgc/regions')
            .then((res) => (res.ok ? res.json() : []))
            .then((data: PsgcItem[]) => setRegions(data))
            .catch(() => setRegions([]));
    }, []);

    // Fetch provinces when region changes
    useEffect(() => {
        if (!regionCode) {
            setProvinces([]);
            return;
        }
        fetch(`/api/psgc/regions/${regionCode}/provinces`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data: PsgcItem[]) => setProvinces(data))
            .catch(() => setProvinces([]));
    }, [regionCode]);

    // Fetch cities when province changes
    useEffect(() => {
        if (!provinceCode) {
            setCities([]);
            return;
        }
        fetch(`/api/psgc/provinces/${provinceCode}/cities`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data: PsgcItem[]) => setCities(data))
            .catch(() => setCities([]));
    }, [provinceCode]);

    // Fetch barangays when city changes
    useEffect(() => {
        if (!cityCode) {
            setBarangays([]);
            return;
        }
        fetch(`/api/psgc/cities/${cityCode}/barangays`)
            .then((res) => (res.ok ? res.json() : []))
            .then((data: PsgcItem[]) => setBarangays(data))
            .catch(() => setBarangays([]));
    }, [cityCode]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            phone,
            region_code: regionCode,
            province_code: provinceCode,
            city_code: cityCode,
            barangay_code: barangayCode,
            street,
            postal_code: postalCode,
            landmark: landmark || undefined,
            label,
            is_default: isDefault,
        });
    };

    return (
        <form
            id={formId}
            onSubmit={handleSubmit}
            className={cn('grid items-start gap-4 md:grid-cols-2', className)}
            noValidate
        >
            {/* Recipient Name */}
            <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <label
                        htmlFor="af-name"
                        className="text-label text-foreground"
                    >
                        Recipient name
                        <span className="text-danger-text" aria-hidden="true">
                            {' '}
                            *
                        </span>
                    </label>
                </div>
                <input
                    id="af-name"
                    type="text"
                    className={cn('field py-2.5', errors.name && 'border-danger')}
                    value={name}
                    required
                    autoComplete="name"
                    onChange={(e) => setName(e.target.value)}
                />
                {errors.name && (
                    <p className="flex items-start gap-1 text-body-sm font-bold text-danger-text">
                        <CircleAlert className="mt-px size-4 shrink-0" />
                        <span>{errors.name}</span>
                    </p>
                )}
            </div>

            {/* Mobile Number */}
            <PhoneInput
                id="af-phone"
                label="Mobile number"
                required
                value={phone}
                onChange={setPhone}
                error={errors.phone}
            />

            {/* Region Combobox */}
            <Combobox
                id="af-region"
                label="Region"
                required
                options={regions.map((r) => ({ value: r.code, label: r.name }))}
                value={regionCode}
                placeholder="Select region"
                onChange={(code) => {
                    setRegionCode(code);
                    setProvinceCode('');
                    setCityCode('');
                    setBarangayCode('');
                }}
                error={errors.region_code}
            />

            {/* Province Combobox */}
            <Combobox
                id="af-province"
                label="Province"
                required
                options={provinces.map((p) => ({ value: p.code, label: p.name }))}
                value={provinceCode}
                disabled={!regionCode}
                placeholder={!regionCode ? 'Select region first' : 'Select province'}
                onChange={(code) => {
                    setProvinceCode(code);
                    setCityCode('');
                    setBarangayCode('');
                }}
                error={errors.province_code}
            />

            {/* City Combobox */}
            <Combobox
                id="af-city"
                label="City / Municipality"
                required
                options={cities.map((c) => ({ value: c.code, label: c.name }))}
                value={cityCode}
                disabled={!provinceCode}
                placeholder={
                    !provinceCode
                        ? 'Select province first'
                        : 'Search city/municipality'
                }
                onChange={(code) => {
                    setCityCode(code);
                    setBarangayCode('');
                    const selectedCity = cities.find((c) => c.code === code);
                    if (selectedCity?.postal_code) {
                        setPostalCode(selectedCity.postal_code);
                    }
                }}
                error={errors.city_code}
            />

            {/* Barangay Combobox */}
            <Combobox
                id="af-barangay"
                label="Barangay"
                required
                options={barangays.map((b) => ({
                    value: b.code,
                    label: b.name,
                }))}
                value={barangayCode}
                disabled={!cityCode}
                placeholder={
                    !cityCode ? 'Select city first' : 'Search barangay'
                }
                onChange={setBarangayCode}
                error={errors.barangay_code}
            />

            {/* Street / Building (spans 2 cols) */}
            <div className="grid gap-1.5 md:col-span-2">
                <div className="flex items-baseline justify-between gap-2">
                    <label
                        htmlFor="af-street"
                        className="text-label text-foreground"
                    >
                        Street address / Unit / Building
                        <span className="text-danger-text" aria-hidden="true">
                            {' '}
                            *
                        </span>
                    </label>
                </div>
                <input
                    id="af-street"
                    type="text"
                    className={cn('field', errors.street && 'border-danger')}
                    value={street}
                    placeholder="e.g. Unit 4B, 12 Bagong Silang St."
                    required
                    onChange={(e) => setStreet(e.target.value)}
                />
                {errors.street && (
                    <p className="flex items-start gap-1 text-body-sm font-bold text-danger-text">
                        <CircleAlert className="mt-px size-4 shrink-0" />
                        <span>{errors.street}</span>
                    </p>
                )}
            </div>

            {/* Postal Code */}
            <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <label
                        htmlFor="af-postal"
                        className="text-label text-foreground"
                    >
                        Postal code
                        <span className="text-danger-text" aria-hidden="true">
                            {' '}
                            *
                        </span>
                    </label>
                </div>
                <input
                    id="af-postal"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    className={cn(
                        'field',
                        errors.postal_code && 'border-danger',
                    )}
                    value={postalCode}
                    placeholder="4-digit postal code"
                    required
                    onChange={(e) =>
                        setPostalCode(
                            e.target.value.replace(/\D/g, '').slice(0, 4),
                        )
                    }
                />
                {errors.postal_code && (
                    <p className="flex items-start gap-1 text-body-sm font-bold text-danger-text">
                        <CircleAlert className="mt-px size-4 shrink-0" />
                        <span>{errors.postal_code}</span>
                    </p>
                )}
            </div>

            {/* Landmark (optional) */}
            <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <label
                        htmlFor="af-landmark"
                        className="text-label text-foreground"
                    >
                        Landmark{' '}
                        <span className="text-body-sm font-normal text-muted-foreground">
                            (Optional)
                        </span>
                    </label>
                </div>
                <input
                    id="af-landmark"
                    type="text"
                    className="field"
                    value={landmark}
                    placeholder="e.g. Near Mosque, beside water station"
                    onChange={(e) => setLandmark(e.target.value)}
                />
            </div>

            {/* Label chips & Default checkbox */}
            <div className="grid gap-3 md:col-span-2">
                <div>
                    <span className="mb-2 block text-label text-foreground">
                        Label as
                    </span>
                    <div className="flex gap-2">
                        {(['home', 'work', 'other'] as const).map((lbl) => (
                            <label
                                key={lbl}
                                className={cn(
                                    'btn cursor-pointer select-none',
                                    label === lbl
                                        ? 'btn-primary'
                                        : 'btn-outline',
                                )}
                            >
                                <input
                                    type="radio"
                                    name="address-label"
                                    className="sr-only"
                                    checked={label === lbl}
                                    onChange={() => setLabel(lbl)}
                                />
                                {lbl === 'home'
                                    ? 'Home'
                                    : lbl === 'work'
                                      ? 'Work'
                                      : 'Other'}
                            </label>
                        ))}
                    </div>
                </div>

                <label className="mt-1 flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={(e) => setIsDefault(e.target.checked)}
                        className="size-5 accent-primary"
                    />
                    <span className="text-body">
                        Set as default delivery address
                    </span>
                </label>
            </div>

            {/* Actions — hidden when footer is rendered outside (e.g. inside Modal) */}
            {!hideActions && (
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end md:col-span-2">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-outline min-h-touch-primary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        aria-busy={loading}
                        className="btn btn-primary min-h-touch-primary"
                    >
                        {loading ? 'Saving...' : 'Save address'}
                    </button>
                </div>
            )}
        </form>
    );
}
