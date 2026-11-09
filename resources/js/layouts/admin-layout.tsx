import { type PropsWithChildren } from 'react';
import WorkspaceShell from '@/layouts/workspace-shell';

export default function AdminLayout({ children }: PropsWithChildren) {
    return <WorkspaceShell workspace="admin">{children}</WorkspaceShell>;
}
