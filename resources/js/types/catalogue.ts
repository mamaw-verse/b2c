export type HalalStatus =
    | 'certified'
    | 'review'
    | 'expiring'
    | 'expired'
    | 'missing'
    | 'na';

export type HandlingTemp = 'frozen' | 'chilled';

export type ProductCardData = {
    id: string;
    slug: string;
    name: string;
    price: number;
    was_price: number | null;
    rating: number;
    sold_count: number;
    location: string;
    free_shipping: boolean;
    frozen: boolean;
    temperature?: HandlingTemp | null;
    requires_certification: boolean;
    in_stock?: boolean;
    halal_status: HalalStatus;
    certifier: string | null;
    image_url?: string | null;
    icon: string;
};

export type ShopData = {
    id: string;
    name: string;
    slug: string;
    location: string;
    rating: number;
    followers_count: number;
    chat_response_rate: number | null;
    verification: string | null;
    halal_only: boolean;
    logo_url?: string | null;
    banner_url?: string | null;
    products_count?: number;
    is_following?: boolean;
};

export type Product = ProductCardData;

export type CategoryData = {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    parent?: { name: string; slug: string } | null;
    children?: { id: string; name: string; slug: string }[];
};

export type ProductVariation = {
    id: string;
    option1_value: string;
    option2_value: string | null;
    price: number | null;
    was_price?: number | null;
    stock: number;
};

export type HalalCertificationData = {
    certifying_body: string;
    number: string;
    scope: string | null;
    document_path?: string | null;
    valid_until: string;
    checked_at: string | null;
    status: 'certified' | 'expiring' | 'expired';
};

export type ProductDetail = ProductCardData & {
    description: string | null;
    stock: number;
    in_stock: boolean;
    review_count: number;
    ships_from: string;
    images: { url: string | null; icon: string }[];
    video?: { url: string; duration: number | null } | null;
    option1_name: string | null;
    option2_name: string | null;
    variations: ProductVariation[];
    certification: HalalCertificationData | null;
    category: { name: string; slug: string };
    shop: ShopData;
};

export type CursorPage<T> = {
    data: T[];
    next_cursor: string | null;
    next_page_url: string | null;
    prev_cursor: string | null;
    prev_page_url: string | null;
};
