import { Link, usePage } from '@inertiajs/react';
import { BrandMark } from '@/components/brand-mark';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthLayout({
    title = '',
    description = '',
    children,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <>
            <a
                href="#main"
                className="fixed top-2 left-2 z-toast flex min-h-touch -translate-y-24 items-center rounded-button bg-primary px-4 text-label text-primary-foreground focus:translate-y-0"
            >
                Skip to content
            </a>
            <main
                id="main"
                data-shell="auth"
                className="grid min-h-dvh place-items-center bg-background px-gutter py-10 text-foreground"
            >
                <div className="w-full max-w-sm">
                    <Link
                        href={home()}
                        className="mb-6 flex min-h-touch items-center justify-center"
                        aria-label={`${name} home`}
                    >
                        <BrandMark name={name} />
                    </Link>
                    <div className="card p-5 md:p-6">
                        <div className="mb-5 grid gap-1 text-center">
                            <h1 className="text-h2">{title}</h1>
                            {description && (
                                <p className="text-body-sm text-muted-foreground">
                                    {description}
                                </p>
                            )}
                        </div>
                        {children}
                    </div>
                </div>
            </main>
        </>
    );
}
