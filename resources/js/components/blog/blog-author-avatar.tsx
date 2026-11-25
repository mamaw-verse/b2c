import { NameAvatar } from '@/components/name-avatar';
import type { BlogAvatarData } from '@/types/blog';

/** Author photo, or initials when they have none. Decorative: the name always sits beside it. */
export function BlogAuthorAvatar({
    name,
    avatar,
    size = 'md',
}: {
    name: string;
    avatar?: BlogAvatarData | null;
    size?: 'md' | 'lg' | 'xl';
}) {
    if (!avatar) {
        return <NameAvatar name={name} size={size} label={false} />;
    }

    const dimension = { md: 'size-10', lg: 'size-14', xl: 'size-20' }[size];

    return (
        <img
            src={avatar.src}
            width={avatar.width}
            height={avatar.height}
            alt=""
            loading="lazy"
            decoding="async"
            className={`${dimension} shrink-0 rounded-full object-cover`}
        />
    );
}
