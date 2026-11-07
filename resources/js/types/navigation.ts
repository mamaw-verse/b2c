import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
};

export type FooterLink = {
    label: string;
    href: string;
};

export type Marketplace = {
    tagline: string;
    support: { email: string; hours: string };
    registration: string;
    payments: string[];
    couriers: string[];
    socials: { label: string; icon: string; href: string }[];
    footer: Record<
        'shop' | 'support' | 'trust' | 'sell' | 'company',
        FooterLink[]
    >;
};
