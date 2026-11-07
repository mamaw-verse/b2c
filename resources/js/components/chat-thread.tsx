import { Link } from '@inertiajs/react';
import { ArrowLeft, Flag, Store } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { ChatBubble } from '@/components/chat-bubble';
import { ChatOrderCard, ChatProductCard } from '@/components/chat-cards';
import { ChatComposer } from '@/components/chat-composer';
import { NameAvatar } from '@/components/name-avatar';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';
import { show as shopShow } from '@/routes/shops';
import type { ChatShop, Message } from '@/types/chat';

export interface ChatThreadProps {
    shop: ChatShop;
    messages: Message[];
    currentUserId?: string;
    onBack?: () => void;
    onSend: (text: string) => void;
    onReport?: () => void;
    onRetry?: (message: Message) => void;
    className?: string;
}

export function ChatThread({
    shop,
    messages,
    currentUserId,
    onBack,
    onSend,
    onReport,
    onRetry,
    className,
}: ChatThreadProps) {
    const listRef = useRef<HTMLOListElement>(null);

    // Scroll to bottom on load and whenever messages change
    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages.length]);

    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background',
                className,
            )}
        >
            {/* Thread Header */}
            <div className="flex items-center gap-2 border-b border-border bg-surface px-2 py-1.5 md:py-2">
                {onBack && (
                    <IconButton
                        icon={<ArrowLeft aria-hidden="true" />}
                        label="Back to chats"
                        className="md:hidden"
                        onClick={onBack}
                    />
                )}
                <div className="relative shrink-0">
                    <NameAvatar name={shop.name} size="sm" label={false} />
                    {shop.online !== false && (
                        <span
                            aria-hidden="true"
                            className="absolute right-0 bottom-0 size-2.5 rounded-full border border-surface bg-success"
                        />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-label">{shop.name}</p>
                    <p className="text-caption text-success">
                        {shop.online !== false ? 'Online' : 'Offline'}
                    </p>
                </div>
                <ButtonLink href={shopShow.url(shop.slug)} label="Visit shop">
                    <Store aria-hidden="true" className="size-5" />
                </ButtonLink>
                {onReport && (
                    <IconButton
                        icon={<Flag aria-hidden="true" />}
                        label="Report shop"
                        onClick={onReport}
                    />
                )}
            </div>

            {/* Messages Scroll View */}
            <div className="flex min-h-0 flex-1 flex-col">
                <ol
                    ref={listRef}
                    aria-label={`Messages with ${shop.name}`}
                    aria-live="polite"
                    className="flex flex-1 flex-col gap-3 overflow-y-auto px-gutter py-4"
                >
                    <li className="text-center">
                        <span className="rounded-full bg-surface-muted px-3 py-1 text-caption text-muted-foreground">
                            Today
                        </span>
                    </li>

                    {messages.map((m) => {
                        const isOut =
                            m.sender_role === 'buyer' ||
                            (currentUserId != null &&
                                m.sender_id === currentUserId);
                        const status = m.failed
                            ? 'failed'
                            : m.read_at
                              ? 'read'
                              : 'sent';
                        const time = m.created_at
                            ? new Date(m.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : undefined;

                        if (m.type === 'product' && m.product) {
                            return (
                                <ChatProductCard
                                    key={m.id}
                                    product={m.product}
                                    out={isOut}
                                />
                            );
                        }

                        if (m.type === 'order' && m.order) {
                            return (
                                <ChatOrderCard
                                    key={m.id}
                                    order={m.order}
                                    out={isOut}
                                />
                            );
                        }

                        if (m.type === 'system') {
                            return (
                                <li
                                    key={m.id}
                                    className="text-center text-caption text-muted-foreground"
                                >
                                    {m.body}
                                </li>
                            );
                        }

                        return (
                            <ChatBubble
                                key={m.id}
                                text={m.body ?? ''}
                                out={isOut}
                                status={status}
                                time={time}
                                onRetry={onRetry ? () => onRetry(m) : undefined}
                            />
                        );
                    })}

                    <li className="text-center text-caption text-muted-foreground">
                        Chats are monitored for your safety. Never pay outside
                        the app.
                    </li>
                </ol>

                {/* Composer */}
                <ChatComposer onSend={onSend} />
            </div>
        </div>
    );
}

function ButtonLink({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            aria-label={label}
            className="btn btn-icon btn-ghost text-foreground"
        >
            {children}
        </Link>
    );
}
