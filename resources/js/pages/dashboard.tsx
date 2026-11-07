import { Head, Link, usePage } from '@inertiajs/react';
import { LockKeyhole, Palette, UserRound } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { dashboard } from '@/routes';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import type { Auth } from '@/types';

const accountLinks = [
    {
        title: 'Profile',
        description: 'Update your name and email address.',
        href: editProfile(),
        icon: UserRound,
    },
    {
        title: 'Security',
        description:
            'Manage your password, two-factor authentication and passkeys.',
        href: editSecurity(),
        icon: LockKeyhole,
    },
    {
        title: 'Appearance',
        description: 'Choose how the marketplace looks on this device.',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function Dashboard() {
    const { auth, name } = usePage<{ auth: Auth; name: string }>().props;

    return (
        <>
            <Head title="Account home" />
            <div className="grid gap-6">
                <section className="panel p-4 md:p-6">
                    <div className="flex items-center gap-4">
                        <BrandMark name={name} showName={false} />
                        <div>
                            <h1 className="text-h1">Account home</h1>
                            <p className="mt-1 text-body text-muted-foreground">
                                Signed in as {auth.user.name} ·{' '}
                                {auth.user.email}
                            </p>
                        </div>
                    </div>
                </section>

                <section
                    className="grid gap-4 md:grid-cols-3"
                    aria-label="Account shortcuts"
                >
                    {accountLinks.map((item) => {
                        const Icon = item.icon;

                        return (
                            <Link key={item.title} href={item.href} prefetch>
                                <Card interactive className="h-full gap-3 p-4">
                                    <CardHeader className="p-0">
                                        <span className="grid size-10 place-items-center rounded-tile bg-primary-soft text-primary">
                                            <Icon
                                                className="size-5"
                                                aria-hidden="true"
                                            />
                                        </span>
                                        <CardTitle>{item.title}</CardTitle>
                                        <CardDescription>
                                            {item.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="sr-only p-0">
                                        Open {item.title} settings
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </section>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Account home',
            href: dashboard(),
        },
    ],
};
