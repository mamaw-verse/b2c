import { Head, router } from '@inertiajs/react';
import { CheckCheck } from 'lucide-react';
import type { MouseEvent } from 'react';
import { NotificationItem } from '@/components/notification-item';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import AppLayout from '@/layouts/app-layout';
import SellerLayout from '@/layouts/seller-layout';
import type { AppNotification } from '@/types/chat';

interface NotificationsPageProps {
    notifications: AppNotification[];
    workspace: 'buyer' | 'seller';
}

export default function NotificationsPage({
    notifications,
    workspace,
}: NotificationsPageProps) {
    const Layout = workspace === 'seller' ? SellerLayout : AppLayout;
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
        <Layout>
            <Head title="Notifications" />

            <div
                className={
                    workspace === 'seller'
                        ? 'mx-auto grid w-full max-w-container gap-4 p-gutter py-8 md:gap-6'
                        : 'grid gap-4 md:gap-6'
                }
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="mt-0.5 text-body text-muted-foreground">
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
        </Layout>
    );
}
