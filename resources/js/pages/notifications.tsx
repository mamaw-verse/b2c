import { Head, router } from '@inertiajs/react';
import { CheckCheck } from 'lucide-react';
import type { MouseEvent } from 'react';
import { NotificationItem } from '@/components/notification-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import PublicLayout from '@/layouts/public-layout';
import type { AppNotification } from '@/types/chat';

interface NotificationsPageProps {
    notifications: AppNotification[];
}

export default function NotificationsPage({
    notifications,
}: NotificationsPageProps) {
    const unreadCount = notifications.filter((n) => n.read_at === null).length;

    const handleMarkAllRead = () => {
        router.post(
            '/notifications/read',
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const handleItemClick = (
        n: AppNotification,
        event: MouseEvent<Element>,
    ) => {
        if (n.read_at !== null) {
            return;
        }

        // The link's own visit would cancel this POST, so mark read first and
        // navigate to the notification target on success.
        event.preventDefault();
        router.post(
            '/notifications/read',
            { id: n.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    const href = n.data.url ?? '#';
                    if (href !== '#') {
                        router.visit(href);
                    }
                },
            },
        );
    };

    return (
        <PublicLayout activeTab="Notifications">
            <Head title="Notifications" />

            <div className="mx-auto max-w-2xl py-6 pb-24 md:pb-12">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-h2">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-body-sm text-muted-foreground">
                                {unreadCount} unread
                            </p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleMarkAllRead}
                        >
                            <CheckCheck aria-hidden="true" className="mr-1" />
                            <span>Mark all as read</span>
                        </Button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <EmptyState
                        title="You’re all caught up"
                        text="Order updates, promos, and account activity will appear here."
                    />
                ) : (
                    <ul className="divide-y divide-border overflow-hidden rounded-panel border border-border bg-surface">
                        {notifications.map((n) => (
                            <NotificationItem
                                key={n.id}
                                notification={n}
                                onClick={(e) => handleItemClick(n, e)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </PublicLayout>
    );
}
