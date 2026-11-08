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
    support: { email: string | null; hours: string | null };
    registration: string | null;
    payments: string[];
    couriers: string[];
    nav: { sell: string | null; help: string | null };
    claims: { halal_verification: boolean };
    trust: { certificates: boolean; cold_chain: boolean; cod: boolean };
    socials: { label: string; icon: string; href: string }[];
    footer: Record<
        'shop' | 'support' | 'trust' | 'sell' | 'company',
        FooterLink[]
    >;
};
