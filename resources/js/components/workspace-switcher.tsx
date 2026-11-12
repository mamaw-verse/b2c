import { Link, usePage } from '@inertiajs/react';
import { Check, Shield, ShoppingBag, Store } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
    workspaces as workspaceConfig,
    type WorkspaceKey,
} from '@/lib/workspaces';
import {
    register as sellerRegister,
    suspended as sellerSuspended,
} from '@/routes/seller';
import type { SharedWorkspace, WorkspaceEntry } from '@/types/navigation';

const entryIcons: Record<WorkspaceKey, LucideIcon> = {
    buyer: ShoppingBag,
    seller: Store,
    admin: Shield,
};

/**
 * The entries a user sees in the workspace switcher. The shared `workspaces`
 * prop lists the workspaces they may enter; the shared `seller` prop adds
 * the application states (pending, rejected, suspended) so the seller entry
 * always renders with the right label and destination.
 */
export function useWorkspaceEntries(): WorkspaceEntry[] {
    const { workspaces, seller } = usePage<{
        workspaces?: SharedWorkspace[];
        seller?: {
            status: string;
            suspended: boolean;
            shop_name: string;
        } | null;
    }>().props;

    const allowed = new Set((workspaces ?? []).map((w) => w.key));
    const current = (workspaces ?? []).find((w) => w.current)?.key ?? 'buyer';

    // Admins get a single unified shell — no buyer or seller links at all.
    if (allowed.has('admin') && !allowed.has('buyer')) {
        return [
            {
                key: 'admin',
                label: 'Admin',
                href: workspaceConfig.admin.home,
                icon: entryIcons.admin,
                current: current === 'admin',
            },
        ];
    }

    const entries: WorkspaceEntry[] = [
        {
            key: 'buyer',
            label: 'Buyer account',
            href: workspaceConfig.buyer.home,
            icon: entryIcons.buyer,
            current: current === 'buyer',
        },
    ];

    let sellerEntry: WorkspaceEntry;
    if (seller === null || seller === undefined) {
        sellerEntry = {
            key: 'seller',
            label: 'Start selling',
            href: sellerRegister().url,
            icon: entryIcons.seller,
            current: false,
        };
    } else if (seller.status === 'approved' && !seller.suspended) {
        sellerEntry = {
            key: 'seller',
            label: 'Seller Centre',
            href: workspaceConfig.seller.home,
            icon: entryIcons.seller,
            current: current === 'seller',
        };
    } else if (seller.status === 'approved' && seller.suspended) {
        sellerEntry = {
            key: 'seller',
            label: 'Seller Centre',
            note: 'Suspended',
            href: sellerSuspended().url,
            icon: entryIcons.seller,
            current: current === 'seller',
        };
    } else {
        sellerEntry = {
            key: 'seller',
            label: 'Start selling',
            note:
                seller.status === 'pending'
                    ? 'Application pending'
                    : seller.status === 'changes_requested'
                      ? 'Changes requested'
                      : 'Application rejected',
            href: sellerRegister().url,
            icon: entryIcons.seller,
            current: current === 'seller',
        };
    }
    entries.push(sellerEntry);

    if (allowed.has('admin')) {
        entries.push({
            key: 'admin',
            label: 'Admin',
            href: workspaceConfig.admin.home,
            icon: entryIcons.admin,
            current: current === 'admin',
        });
    }

    return entries;
}

/** Entries rendered as dropdown-menu items (user menus in every shell). */
export function WorkspaceSwitcherMenuItems() {
    const entries = useWorkspaceEntries();

    return (
        <>
            {entries.map((entry) => {
                const Icon = entry.icon;
                return (
                    <DropdownMenuItem asChild key={entry.key}>
                        <Link
                            href={entry.href}
                            aria-current={entry.current ? 'page' : undefined}
                        >
                            <Icon aria-hidden="true" />
                            <span className="flex-1 truncate">
                                {entry.label}
                                {entry.note && (
                                    <span className="block text-caption text-muted-foreground">
                                        {entry.note}
                                    </span>
                                )}
                            </span>
                            {entry.current && (
                                <Check aria-hidden="true" className="size-4" />
                            )}
                        </Link>
                    </DropdownMenuItem>
                );
            })}
        </>
    );
}

/** Entries rendered as a plain nav list (mobile drawers). */
export function WorkspaceSwitcherList({
    onNavigate,
}: {
    onNavigate?: () => void;
}) {
    const entries = useWorkspaceEntries();

    return (
        <ul className="grid gap-0.5">
            {entries.map((entry) => {
                const Icon = entry.icon;
                return (
                    <li key={entry.key}>
                        <Link
                            href={entry.href}
                            onClick={onNavigate}
                            aria-current={entry.current ? 'page' : undefined}
                            className={cn(
                                'flex min-h-touch items-center gap-3 rounded-button px-3 text-label',
                                entry.current
                                    ? 'bg-primary-soft text-primary-soft-foreground'
                                    : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                            )}
                        >
                            <Icon className="icon" aria-hidden="true" />
                            <span className="flex-1 truncate">
                                {entry.label}
                                {entry.note && (
                                    <span className="block text-caption text-muted-foreground">
                                        {entry.note}
                                    </span>
                                )}
                            </span>
                            {entry.current && (
                                <Check aria-hidden="true" className="size-4" />
                            )}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
