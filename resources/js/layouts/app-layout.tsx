import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import WorkspaceShell from '@/layouts/workspace-shell';
import type { WorkspaceKey } from '@/lib/workspaces';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({
    children,
}: PropsWithChildren<AppLayoutProps>) {
    const { unreadCounts, workspaces: allowed } =
        usePage<AppLayoutProps>().props;
    const { component } = usePage();

    // Admins get a single unified shell: account and settings pages render
    // inside the admin console instead of switching to the buyer workspace.
    const workspace: WorkspaceKey = (allowed ?? []).some(
        (w) => w.key === 'admin',
    )
        ? 'admin'
        : 'buyer';

    // The chat page consumes the whole content area; every other account
    // or settings page sits in the padded container column.
    if (component === 'chat') {
        return (
            <WorkspaceShell
                workspace={workspace}
                badges={{ chat: unreadCounts?.chat ?? 0 }}
            >
                {children}
            </WorkspaceShell>
        );
    }

    return (
        <WorkspaceShell
            workspace={workspace}
            badges={{ chat: unreadCounts?.chat ?? 0 }}
        >
            {/* Account/settings pages don't pad themselves — the shell's
                content column keeps them off the edges like before. */}
            <div className="mx-auto w-full max-w-container flex-1 p-gutter md:p-6 lg:p-8">
                {children}
            </div>
        </WorkspaceShell>
    );
}
