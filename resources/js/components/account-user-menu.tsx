import { Link, router, usePage } from '@inertiajs/react';
import { ChevronsUpDown, LogOut, Settings } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkspaceSwitcherMenuItems } from '@/components/workspace-switcher';
import { useInitials } from '@/hooks/use-initials';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';

export function AccountUserMenu() {
    const { auth } = usePage().props;
    const initials = useInitials();

    if (!auth.user) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex min-h-touch items-center gap-2 rounded-button px-2 text-label hover:bg-surface-muted">
                <Avatar size="sm">
                    <AvatarFallback>{initials(auth.user.name)}</AvatarFallback>
                </Avatar>
                <span className="hidden lg:inline">{auth.user.name}</span>
                <ChevronsUpDown className="size-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                    <span className="block text-label">{auth.user.name}</span>
                    <span className="block text-caption normal-case">
                        {auth.user.email}
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <WorkspaceSwitcherMenuItems />
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href={edit()} prefetch>
                            <Settings aria-hidden="true" />
                            Account settings
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link
                        href={logout()}
                        as="button"
                        onClick={() => router.flushAll()}
                        data-test="logout-button"
                    >
                        <LogOut aria-hidden="true" />
                        Log out
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
