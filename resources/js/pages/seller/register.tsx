import { Form, Head, Link } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Circle, Plus, Store } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Combobox } from '@/components/combobox';
import { FileField } from '@/components/file-field';
import { Banner } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import SellerTermsController from '@/actions/App/Http/Controllers/Seller/SellerTermsController';
import { store as storeRegistration } from '@/routes/seller/register';

type ExistingCertificate = {
    id: string;
    certifying_body: string;
    certificate_number: string;
    valid_until: string;
    document_url: string | null;
};

type ExistingApplication = {
    status: 'pending' | 'rejected' | 'changes_requested';
    shop_name: string;
    description: string | null;
    address_line: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    region_code: string | null;
    province_code: string | null;
    city_code: string | null;
    barangay_code: string | null;
    logo_url: string | null;
    business_permit_url: string | null;
    halal_only: boolean;
    certificates: ExistingCertificate[];
    rejection_reason: string | null;
    terms_version: string | null;
    terms_accepted_at: string | null;
    submitted_at: string | null;
};

type CertificateDraft = {
    id: string | null;
    document_url: string | null;
    certifying_body: string;
    certificate_number: string;
    valid_until: string;
    document: File | null;
};

type PsgcItem = {
    code: string;
    name: string;
    postal_code?: string;
};

const DESCRIPTION_MAX = 1000;

const emptyCertificate = (): CertificateDraft => ({
    id: null,
    document_url: null,
    certifying_body: '',
    certificate_number: '',
    valid_until: '',
    document: null,
});

function todayInputValue(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const FIELD_META: Record<string, { label: string; target: string }> = {
    logo: { label: 'Shop logo', target: 'f-logo' },
    shop_name: { label: 'Shop name', target: 'f-shop-name' },
    description: { label: 'Shop description', target: 'f-description' },
    region: { label: 'Region', target: 'f-region' },
    address_line: { label: 'Street address', target: 'f-street' },
    barangay: { label: 'Barangay', target: 'f-barangay' },
    city: { label: 'City / Municipality', target: 'f-city' },
    state: { label: 'Province', target: 'f-province' },
    postal_code: { label: 'Postal code', target: 'f-postal' },
    region_code: { label: 'Region', target: 'f-region' },
    province_code: { label: 'Province', target: 'f-province' },
    city_code: { label: 'City / Municipality', target: 'f-city' },
    barangay_code: { label: 'Barangay', target: 'f-barangay' },
    business_permit: { label: 'Business permit', target: 'f-permit' },
    certificates: { label: 'Certificates', target: 'f-certificates' },
    agreed_to_terms: { label: 'Seller terms', target: 'f-terms' },
    confirm: { label: 'Accuracy confirmation', target: 'f-confirm' },
    halal_only: { label: 'Halal-only commitment', target: 'f-halal' },
};

const CERT_FIELD_LABELS: Record<string, string> = {
    certifying_body: 'issuing body',
    certificate_number: 'certificate number',
    valid_until: 'expiry date',
    document: 'document',
};

function errorMeta(key: string): { label: string; target: string } {
    const certMatch = key.match(/^certificates\.(\d+)\.(.+)$/);
    if (certMatch) {
        const index = Number(certMatch[1]);
        const field = certMatch[2];
        return {
            label: `Certificate ${index + 1} — ${CERT_FIELD_LABELS[field] ?? field}`,
            target: `cert-${index}-${field}`,
        };
    }

    return FIELD_META[key] ?? { label: key, target: 'seller-register-form' };
}

/** Danger banner listing server errors; grabs focus when it mounts. */
function ErrorSummary({ errors }: { errors: Record<string, string> }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        ref.current?.focus();
    }, []);

    return (
        <div
            ref={ref}
            tabIndex={-1}
            data-test="error-summary"
            className="focus-ring rounded-panel"
        >
            <Banner tone="danger" live title="Please fix the following">
                <ul className="grid list-disc gap-1 pl-5">
                    {Object.entries(errors).map(([key, message]) => {
                        const meta = errorMeta(key);
                        return (
                            <li key={key}>
                                <a
                                    href={`#${meta.target}`}
                                    className="font-bold underline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        document
                                            .getElementById(meta.target)
                                            ?.focus();
                                    }}
                                >
                                    {meta.label}
                                </a>
                                : {message}
                            </li>
                        );
                    })}
                </ul>
            </Banner>
        </div>
    );
}

