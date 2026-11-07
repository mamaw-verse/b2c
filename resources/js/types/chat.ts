import type { Product } from '@/types/catalogue';

export interface ChatShop {
    id: string;
    name: string;
    slug: string;
    rating?: number;
    halal_only?: boolean;
    online?: boolean;
}

export interface ChatOrderSummary {
    id: string;
    status: string;
    total: number;
    items_count?: number;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string | null;
    sender_role: 'buyer' | 'seller' | 'system';
    type: 'text' | 'product' | 'order' | 'system';
    body: string | null;
    product_id: string | null;
    order_id: string | null;
    read_at: string | null;
    created_at: string;
    product?: Product | null;
    order?: ChatOrderSummary | null;
    failed?: boolean;
}

export interface Conversation {
    id: string;
    user_id: string;
    shop_id: string;
    last_message_at: string | null;
    unread_count?: number;
    shop: ChatShop;
    latest_message?: Message | null;
}

export interface AppNotification {
    id: string;
    type: string;
    data: {
        type?: 'order' | 'promo' | 'account';
        order_id?: string;
        title: string;
        text: string;
        url?: string;
    };
    read_at: string | null;
    created_at: string;
}
