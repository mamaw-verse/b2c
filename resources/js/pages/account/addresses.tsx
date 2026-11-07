import { Head, router } from '@inertiajs/react';
import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { AddressCard, type AddressData } from '@/components/address-card';
import { AddressForm, type AddressFormData } from '@/components/address-form';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';

type AddressesPageProps = {
    addresses: AddressData[];
};

export default function Addresses({ addresses }: AddressesPageProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<AddressData | null>(
        null,
    );
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const handleOpenCreate = () => {
        setEditingAddress(null);
        setFormErrors({});
        setModalOpen(true);
    };

    const handleOpenEdit = (addr: AddressData) => {
        setEditingAddress(addr);
        setFormErrors({});
        setModalOpen(true);
    };

    const handleSubmit = (data: AddressFormData) => {
        if (editingAddress) {
            router.put(`/account/addresses/${editingAddress.id}`, data, {
                preserveScroll: true,
                onSuccess: () => {
                    setModalOpen(false);
                    setEditingAddress(null);
                },
                onError: (errors) => setFormErrors(errors),
            });
        } else {
            router.post('/account/addresses', data, {
                preserveScroll: true,
                onSuccess: () => {
                    setModalOpen(false);
                },
                onError: (errors) => setFormErrors(errors),
            });
        }
    };

    const handleSetDefault = (addr: AddressData) => {
        router.put(
            `/account/addresses/${addr.id}/default`,
            {},
            { preserveScroll: true },
        );
    };

    const handleDelete = (addr: AddressData) => {
        if (confirm(`Are you sure you want to delete this address?`)) {
            router.delete(`/account/addresses/${addr.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Address Book" />

            <div className="grid gap-6">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-h1">Address Book</h1>
                        <p className="mt-0.5 text-body text-muted-foreground">
                            Manage your delivery addresses and default shipping
                            location.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="btn btn-primary flex items-center gap-1.5 self-start sm:self-auto"
                    >
                        <Plus className="size-4" />
                        <span>Add new address</span>
                    </button>
                </header>

                {addresses.length === 0 ? (
                    <div className="panel p-8 text-center">
                        <EmptyState
                            icon={MapPin}
                            title="No addresses saved"
                            text="Add a delivery address so you can checkout quickly."
                            action={
                                <button
                                    type="button"
                                    onClick={handleOpenCreate}
                                    className="btn btn-primary min-h-touch-primary"
                                >
                                    Add address
                                </button>
                            }
                        />
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {addresses.map((address) => (
                            <AddressCard
                                key={address.id}
                                address={address}
                                onEdit={() => handleOpenEdit(address)}
                                onDelete={() => handleDelete(address)}
                                onSetDefault={() => handleSetDefault(address)}
                            />
                        ))}
                    </div>
                )}
            </div>

            <Modal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title={editingAddress ? 'Edit address' : 'Add new address'}
                kind="responsive"
            >
                <AddressForm
                    initialValues={
                        editingAddress
                            ? {
                                  name: editingAddress.name,
                                  phone: editingAddress.phone,
                                  region_code: editingAddress.region_code ?? '',
                                  province_code:
                                      editingAddress.province_code ?? '',
                                  city_code: editingAddress.city_code ?? '',
                                  barangay_code:
                                      editingAddress.barangay_code ?? '',
                                  street: editingAddress.street,
                                  postal_code: editingAddress.postal_code,
                                  landmark: editingAddress.landmark ?? '',
                                  label:
                                      (editingAddress.label as any) ?? 'home',
                                  is_default:
                                      editingAddress.is_default ?? false,
                              }
                            : undefined
                    }
                    errors={formErrors}
                    onSubmit={handleSubmit}
                    onCancel={() => setModalOpen(false)}
                />
            </Modal>
        </>
    );
}

Addresses.layout = {
    breadcrumbs: [
        {
            title: 'Address Book',
            href: '/account/addresses',
        },
    ],
};
