import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/** Custom type-scale tokens (text-body, text-price, …) would otherwise be
   misclassified as text colours and dropped when a colour class follows. */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            'font-size': [
                {
                    text: [
                        'display',
                        'h1',
                        'h2',
                        'h3',
                        'h4',
                        'body-lg',
                        'body',
                        'body-sm',
                        'caption',
                        'label',
                        'price',
                        'price-lg',
                        'eyebrow',
                        'th',
                        'input',
                    ],
                },
            ],
        },
    },
});

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}
