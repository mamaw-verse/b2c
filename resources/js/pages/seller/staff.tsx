import { Form, Head } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
    destroy as destroyStaff,
    store as storeStaff,
} from '@/routes/seller/staff';

type StaffMember = {
    id: string;
    email: string;
    status: 'pending' | 'active';
    name: string | null;
    invited_at: string | null;
    accepted_at: string | null;
};

type PageProps = {
    staff: StaffMember[];
    maxStaff: number;
};

export default function SellerStaff({ staff, maxStaff }: PageProps) {
    const usedSeats = staff.length;

    return (
        <>
            <Head title="Team" />

            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <header className="flex flex-col gap-1">
                    <h1 className="text-h1">Team</h1>
                    <p className="text-body-sm text-muted-foreground">
                        {usedSeats} of {maxStaff} seat
                        {maxStaff !== 1 ? 's' : ''} used
                    </p>
                </header>

                {usedSeats < maxStaff && (
                    <section className="panel p-4" data-test="invite-form">
                        <h2 className="mb-3 text-h3">Invite a staff member</h2>
                        <Form action={storeStaff().url} method="post">
                            {({ errors }) => (
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                    <FormField
                                        label="Email address"
                                        error={errors.email}
                                        className="flex-1"
                                    >
                                        <Input
                                            type="email"
                                            name="email"
                                            placeholder="staff@example.com"
                                            autoComplete="off"
                                        />
                                    </FormField>
                                    <div className="shrink-0">
                                        <Button type="submit" size="sm">
                                            Send invitation
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </section>
                )}

                {staff.length === 0 ? (
                    <div className="panel p-8">
                        <EmptyState
                            icon={Users}
                            title="No staff members yet"
                            text="Invite someone by email to help manage your shop."
                        />
                    </div>
                ) : (
                    <>
                        {/* Table — lg+ */}
                        <div
                            className="panel hidden lg:block"
                            data-test="staff-table"
                        >
                            <table className="w-full text-body-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="p-4 font-medium text-muted-foreground">
                                            Email
                                        </th>
                                        <th className="p-4 font-medium text-muted-foreground">
                                            Name
                                        </th>
                                        <th className="p-4 font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="p-4 font-medium text-muted-foreground">
                                            Invited
                                        </th>
                                        <th className="p-4" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {staff.map((member) => (
                                        <tr
                                            key={member.id}
                                            className="border-b border-border last:border-0"
                                            data-test="staff-row"
                                        >
                                            <td className="p-4">
                                                {member.email}
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {member.name ?? '—'}
                                            </td>
                                            <td className="p-4">
                                                <Badge
                                                    variant={
                                                        member.status ===
                                                        'active'
                                                            ? 'success'
                                                            : 'neutral'
                                                    }
                                                >
                                                    {member.status}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-muted-foreground">
                                                {member.invited_at
                                                    ? new Date(
                                                          member.invited_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <Form
                                                    action={
                                                        destroyStaff({
                                                            staff: member.id,
                                                        }).url
                                                    }
                                                    method="delete"
                                                    onSubmit={(e) => {
                                                        if (
                                                            !confirm(
                                                                `Remove ${member.email} from your shop?`,
                                                            )
                                                        ) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                >
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        Remove
                                                    </Button>
                                                </Form>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Cards — sm/md */}
                        <ul
                            className="grid gap-3 lg:hidden"
                            data-test="staff-cards"
                        >
                            {staff.map((member) => (
                                <li
                                    key={member.id}
                                    className="panel p-4"
                                    data-test="staff-card"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="grid gap-0.5">
                                            <p className="text-label">
                                                {member.email}
                                            </p>
                                            {member.name && (
                                                <p className="text-body-sm text-muted-foreground">
                                                    {member.name}
                                                </p>
                                            )}
                                        </div>
                                        <Badge
                                            variant={
                                                member.status === 'active'
                                                    ? 'success'
                                                    : 'neutral'
                                            }
                                        >
                                            {member.status}
                                        </Badge>
                                    </div>
                                    {member.invited_at && (
                                        <p className="mt-2 text-caption text-muted-foreground">
                                            Invited{' '}
                                            {new Date(
                                                member.invited_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    )}
                                    <div className="mt-3">
                                        <Form
                                            action={
                                                destroyStaff({
                                                    staff: member.id,
                                                }).url
                                            }
                                            method="delete"
                                            onSubmit={(e) => {
                                                if (
                                                    !confirm(
                                                        `Remove ${member.email} from your shop?`,
                                                    )
                                                ) {
                                                    e.preventDefault();
                                                }
                                            }}
                                        >
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                size="sm"
                                            >
                                                Remove
                                            </Button>
                                        </Form>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </>
    );
}