export default function SellerRegister({
    application,
    terms,
}: {
    application: ExistingApplication | null;
    terms: { version: string };
}) {
    const [shopName, setShopName] = useState(application?.shop_name ?? '');
    const [description, setDescription] = useState(
        application?.description ?? '',
    );
    const [logo, setLogo] = useState<File | null>(null);
    const [businessPermit, setBusinessPermit] = useState<File | null>(null);

    const [regionCode, setRegionCode] = useState(
        application?.region_code ?? '',
    );
    const [provinceCode, setProvinceCode] = useState(
        application?.province_code ?? '',
    );
    const [cityCode, setCityCode] = useState(application?.city_code ?? '');
    const [barangayCode, setBarangayCode] = useState(
        application?.barangay_code ?? '',
    );
    const [street, setStreet] = useState(application?.address_line ?? '');
    const [postalCode, setPostalCode] = useState(
        application?.postal_code ?? '',
    );
    const [postalLocked, setPostalLocked] = useState(false);

    const [regions, setRegions] = useState<PsgcItem[]>([]);
    const [provinces, setProvinces] = useState<PsgcItem[]>([]);
    const [cities, setCities] = useState<PsgcItem[]>([]);
    const [barangays, setBarangays] = useState<PsgcItem[]>([]);

    const [certificates, setCertificates] = useState<CertificateDraft[]>(
        application?.certificates?.length
            ? application.certificates.map((certificate) => ({
                  ...certificate,
                  document: null,
              }))
            : [emptyCertificate()],
    );
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [confirmedAccuracy, setConfirmedAccuracy] = useState(false);
    const [halalOnly, setHalalOnly] = useState(
        application?.halal_only ?? false,
    );
    const statusBannerRef = useRef<HTMLDivElement>(null);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>(
        {},
    );

    useEffect(() => {
        if (
            application?.status === 'changes_requested' ||
            application?.status === 'rejected'
        ) {
            statusBannerRef.current?.scrollIntoView({ block: 'center' });
        }
    }, [application?.status]);

    const clearClientError = (key: string) =>
        setClientErrors((current) => {
            if (!(key in current)) {
                return current;
            }
            const next = { ...current };
            delete next[key];

            return next;
        });

    /** Client-side mirror of the request rules; the summary lists every gap.
        PSGC selects must hold a chosen value, not just typed text. */
    const validateBeforeSubmit = (): boolean => {
        const missing: Record<string, string> = {};
        if (!shopName.trim()) {
            missing.shop_name = 'Enter your shop name.';
        }
        if (!description.trim()) {
            missing.description = 'Enter your shop description.';
        }
        if (!regionCode) {
            missing.region = 'Select your region.';
        }
        if (!provinceCode) {
            missing.state = 'Select your province.';
        }
        if (!cityCode) {
            missing.city = 'Select your city or municipality.';
        }
        if (!barangayCode) {
            missing.barangay = 'Select your barangay.';
        }
        if (!street.trim()) {
            missing.address_line = 'Enter your street address.';
        }
        if (!postalCode.trim()) {
            missing.postal_code = 'Enter your postal code.';
        }
        if (!businessPermit && !application?.business_permit_url) {
            missing.business_permit = 'Upload your business permit.';
        }
        certificates.forEach((certificate, index) => {
            if (!certificate.certifying_body.trim()) {
                missing[`certificates.${index}.certifying_body`] =
                    'Enter the issuing body.';
            }
            if (!certificate.certificate_number.trim()) {
                missing[`certificates.${index}.certificate_number`] =
                    'Enter the certificate number.';
            }
            if (!certificate.valid_until) {
                missing[`certificates.${index}.valid_until`] =
                    'Enter the expiry date.';
            }
            if (!certificate.document && !certificate.document_url) {
                missing[`certificates.${index}.document`] =
                    'Upload the certificate document.';
            }
        });
        if (!agreedToTerms) {
            missing.agreed_to_terms = 'You must agree to the Seller Terms.';
        }
        if (!confirmedAccuracy) {
            missing.confirm = 'Confirm the information is true and correct.';
        }
        setClientErrors(missing);

        return Object.keys(missing).length === 0;
    };

    // Cascading PSGC lists (same endpoints as the buyer address form).
    useEffect(() => {
        fetch('/api/psgc/regions')
            .then((res) => (res.ok ? res.json() : []))
            .then((data: PsgcItem[]) => setRegions(data))
            .catch(() => setRegions([]));
    }, []);

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

    const provinceName =
        provinces.find((p) => p.code === provinceCode)?.name ?? '';
    const cityName = cities.find((c) => c.code === cityCode)?.name ?? '';
    const barangayName =
        barangays.find((b) => b.code === barangayCode)?.name ?? '';

    const updateCertificate = (
        index: number,
        patch: Partial<CertificateDraft>,
    ) => {
        setCertificates((current) =>
            current.map((certificate, i) =>
                i === index ? { ...certificate, ...patch } : certificate,
            ),
        );
    };

    // Checklist computed from live form values — one line per section.
    const checklist = [
        {
            key: 'profile',
            label: 'Shop profile',
            done: shopName.trim() !== '' && description.trim() !== '',
        },
        {
            key: 'address',
            label: 'Pickup & business address',
            done: Boolean(
                regionCode &&
                provinceCode &&
                cityCode &&
                barangayCode &&
                street.trim() &&
                postalCode.trim(),
            ),
        },
        {
            key: 'documents',
            label: 'Documents',
            done:
                businessPermit !== null &&
                certificates.length > 0 &&
                certificates.every(
                    (certificate) =>
                        certificate.certifying_body.trim() !== '' &&
                        certificate.certificate_number.trim() !== '' &&
                        certificate.valid_until !== '' &&
                        certificate.document !== null,
                ),
        },
        {
            key: 'declaration',
            label: 'Review & submit',
            done: agreedToTerms && confirmedAccuracy,
        },
    ];
    const doneCount = checklist.filter((item) => item.done).length;

    const checklistList = (
        <ol className="grid gap-2">
            {checklist.map((item) => (
                <li
                    key={item.key}
                    data-test={`checklist-${item.key}`}
                    data-done={item.done || undefined}
                    className="flex items-center gap-2 text-body-sm"
                >
                    {item.done ? (
                        <CheckCircle2
                            className="size-4 shrink-0 text-halal"
                            aria-hidden="true"
                        />
                    ) : (
                        <Circle
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden="true"
                        />
                    )}
                    <span
                        className={
                            item.done
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                        }
                    >
                        {item.label}
                    </span>
                    <span className="ml-auto text-caption text-muted-foreground">
                        {item.done ? 'Done' : 'To do'}
                    </span>
                </li>
            ))}
        </ol>
    );

    if (application?.status === 'pending') {
        return (
            <>
                <Head title="Seller application" />
                <div className="w-full max-w-3xl">
                    <Banner tone="info" title="Application under review">
                        <p>
                            Your application for{' '}
                            <strong className="text-foreground">
                                {application.shop_name}
                            </strong>
                            {application.submitted_at && (
                                <>
                                    {' '}
                                    — submitted{' '}
                                    {new Date(
                                        application.submitted_at,
                                    ).toLocaleDateString('en-PH', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </>
                            )}{' '}
                            is under review. We'll review it and notify you here
                            within 3 business days.
                        </p>
                        {application.terms_version && (
                            <p className="mt-2">
                                Accepted Seller Terms v
                                {application.terms_version}
                                {application.terms_accepted_at &&
                                    ` on ${new Date(application.terms_accepted_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                                .
                            </p>
                        )}
                        <p className="mt-2">
                            <Link
                                href="/account"
                                className="font-bold text-primary-text underline"
                            >
                                Back to account
                            </Link>
                        </p>
                    </Banner>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Become a seller" />
            <div className="w-full lg:grid lg:grid-cols-[minmax(0,48rem)_minmax(14rem,18rem)] lg:items-start lg:gap-10">
                {/* Application checklist — collapsible above the form on small
                    screens, a sticky rail on lg+. */}
                <aside
                    aria-label="Application checklist"
                    className="mb-6 lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:order-2 lg:mb-0"
                >
                    <details className="panel p-4 lg:hidden">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-label text-foreground [&::-webkit-details-marker]:hidden">
                            <span>
                                Application checklist — {doneCount}/
                                {checklist.length} complete
                            </span>
                            <ChevronDown
                                className="size-4 text-muted-foreground"
                                aria-hidden="true"
                            />
                        </summary>
                        <div className="mt-3">{checklistList}</div>
                    </details>
                    <div className="panel hidden p-4 lg:block">
                        <p className="mb-3 text-label text-foreground">
                            Your application
                        </p>
                        {checklistList}
                        <p className="mt-3 text-caption text-muted-foreground">
                            {doneCount === checklist.length
                                ? 'Ready to submit'
                                : 'Complete all sections to submit.'}
                        </p>
                    </div>
                </aside>

                <div className="lg:order-1" id="seller-register-form">
                    <header className="mb-6">
                        <h1 className="flex items-center gap-2 text-h1">
                            <Store
                                className="size-7 shrink-0 text-primary-text"
                                aria-hidden="true"
                            />
                            Become a seller
                        </h1>
                        <p className="mt-1 text-body text-muted-foreground">
                            Tell us about your shop. Applications are reviewed
                            within 3 business days.
                        </p>
                    </header>

                    <div className="mb-8">
                        <Banner tone="info" title="Before you start">
                            <ul className="list-disc pl-5">
                                <li>
                                    A business permit (required) — DTI business
                                    name registration or mayor's permit
                                </li>
                                <li>
                                    At least one certificate (required), such as
                                    a halal certificate, with its number and
                                    expiry date
                                </li>
                                <li>Optional: a shop logo</li>
                            </ul>
                        </Banner>
                    </div>

                    {application?.status === 'rejected' && (
                        <div
                            ref={statusBannerRef}
                            className="mb-8 scroll-mt-24"
                        >
                            <Banner
                                tone="danger"
                                live
                                prominent
                                title="Your previous application was rejected"
                            >
                                {application.rejection_reason && (
                                    <div className="mt-3 rounded-panel border border-danger/30 bg-surface/80 p-3">
                                        <p className="mb-1 text-label text-foreground">
                                            Admin's note
                                        </p>
                                        <blockquote className="border-l-2 border-danger/50 pl-3 text-body-sm text-foreground">
                                            {application.rejection_reason}
                                        </blockquote>
                                    </div>
                                )}
                                <p className="mt-1">
                                    Update your details and submit a new
                                    application below. Documents must be
                                    uploaded again.
                                </p>
                            </Banner>
                        </div>
                    )}

                    {application?.status === 'changes_requested' && (
                        <div
                            ref={statusBannerRef}
                            className="mb-8 scroll-mt-24"
                        >
                            <Banner
                                tone="warning"
                                live
                                prominent
                                title="Changes were requested on your application"
                            >
                                {application.rejection_reason && (
                                    <div className="mt-3 rounded-panel border border-warning/40 bg-surface/80 p-3">
                                        <p className="mb-1 text-label text-foreground">
                                            Admin's note
                                        </p>
                                        <blockquote className="border-l-2 border-warning pl-3 text-body-sm text-foreground">
                                            {application.rejection_reason}
                                        </blockquote>
                                    </div>
                                )}
                                <p className="mt-1">
                                    Update your details and resubmit below. Your
                                    application goes back under review once you
                                    submit.
                                </p>
                            </Banner>
                        </div>
                    )}

                    <Form
                        action={storeRegistration().url}
                        method="post"
                        noValidate
                        onBefore={validateBeforeSubmit}
                        transform={(data) => ({
                            ...data,
                            shop_name: shopName,
                            description: description,
                            logo: logo,
                            business_permit: businessPermit,
                            address_line:
                                application?.address_line === street
                                    ? street
                                    : [street, barangayName]
                                          .filter(Boolean)
                                          .join(', '),
                            city: cityName || application?.city || '',
                            state: provinceName || application?.state || '',
                            postal_code: postalCode,
                            region_code: regionCode,
                            province_code: provinceCode,
                            city_code: cityCode,
                            barangay_code: barangayCode,
                            certificates: certificates.map((certificate) => ({
                                id: certificate.id,
                                certifying_body: certificate.certifying_body,
                                certificate_number:
                                    certificate.certificate_number,
                                valid_until: certificate.valid_until,
                                document: certificate.document,
                            })),
                        })}
                    >
                        {({ errors: serverErrors, processing }) => {
                            const errors = {
                                ...clientErrors,
                                ...serverErrors,
                            };

                            return (
                                <div className="grid gap-8">
                                    {Object.keys(errors).length > 0 && (
                                        <ErrorSummary errors={errors} />
                                    )}

                                    {/* 1. Shop profile */}
                                    <section
                                        aria-labelledby="section-profile"
                                        className="grid gap-4"
                                    >
                                        <div>
                                            <h2
                                                id="section-profile"
                                                className="text-h3"
                                            >
                                                1. Shop profile
                                            </h2>
                                            <p className="mt-1 text-body-sm text-muted-foreground">
                                                How buyers will see your shop.
                                            </p>
                                        </div>
                                        <FileField
                                            id="f-logo"
                                            label="Shop logo"
                                            accept="image/*"
                                            acceptLabel="JPG, PNG or WebP"
                                            variant="avatar"
                                            value={logo}
                                            onChange={setLogo}
                                            error={errors.logo}
                                            existingUrl={application?.logo_url}
                                            existingLabel="Shop logo"
                                            optional
                                            helper="Shown on your shop page."
                                        />
                                        <FormField
                                            id="f-shop-name"
                                            label="Shop name"
                                            error={errors.shop_name}
                                            help="Shown publicly on your shop page. Must be unique. Up to 120 characters."
                                        >
                                            <Input
                                                value={shopName}
                                                onChange={(e) =>
                                                    setShopName(e.target.value)
                                                }
                                                maxLength={120}
                                                autoComplete="organization"
                                                required
                                                aria-required="true"
                                            />
                                        </FormField>
                                        <FormField
                                            id="f-description"
                                            label="Shop description"
                                            error={errors.description}
                                            help="What you sell and how you source it."
                                            counter={`${description.length} / ${DESCRIPTION_MAX}`}
                                        >
                                            <TextArea
                                                value={description}
                                                onChange={(e) =>
                                                    setDescription(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={4}
                                                maxLength={DESCRIPTION_MAX}
                                                required
                                                aria-required="true"
                                            />
                                        </FormField>
                                    </section>

                                    {/* 2. Pickup & business address */}
                                    <section
                                        aria-labelledby="section-address"
                                        className="grid gap-4 border-t border-border pt-8"
                                    >
                                        <div>
                                            <h2
                                                id="section-address"
                                                className="text-h3"
                                            >
                                                2. Pickup & business address
                                            </h2>
                                            <p className="mt-1 text-body-sm text-muted-foreground">
                                                Couriers collect orders and
                                                returns from this address.
                                            </p>
                                        </div>
                                        <div className="grid items-start gap-4 md:grid-cols-2">
                                            <FormField
                                                id="f-street"
                                                label="Street address / Unit / Building"
                                                error={errors.address_line}
                                            >
                                                <Input
                                                    value={street}
                                                    onChange={(e) =>
                                                        setStreet(
                                                            e.target.value,
                                                        )
                                                    }
                                                    maxLength={255}
                                                    placeholder="e.g. Unit 4B, 12 Bagong Silang St."
                                                    autoComplete="street-address"
                                                    required
                                                    aria-required="true"
                                                />
                                            </FormField>
                                            <Combobox
                                                id="f-region"
                                                label="Region"
                                                options={regions.map((r) => ({
                                                    value: r.code,
                                                    label: r.name,
                                                }))}
                                                value={regionCode}
                                                placeholder="Select region"
                                                error={
                                                    errors.region_code ??
                                                    errors.region
                                                }
                                                onChange={(code) => {
                                                    setRegionCode(code);
                                                    setProvinceCode('');
                                                    setCityCode('');
                                                    setBarangayCode('');
                                                    clearClientError('region');
                                                }}
                                            />
                                            <Combobox
                                                id="f-province"
                                                label="Province"
                                                options={provinces.map((p) => ({
                                                    value: p.code,
                                                    label: p.name,
                                                }))}
                                                value={provinceCode}
                                                disabled={!regionCode}
                                                placeholder={
                                                    !regionCode
                                                        ? 'Select region first'
                                                        : 'Select province'
                                                }
                                                onChange={(code) => {
                                                    setProvinceCode(code);
                                                    setCityCode('');
                                                    setBarangayCode('');
                                                    clearClientError('state');
                                                }}
                                                error={
                                                    errors.province_code ??
                                                    errors.state
                                                }
                                            />
                                            <Combobox
                                                id="f-city"
                                                label="City / Municipality"
                                                options={cities.map((c) => ({
                                                    value: c.code,
                                                    label: c.name,
                                                }))}
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
                                                    clearClientError('city');
                                                    const selected =
                                                        cities.find(
                                                            (c) =>
                                                                c.code === code,
                                                        );
                                                    if (selected?.postal_code) {
                                                        setPostalCode(
                                                            selected.postal_code,
                                                        );
                                                        setPostalLocked(true);
                                                    } else {
                                                        setPostalLocked(false);
                                                    }
                                                }}
                                                error={
                                                    errors.city_code ??
                                                    errors.city
                                                }
                                            />
                                            <Combobox
                                                id="f-barangay"
                                                label="Barangay"
                                                options={barangays.map((b) => ({
                                                    value: b.code,
                                                    label: b.name,
                                                }))}
                                                value={barangayCode}
                                                disabled={!cityCode}
                                                placeholder={
                                                    !cityCode
                                                        ? 'Select city first'
                                                        : 'Search barangay'
                                                }
                                                onChange={(code) => {
                                                    setBarangayCode(code);
                                                    clearClientError(
                                                        'barangay',
                                                    );
                                                }}
                                                error={
                                                    errors.barangay_code ??
                                                    errors.barangay
                                                }
                                            />
                                            <FormField
                                                id="f-postal"
                                                label="Postal code"
                                                error={errors.postal_code}
                                                help={
                                                    postalLocked
                                                        ? 'Filled from your city.'
                                                        : '4-digit ZIP code.'
                                                }
                                            >
                                                <Input
                                                    value={postalCode}
                                                    onChange={(e) =>
                                                        setPostalCode(
                                                            e.target.value,
                                                        )
                                                    }
                                                    maxLength={10}
                                                    inputMode="numeric"
                                                    autoComplete="postal-code"
                                                    readOnly={postalLocked}
                                                    required
                                                    aria-required="true"
                                                />
                                            </FormField>
                                        </div>
                                    </section>

                                    {/* 3. Documents */}
                                    <section
                                        aria-labelledby="section-documents"
                                        className="grid gap-4 border-t border-border pt-8"
                                    >
                                        <div>
                                            <h2
                                                id="section-documents"
                                                className="text-h3"
                                            >
                                                3. Documents
                                            </h2>
                                            <p className="mt-1 text-body-sm text-muted-foreground">
                                                Clear photos or scans are fine —
                                                we verify them during review.
                                            </p>
                                        </div>

                                        <FileField
                                            id="f-permit"
                                            label="Business permit"
                                            accept="image/*,application/pdf"
                                            acceptLabel="JPG, PNG or PDF"
                                            variant="document"
                                            value={businessPermit}
                                            onChange={setBusinessPermit}
                                            error={errors.business_permit}
                                            existingUrl={
                                                application?.business_permit_url
                                            }
                                            existingLabel="Business permit"
                                            helper="DTI business name registration or mayor's permit."
                                        />

                                        <div
                                            id="f-certificates"
                                            tabIndex={-1}
                                            className="grid gap-6"
                                        >
                                            {certificates.map(
                                                (certificate, index) => (
                                                    <fieldset
                                                        key={index}
                                                        className="overflow-hidden rounded-panel border border-border"
                                                    >
                                                        <legend className="sr-only">
                                                            Certificate{' '}
                                                            {index + 1}
                                                        </legend>
                                                        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-2.5">
                                                            <p className="text-label text-foreground">
                                                                Certificate{' '}
                                                                {index + 1}
                                                            </p>
                                                            {index > 0 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="link"
                                                                    onClick={() =>
                                                                        setCertificates(
                                                                            (
                                                                                current,
                                                                            ) =>
                                                                                current.filter(
                                                                                    (
                                                                                        _,
                                                                                        i,
                                                                                    ) =>
                                                                                        i !==
                                                                                        index,
                                                                                ),
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <div className="grid items-start gap-4 p-4 md:grid-cols-2">
                                                            <FormField
                                                                id={`cert-${index}-certifying_body`}
                                                                label="Issuing body"
                                                                error={
                                                                    errors[
                                                                        `certificates.${index}.certifying_body`
                                                                    ]
                                                                }
                                                                help="Name of the certifying organisation."
                                                            >
                                                                <Input
                                                                    value={
                                                                        certificate.certifying_body
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateCertificate(
                                                                            index,
                                                                            {
                                                                                certifying_body:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    maxLength={
                                                                        255
                                                                    }
                                                                    placeholder="e.g. Islamic Da'wah Council of the Philippines"
                                                                    required
                                                                    aria-required="true"
                                                                />
                                                            </FormField>
                                                            <FormField
                                                                id={`cert-${index}-certificate_number`}
                                                                label="Certificate number"
                                                                error={
                                                                    errors[
                                                                        `certificates.${index}.certificate_number`
                                                                    ]
                                                                }
                                                                help="As printed on the certificate."
                                                            >
                                                                <Input
                                                                    value={
                                                                        certificate.certificate_number
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateCertificate(
                                                                            index,
                                                                            {
                                                                                certificate_number:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    maxLength={
                                                                        100
                                                                    }
                                                                    required
                                                                    aria-required="true"
                                                                />
                                                            </FormField>
                                                            <FormField
                                                                id={`cert-${index}-valid_until`}
                                                                label="Expiry date"
                                                                error={
                                                                    errors[
                                                                        `certificates.${index}.valid_until`
                                                                    ]
                                                                }
                                                                help={
                                                                    certificate.valid_until
                                                                        ? `Expires ${(() => {
                                                                              const d =
                                                                                  new Date(
                                                                                      `${certificate.valid_until}T00:00:00`,
                                                                                  );
                                                                              return `${d.getDate()} ${d.toLocaleDateString('en-PH', { month: 'short' })} ${d.getFullYear()}`;
                                                                          })()} — we re-check certificates for expiry after approval.`
                                                                        : 'Must be in the future. We re-check certificates for expiry after approval.'
                                                                }
                                                            >
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        certificate.valid_until
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateCertificate(
                                                                            index,
                                                                            {
                                                                                valid_until:
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    min={todayInputValue()}
                                                                    lang="en-PH"
                                                                    required
                                                                    aria-required="true"
                                                                />
                                                            </FormField>
                                                            <FileField
                                                                id={`cert-${index}-document`}
                                                                label="Certificate document"
                                                                accept="image/*,application/pdf"
                                                                acceptLabel="JPG, PNG or PDF"
                                                                variant="document"
                                                                value={
                                                                    certificate.document
                                                                }
                                                                existingUrl={
                                                                    certificate.document_url
                                                                }
                                                                existingLabel="Certificate document"
                                                                onChange={(
                                                                    file,
                                                                ) =>
                                                                    updateCertificate(
                                                                        index,
                                                                        {
                                                                            document:
                                                                                file,
                                                                        },
                                                                    )
                                                                }
                                                                error={
                                                                    errors[
                                                                        `certificates.${index}.document`
                                                                    ]
                                                                }
                                                            />
                                                        </div>
                                                    </fieldset>
                                                ),
                                            )}
                                            {errors.certificates && (
                                                <p className="text-body-sm font-bold text-danger-text">
                                                    {errors.certificates}
                                                </p>
                                            )}
                                            <div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() =>
                                                        setCertificates(
                                                            (current) => [
                                                                ...current,
                                                                emptyCertificate(),
                                                            ],
                                                        )
                                                    }
                                                    icon={
                                                        <Plus
                                                            className="size-4"
                                                            aria-hidden="true"
                                                        />
                                                    }
                                                >
                                                    Add another certificate
                                                </Button>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 4. Review & submit */}
                                    <section
                                        aria-labelledby="section-submit"
                                        className="grid gap-4 border-t border-border pt-8"
                                    >
                                        <h2
                                            id="section-submit"
                                            className="text-h3"
                                        >
                                            4. Review & submit
                                        </h2>
                                        <div className="grid gap-3">
                                            <label className="flex items-start gap-3">
                                                <Checkbox
                                                    id="f-terms"
                                                    name="agreed_to_terms"
                                                    value="1"
                                                    required
                                                    checked={agreedToTerms}
                                                    onChange={(e) =>
                                                        setAgreedToTerms(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <span className="text-body">
                                                    I agree to the{' '}
                                                    <a
                                                        href={SellerTermsController.url()}
                                                        target="_blank"
                                                        rel="noopener"
                                                        className="font-bold text-primary-text underline"
                                                    >
                                                        Seller Terms
                                                    </a>{' '}
                                                    (version {terms.version}).
                                                </span>
                                            </label>
                                            {errors.agreed_to_terms && (
                                                <p className="text-body-sm font-bold text-danger-text">
                                                    {errors.agreed_to_terms}
                                                </p>
                                            )}
                                            <label className="flex items-start gap-3">
                                                <Checkbox
                                                    id="f-confirm"
                                                    required
                                                    checked={confirmedAccuracy}
                                                    onChange={(e) =>
                                                        setConfirmedAccuracy(
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                                <span className="text-body">
                                                    I confirm the information
                                                    and documents are true and
                                                    correct.
                                                </span>
                                            </label>
                                            <div>
                                                <label className="flex items-start gap-3">
                                                    <Checkbox
                                                        id="f-halal"
                                                        name="halal_only"
                                                        value="1"
                                                        checked={halalOnly}
                                                        onChange={(e) =>
                                                            setHalalOnly(
                                                                e.target
                                                                    .checked,
                                                            )
                                                        }
                                                        aria-describedby="f-halal-help"
                                                    />
                                                    <span className="text-body">
                                                        Apply for the Halal-only
                                                        shop badge
                                                    </span>
                                                </label>
                                                <p
                                                    id="f-halal-help"
                                                    className="mt-1 pl-8 text-body-sm text-muted-foreground"
                                                >
                                                    Your shop will show a
                                                    Halal-only badge. You commit
                                                    to listing only
                                                    halal-certified or
                                                    halal-permissible products,
                                                    and we may remove the badge
                                                    if a listing breaks this.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid gap-3 border-t border-border pt-4">
                                            <p className="text-body-sm text-muted-foreground">
                                                We'll review your application
                                                and notify you here. You can
                                                still shop while you wait.
                                            </p>
                                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
                                                <Button variant="link" asChild>
                                                    <Link href="/account">
                                                        Cancel
                                                    </Link>
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="w-full sm:w-auto"
                                                >
                                                    {processing
                                                        ? 'Submitting…'
                                                        : 'Submit application'}
                                                </Button>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                            );
                        }}
                    </Form>
                </div>
            </div>
        </>
    );
}
