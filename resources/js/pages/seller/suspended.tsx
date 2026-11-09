import { Head, Link } from '@inertiajs/react';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { home as accountHome } from '@/routes/account';

type SuspendedShopProps = {
    shop: { name: string; status: string };
    supportEmail: string | null;
};

export default function SellerSuspended({
    shop,
    supportEmail,
}: SuspendedShopProps) {
    return (
        <>
            <Head title="Shop suspended" />
            <div>
                <section className="panel grid justify-items-center gap-3 p-6 text-center md:p-10">
                    <span className="grid size-12 place-items-center rounded-tile bg-danger-soft text-danger-text">
                        <ShieldAlert className="size-6" aria-hidden="true" />
                    </span>
                    <h1 className="text-h2">{shop.name} is suspended</h1>
                    <p className="max-w-md text-body text-muted-foreground">
                        Your shop has been suspended by the moderation team.
                        Selling is paused while the suspension is in place —
                        your products, orders and settings are read-only.
                    </p>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {supportEmail && (
                            <Button asChild>
                                <a href={`mailto:${supportEmail}`}>
                                    Contact support
                                </a>
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={accountHome()}>Back to my account</Link>
                        </Button>
                    </div>
                </section>
            </div>
        </>
    );
}
