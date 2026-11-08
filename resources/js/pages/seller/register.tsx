import { Form, Head } from '@inertiajs/react';
import { Clock, Store } from 'lucide-react';
import { useState } from 'react';
import { ImageUploader } from '@/components/image-uploader';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TextArea } from '@/components/ui/textarea';
import { store as storeRegistration } from '@/routes/seller/register';

type ExistingApplication = {
    status: 'pending' | 'rejected';
    shop_name: string;
    description: string | null;
    location: string | null;
    contact_number: string | null;
    halal_only: boolean;
    id_type: string | null;
    id_number: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    rejection_reason: string | null;
    submitted_at: string | null;
};

const ID_TYPES = [
    { value: 'philsys', label: 'PhilSys ID' },
    { value: 'drivers_license', label: "Driver's license" },
    { value: 'passport', label: 'Passport' },
    { value: 'national_id', label: 'National ID' },
];

export default function SellerRegister({
    application,
}: {
    application: ExistingApplication | null;
}) {
    const [contactNumber, setContactNumber] = useState(
        application?.contact_number ?? '',
    );
    const [idDocument, setIdDocument] = useState<File[]>([]);
    const [selfie, setSelfie] = useState<File[]>([]);
    const [businessPermit, setBusinessPermit] = useState<File[]>([]);

    if (application?.status === 'pending') {
        return (
            <>
                <Head title="Seller application" />
                <div className="mx-auto max-w-2xl p-gutter py-8">
                    <section className="panel grid justify-items-center gap-3 p-6 text-center md:p-10">
                        <span className="grid size-12 place-items-center rounded-tile bg-info-soft text-info-text">
                            <Clock className="size-6" aria-hidden="true" />
                        </span>
                        <h1 className="text-h2">Application under review</h1>
                        <p className="max-w-md text-body text-muted-foreground">
                            Your application for{' '}
                            <strong className="text-foreground">
                                {application.shop_name}
                            </strong>{' '}
                            is under review. We'll notify you within 3 business
                            days.
                        </p>
                        {application.submitted_at && (
                            <p className="text-body-sm text-muted-foreground">
                                Submitted{' '}
                                {new Date(
                                    application.submitted_at,
                                ).toLocaleDateString('en-PH', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </p>
                        )}
                    </section>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Become a seller" />
            <Form
                action={storeRegistration().url}
                method="post"
                transform={(data) => ({
                    ...data,
                    id_document: idDocument[0],
                    selfie: selfie[0],
                    business_permit: businessPermit[0],
                })}
            >
                {({ errors, processing }) => (
                    <div className="mx-auto max-w-3xl p-gutter py-8">
                        <div className="mb-6 flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-tile bg-primary-soft text-primary-text">
                                <Store className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                                <h1 className="text-h1">Become a seller</h1>
                                <p className="text-body text-muted-foreground">
                                    Tell us about your shop. Applications are
                                    reviewed within 3 business days.
                                </p>
                            </div>
                        </div>

                        {application?.status === 'rejected' && (
                            <div
                                role="alert"
                                className="mb-6 rounded-panel bg-danger-soft p-4 text-body text-danger-text"
                            >
                                <p className="font-bold">
                                    Your previous application was rejected
                                </p>
                                {application.rejection_reason && (
                                    <p className="mt-1">
                                        Reason: {application.rejection_reason}
                                    </p>
                                )}
                                <p className="mt-1">
                                    Update your details and submit a new
                                    application below.
                                </p>
                            </div>
                        )}

                        <div className="grid gap-6">
                            {/* Shop information */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">
                                    Shop information
                                </h2>
                                <div className="grid gap-4">
                                    <FormField
                                        label="Shop name"
                                        error={errors.shop_name}
                                        required
                                    >
                                        <Input
                                            name="shop_name"
                                            defaultValue={
                                                application?.shop_name ?? ''
                                            }
                                            maxLength={120}
                                            required
                                        />
                                    </FormField>
                                    <FormField
                                        label="Shop description"
                                        error={errors.description}
                                        required
                                    >
                                        <TextArea
                                            name="description"
                                            defaultValue={
                                                application?.description ?? ''
                                            }
                                            rows={4}
                                            maxLength={1000}
                                            required
                                        />
                                    </FormField>
                                    <FormField
                                        label="Pickup location (city)"
                                        error={errors.location}
                                        required
                                    >
                                        <Input
                                            name="location"
                                            defaultValue={
                                                application?.location ?? ''
                                            }
                                            maxLength={255}
                                            placeholder="e.g. Quezon City"
                                            required
                                        />
                                    </FormField>
                                    <Switch
                                        id="halal_only"
                                        name="halal_only"
                                        value="1"
                                        label="Halal-only shop"
                                        description="I commit to selling only halal-certified products in this shop."
                                        defaultChecked={
                                            application?.halal_only ?? false
                                        }
                                    />
                                    {errors.halal_only && (
                                        <p className="text-body-sm font-bold text-danger-text">
                                            {errors.halal_only}
                                        </p>
                                    )}
                                </div>
                            </section>

                            {/* Contact details */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">
                                    Contact details
                                </h2>
                                <input
                                    type="hidden"
                                    name="contact_number"
                                    value={contactNumber}
                                />
                                <PhoneInput
                                    label="Contact number"
                                    value={contactNumber}
                                    onChange={setContactNumber}
                                    error={errors.contact_number}
                                    required
                                />
                            </section>

                            {/* Identity verification */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-1 text-h3">
                                    Identity verification
                                </h2>
                                <p className="mb-4 text-body text-muted-foreground">
                                    We verify every seller with a
                                    government-issued ID and a selfie.
                                </p>
                                <div className="grid gap-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            label="ID type"
                                            error={errors.id_type}
                                            required
                                        >
                                            <select
                                                name="id_type"
                                                className="field"
                                                defaultValue={
                                                    application?.id_type ?? ''
                                                }
                                                required
                                            >
                                                <option value="">
                                                    Select ID type
                                                </option>
                                                {ID_TYPES.map((t) => (
                                                    <option
                                                        key={t.value}
                                                        value={t.value}
                                                    >
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </FormField>
                                        <FormField
                                            label="ID number"
                                            error={errors.id_number}
                                            required
                                        >
                                            <Input
                                                name="id_number"
                                                defaultValue={
                                                    application?.id_number ?? ''
                                                }
                                                maxLength={50}
                                                required
                                            />
                                        </FormField>
                                    </div>
                                    <ImageUploader
                                        files={idDocument}
                                        onChange={setIdDocument}
                                        max={1}
                                        label="ID document photo"
                                        error={errors.id_document}
                                    />
                                    <ImageUploader
                                        files={selfie}
                                        onChange={setSelfie}
                                        max={1}
                                        label="Selfie holding your ID"
                                        error={errors.selfie}
                                    />
                                </div>
                            </section>

                            {/* Business documents */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-1 text-h3">
                                    Business documents
                                </h2>
                                <p className="mb-4 text-body text-muted-foreground">
                                    Optional for individual sellers. Required
                                    for registered businesses.
                                </p>
                                <ImageUploader
                                    files={businessPermit}
                                    onChange={setBusinessPermit}
                                    max={1}
                                    accept="image/*,application/pdf"
                                    label="Business permit / DTI registration"
                                    error={errors.business_permit}
                                />
                            </section>

                            {/* Payout account */}
                            <section className="panel p-4 md:p-6">
                                <h2 className="mb-4 text-h3">Payout account</h2>
                                <div className="grid gap-4">
                                    <FormField
                                        label="Bank or e-wallet"
                                        error={errors.bank_name}
                                        required
                                    >
                                        <Input
                                            name="bank_name"
                                            defaultValue={
                                                application?.bank_name ?? ''
                                            }
                                            maxLength={120}
                                            placeholder="e.g. BDO, GCash, Maya"
                                            required
                                        />
                                    </FormField>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            label="Account name"
                                            error={errors.bank_account_name}
                                            required
                                        >
                                            <Input
                                                name="bank_account_name"
                                                defaultValue={
                                                    application?.bank_account_name ??
                                                    ''
                                                }
                                                maxLength={120}
                                                required
                                            />
                                        </FormField>
                                        <FormField
                                            label="Account number"
                                            error={errors.bank_account_number}
                                            required
                                        >
                                            <Input
                                                name="bank_account_number"
                                                defaultValue={
                                                    application?.bank_account_number ??
                                                    ''
                                                }
                                                maxLength={50}
                                                required
                                            />
                                        </FormField>
                                    </div>
                                </div>
                            </section>

                            {/* Terms */}
                            <section className="panel p-4 md:p-6">
                                <label className="flex items-start gap-3">
                                    <Checkbox
                                        name="agreed_to_terms"
                                        value="1"
                                        className="mt-0.5"
                                        required
                                    />
                                    <span className="text-body">
                                        I agree to the seller terms and declare
                                        that the information provided is true
                                        and correct.
                                    </span>
                                </label>
                                {errors.agreed_to_terms && (
                                    <p className="mt-2 text-body-sm font-bold text-danger-text">
                                        {errors.agreed_to_terms}
                                    </p>
                                )}
                            </section>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? 'Submitting…'
                                    : 'Submit application'}
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}
