import { Form, Head } from '@inertiajs/react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    destroy as declineRoute,
    update as acceptRoute,
} from '@/routes/staff-invitations';

type Invitation = {
    id: string;
    shop_name: string;
    email: string;
    invited_at: string | null;
};

type PageProps = {
    invitation: Invitation;
};

export default function StaffInvitation({ invitation }: PageProps) {
    return (
        <>
            <Head title={`Join ${invitation.shop_name}`} />

            <div className="grid gap-6">
                <header>
                    <h1 className="text-h1">Shop staff invitation</h1>
                    <p className="mt-0.5 text-body text-muted-foreground">
                        You have been invited to join{' '}
                        <strong>{invitation.shop_name}</strong> as a staff
                        member.
                    </p>
                </header>

                <section className="panel p-4 md:p-6">
                    <h2 className="mb-4 text-h3">What staff can do</h2>
                    <ul className="grid gap-2 text-body-sm">
                        {[
                            'View and manage orders',
                            'Create and edit products',
                            'Manage fulfillments and returns',
                            'Chat with customers',
                            'View customer list',
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-2">
                                <CheckCircle className="size-4 shrink-0 text-success" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="panel p-4 md:p-6">
                    <h2 className="mb-4 text-h3">What staff cannot do</h2>
                    <ul className="grid gap-2 text-body-sm">
                        {[
                            'Access finance and payouts',
                            'Change shop settings',
                            'Manage vouchers',
                            'Invite or remove other staff',
                            'Change affiliate settings on products',
                        ].map((item) => (
                            <li key={item} className="flex items-center gap-2">
                                <XCircle className="text-destructive size-4 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <Form
                        action={
                            acceptRoute({ staffInvitation: invitation.id }).url
                        }
                        method="put"
                    >
                        <Button type="submit" className="w-full sm:w-auto">
                            Accept invitation
                        </Button>
                    </Form>

                    <Form
                        action={
                            declineRoute({
                                staffInvitation: invitation.id,
                            }).url
                        }
                        method="delete"
                        onSubmit={(e) => {
                            if (
                                !confirm(
                                    'Are you sure you want to decline this invitation?',
                                )
                            ) {
                                e.preventDefault();
                            }
                        }}
                    >
                        <Button
                            type="submit"
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            Decline
                        </Button>
                    </Form>
                </div>
            </div>
        </>
    );
}

StaffInvitation.layout = {
    breadcrumbs: [
        {
            title: 'Account',
            href: '/account',
        },
        {
            title: 'Staff invitation',
            href: '/account',
        },
    ],
};
