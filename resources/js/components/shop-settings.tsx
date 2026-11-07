import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { TextArea } from '@/components/ui/textarea';

type ShippingChannel = {
    value: string;
    label: string;
};

const SHIPPING_CHANNELS: ShippingChannel[] = [
    { value: 'j&t', label: 'J&T Express' },
    { value: 'lbc', label: 'LBC Express' },
    { value: 'grab', label: 'GrabExpress' },
    { value: 'lalamove', label: 'Lalamove' },
    { value: 'ninja-van', label: 'Ninja Van' },
    { value: 'flash', label: 'Flash Express' },
];

type ShopSettingsData = {
    name: string;
    description: string;
    vacation_mode: boolean;
    auto_reply: boolean;
    shipping_channels: Record<string, boolean>;
};

type ShopSettingsProps = {
    data: ShopSettingsData;
    errors: Partial<Record<keyof ShopSettingsData, string>>;
    setData: <K extends keyof ShopSettingsData>(
        key: K,
        value: ShopSettingsData[K],
    ) => void;
};

export function ShopSettings({ data, errors, setData }: ShopSettingsProps) {
    function toggleChannel(value: string) {
        setData('shipping_channels', {
            ...data.shipping_channels,
            [value]: !data.shipping_channels[value],
        });
    }

    return (
        <div className="grid gap-6">
            {/* Shop profile */}
            <section className="panel p-4 md:p-6">
                <h2 className="mb-4 text-h3">Shop profile</h2>
                <div className="grid gap-4">
                    <FormField label="Shop name" error={errors.name} required>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            maxLength={80}
                        />
                    </FormField>
                    <FormField
                        label="Shop description"
                        error={errors.description}
                    >
                        <TextArea
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            rows={4}
                            maxLength={500}
                        />
                    </FormField>
                </div>
            </section>

            {/* Status */}
            <section className="panel p-4 md:p-6">
                <h2 className="mb-4 text-h3">Shop status</h2>
                <div className="grid gap-2 divide-y divide-border">
                    <Switch
                        id="vacation_mode"
                        label="Vacation mode"
                        description="Temporarily pause new orders while you're away."
                        checked={data.vacation_mode}
                        onChange={(e) =>
                            setData('vacation_mode', e.target.checked)
                        }
                    />
                    <Switch
                        id="auto_reply"
                        label="Auto-reply to messages"
                        description="Send an automatic response to buyers who message your shop."
                        checked={data.auto_reply}
                        onChange={(e) =>
                            setData('auto_reply', e.target.checked)
                        }
                    />
                </div>
            </section>

            {/* Shipping channels */}
            <section className="panel p-4 md:p-6">
                <h2 className="mb-1 text-h3">Shipping channels</h2>
                <p className="mb-4 text-body text-muted-foreground">
                    Select the couriers you use to ship orders.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {SHIPPING_CHANNELS.map((channel) => (
                        <label
                            key={channel.value}
                            className="flex min-h-touch items-center gap-3"
                        >
                            <Checkbox
                                id={`channel-${channel.value}`}
                                checked={
                                    data.shipping_channels[channel.value] ??
                                    false
                                }
                                onChange={() => toggleChannel(channel.value)}
                            />
                            <span className="text-body">{channel.label}</span>
                        </label>
                    ))}
                </div>
            </section>
        </div>
    );
}
