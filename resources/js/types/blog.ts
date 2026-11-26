import type { ProductCardData } from '@/types/catalogue';

export type BlogImageData = {
    src: string;
    srcset: string | null;
    width: number;
    height: number;
    alt: string;
};

export type BlogAvatarData = {
    src: string;
    width: number;
    height: number;
};

export type BlogCardData = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    published_at: string | null;
    reading_minutes: number;
    category: { name: string; slug: string } | null;
    image: BlogImageData | null;
};

export type BlogPageMeta = {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

export type BlogPaged<T> = { data: T[]; meta: BlogPageMeta };

export type BlogCategoryChip = { name: string; slug: string };

export type BlogTocItem = { id: string; text: string; level: number };

export type BlogLink = { label: string; url: string };

/** Author as shown on a post: the house author has no profile, bio or avatar. */
export type BlogPostAuthor = {
    name: string;
    slug?: string;
    job_title?: string | null;
    bio?: string | null;
    avatar?: BlogAvatarData | null;
    links?: BlogLink[];
    is_house: boolean;
    has_profile: boolean;
};

/**
 * One run of a post body, in reading order. `html` runs come from `RenderBlogBody` (trusted);
 * `product` runs are live catalogue cards for `[[product:slug]]` embeds.
 */
export type BlogBodySegment =
    | { type: 'html'; html: string }
    | { type: 'product'; product: ProductCardData };
