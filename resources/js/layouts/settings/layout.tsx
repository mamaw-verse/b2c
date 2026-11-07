import type { PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="space-y-8">
            <header className="grid gap-1">
                <h1 className="text-h1">Settings</h1>
                <p className="text-body text-muted-foreground">
                    Manage your profile and account settings
                </p>
            </header>
            <section className="grid max-w-2xl gap-10">{children}</section>
        </div>
    );
}
