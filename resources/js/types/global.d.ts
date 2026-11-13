import type { Auth } from '@/types/auth';
import type { Marketplace, SharedWorkspace } from '@/types/navigation';

declare module 'react' {
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            brand: string;
            auth: Auth;
            sidebarOpen: boolean;
            navCategories: { id: string; name: string; slug: string }[];
            searchSuggestions?: string[];
            unreadCounts?: { chat: number; notifications: number } | null;
            pendingQueueCount?: number;
            cartCount?: number;
            workspaces?: SharedWorkspace[];
            seller?: {
                status:
                    | 'pending'
                    | 'approved'
                    | 'rejected'
                    | 'changes_requested';
                suspended: boolean;
                shop_name: string;
                shop_id: string;
                shop_slug: string;
            } | null;
            marketplace: Marketplace;
            [key: string]: unknown;
        };
    }
}
