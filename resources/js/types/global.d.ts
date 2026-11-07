import type { Auth } from '@/types/auth';
import type { Marketplace } from '@/types/navigation';

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
            marketplace: Marketplace;
            [key: string]: unknown;
        };
    }
}
