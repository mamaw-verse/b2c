import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import { ShopSettings } from '@/components/shop-settings';
import { Button } from '@/components/ui/button';
import { update as updateSettings } from '@/routes/seller/settings';

type SettingsData = {
    name: string;
    description: string;
    vacation_mode: boolean;
    auto_reply: boolean;
    shipping_channels: Record<string, boolean>;
};

type PageProps = {
    settings: SettingsData;
};

export default function SellerSettings({ settings }: PageProps) {
    const [data, setData] = useState<SettingsData>({ ...settings });

    function setField<K extends keyof SettingsData>(
        key: K,
        value: SettingsData[K],
    ) {
        setData((prev) => ({ ...prev, [key]: value }));
    }

    return (
        <>
            <Head title="Shop settings" />
            <Form action={updateSettings().url} method="put">
                {({ errors, processing, wasSuccessful }) => (
                    <div className="mx-auto max-w-3xl p-gutter py-8">
                        <h1 className="mb-6 text-h1">Shop settings</h1>

                        {wasSuccessful && (
                            <div
                                role="status"
                                className="mb-4 rounded-panel bg-success-soft p-3 text-body text-success-text"
                            >
                                Settings saved!
                            </div>
                        )}

                        {/* Hidden inputs for controlled fields */}
                        <input type="hidden" name="name" value={data.name} />
                        <input
                            type="hidden"
                            name="description"
                            value={data.description}
                        />
                        <input
                            type="hidden"
                            name="vacation_mode"
                            value={data.vacation_mode ? '1' : '0'}
                        />
                        <input
                            type="hidden"
                            name="auto_reply"
                            value={data.auto_reply ? '1' : '0'}
                        />
                        {Object.entries(data.shipping_channels).map(
                            ([ch, enabled]) => (
                                <input
                                    key={ch}
                                    type="hidden"
                                    name={`shipping_channels[${ch}]`}
                                    value={enabled ? '1' : '0'}
                                />
                            ),
                        )}

                        <ShopSettings
                            data={data}
                            errors={
                                errors as Partial<
                                    Record<keyof SettingsData, string>
                                >
                            }
                            setData={setField}
                        />

                        <div className="mt-6 flex justify-end">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save settings'}
                            </Button>
                        </div>
                    </div>
                )}
            </Form>
        </>
    );
}
