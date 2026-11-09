import { Form, Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';
import { update as updateSettings } from '@/routes/admin/settings';

type PlatformSettings = {
    commission_rate: number;
    auto_confirm_days: number;
    return_window_days: number;
    payout_hold_days: number;
    payout_minimum: number;
    announcement: string | null;
};

export default function AdminSettings({
    settings,
}: {
    settings: PlatformSettings;
}) {
    return (
        <AdminLayout>
            <Head title="Platform settings" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Platform settings</h1>
                <p className="text-body-sm text-muted-foreground">
                    Overrides apply immediately; empty announcement hides the
                    announcement bar.
                </p>

                <Form
                    action={updateSettings().url}
                    method="put"
                    className="panel grid gap-4 p-4"
                >
                    {({ errors }) => (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <FormField
                                    label="Default commission %"
                                    required
                                    help="Category rates take precedence."
                                    error={errors.commission_rate}
                                >
                                    <Input
                                        name="commission_rate"
                                        type="number"
                                        min={0}
                                        max={100}
                                        step={0.01}
                                        defaultValue={settings.commission_rate}
                                    />
                                </FormField>
                                <FormField
                                    label="Auto-confirm days"
                                    required
                                    help="Shipped orders auto-complete after this many days."
                                    error={errors.auto_confirm_days}
                                >
                                    <Input
                                        name="auto_confirm_days"
                                        type="number"
                                        min={0}
                                        max={90}
                                        defaultValue={
                                            settings.auto_confirm_days
                                        }
                                    />
                                </FormField>
                                <FormField
                                    label="Return window days"
                                    required
                                    error={errors.return_window_days}
                                >
                                    <Input
                                        name="return_window_days"
                                        type="number"
                                        min={0}
                                        max={90}
                                        defaultValue={
                                            settings.return_window_days
                                        }
                                    />
                                </FormField>
                                <FormField
                                    label="Payout hold days"
                                    required
                                    help="Sales become payable after this hold."
                                    error={errors.payout_hold_days}
                                >
                                    <Input
                                        name="payout_hold_days"
                                        type="number"
                                        min={0}
                                        max={90}
                                        defaultValue={settings.payout_hold_days}
                                    />
                                </FormField>
                                <FormField
                                    label="Minimum payout (₱)"
                                    required
                                    error={errors.payout_minimum}
                                >
                                    <Input
                                        name="payout_minimum"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        defaultValue={settings.payout_minimum}
                                    />
                                </FormField>
                            </div>
                            <FormField
                                label="Announcement"
                                optional
                                help="Shown in the announcement bar on every storefront page."
                                error={errors.announcement}
                            >
                                <TextArea
                                    name="announcement"
                                    rows={2}
                                    defaultValue={settings.announcement ?? ''}
                                />
                            </FormField>
                            <div>
                                <Button type="submit">Save settings</Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AdminLayout>
    );
}
