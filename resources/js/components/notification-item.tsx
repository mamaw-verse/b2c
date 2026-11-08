import { Link } from '@inertiajs/react';
import { Package, Ticket, Truck } from 'lucide-react';
import type { MouseEventHandler } from 'react';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/types/chat';

export interface NotificationItemProps {
    notification: AppNotification;
    onClick?: MouseEventHandler<Element>;
    className?: string;
}

export function NotificationItem({
    notification,
    onClick,
    className,
}: NotificationItemProps) {
    const isUnread = notification.read_at === null;
    const type = notification.data.type ?? 'order';
    const href = notification.data.url ?? '#';

    const time = notification.created_at
        ? new Date(notification.created_at).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
          })
        : '';

    const renderIcon = () => {
        if (type === 'promo') {
            return (
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-promo-soft text-promo">
                    <Ticket aria-hidden="true" className="size-5" />
                </span>
            );
        }

        if (type === 'account') {
            return (
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                    <Package
                        aria-hidden="true"
                        className="size-5 stroke-[1.25]"
                    />
                </span>
            );
        }

        return (
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-info-soft text-info-text">
                <Truck aria-hidden="true" className="size-5" />
            </span>
        );
    };

    return (
        <li className={className}>
            <Link
                href={href}
                onClick={onClick}
                className={cn(
                    'relative flex gap-3 px-gutter py-3 transition-colors hover:bg-surface-subtle md:px-4',
                    isUnread ? 'bg-primary-soft' : 'bg-surface',
                )}
            >
                {renderIcon()}
                <span className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                    <span className="text-label">
                        {isUnread && <span className="sr-only">Unread: </span>}
                        {notification.data.title}
                    </span>
                    <span className="line-clamp-2 text-body-sm text-muted-foreground">
                        {notification.data.text}
                    </span>
                    {time && (
                        <time className="text-caption text-muted-foreground">
                            {time}
                        </time>
                    )}
                </span>
                {isUnread && (
                    <span
                        aria-hidden="true"
                        className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary"
                    />
                )}
            </Link>
        </li>
    );
}
