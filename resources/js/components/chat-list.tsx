import { Link } from '@inertiajs/react';
import { Package, Search } from 'lucide-react';
import { useState } from 'react';
import { NameAvatar } from '@/components/name-avatar';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/types/chat';

export interface ChatListProps {
    conversations: Conversation[];
    activeId?: string | null;
    onSelect?: (conversation: Conversation) => void;
    className?: string;
}

export function ChatList({
    conversations,
    activeId,
    onSelect,
    className,
}: ChatListProps) {
    const [search, setSearch] = useState('');

    const filtered = search.trim()
        ? conversations.filter((c) =>
              c.shop.name.toLowerCase().includes(search.toLowerCase()),
          )
        : conversations;

    return (
        <div
            className={cn(
                'flex h-full flex-col bg-surface md:border-r md:border-border',
                className,
            )}
        >
            <nav aria-label="Conversations" className="flex h-full flex-col">
                <div className="px-gutter py-2 md:px-3">
                    <label htmlFor="chat-search" className="sr-only">
                        Search chats
                    </label>
                    <div className="relative">
                        <Search
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <input
                            id="chat-search"
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search chats"
                            className="field rounded-search pl-10 text-input"
                        />
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center p-6 text-center">
                        <div>
                            <p className="text-h4">No chats yet</p>
                            <p className="mt-1 text-body text-muted-foreground">
                                Chat with a shop from any product page.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="flex-1 divide-y divide-border overflow-y-auto">
                        {filtered.map((c) => {
                            const isActive = c.id === activeId;
                            const unreadCount = c.unread_count ?? 0;
                            const isUnread = unreadCount > 0;
                            const latest = c.latest_message;
                            const timeText = latest?.created_at
                                ? new Date(
                                      latest.created_at,
                                  ).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                  })
                                : '';

                            const previewText = latest
                                ? latest.type === 'product'
                                    ? 'Sent a product'
                                    : latest.type === 'order'
                                      ? 'Sent an order'
                                      : (latest.body ?? '')
                                : 'No messages yet';

                            return (
                                <li key={c.id}>
                                    <Link
                                        href={`/chat/${c.id}`}
                                        preserveState
                                        preserveScroll
                                        onClick={(e) => {
                                            if (onSelect) {
                                                e.preventDefault();
                                                onSelect(c);
                                            }
                                        }}
                                        aria-current={
                                            isActive ? 'true' : undefined
                                        }
                                        className={cn(
                                            'flex min-h-16 items-center gap-3 px-gutter py-2 transition-colors hover:bg-surface-subtle aria-[current=true]:bg-primary-soft md:px-3',
                                        )}
                                    >
                                        <div className="relative shrink-0">
                                            <NameAvatar
                                                name={c.shop.name}
                                                size="md"
                                                label={false}
                                            />
                                            {c.shop.online !== false && (
                                                <>
                                                    <span
                                                        aria-hidden="true"
                                                        className="absolute right-0 bottom-0 size-3 rounded-full border-2 border-surface bg-success"
                                                    />
                                                    <span className="sr-only">
                                                        , online
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                        <span className="grid min-w-0 flex-1 grid-cols-1 gap-0.5">
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className="truncate text-label">
                                                    {c.shop.name}
                                                </span>
                                                {timeText && (
                                                    <time className="shrink-0 text-caption text-muted-foreground">
                                                        {timeText}
                                                    </time>
                                                )}
                                            </span>
                                            <span className="flex items-center justify-between gap-2">
                                                <span
                                                    className={cn(
                                                        'truncate text-body-sm',
                                                        isUnread
                                                            ? 'font-bold text-foreground'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {latest?.type ===
                                                        'product' && (
                                                        <Package
                                                            aria-hidden="true"
                                                            className="mr-1 inline size-3.5 align-[-0.15em]"
                                                        />
                                                    )}
                                                    {previewText}
                                                </span>
                                                {isUnread && (
                                                    <span
                                                        aria-hidden="true"
                                                        className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-caption leading-5 text-primary-foreground"
                                                    >
                                                        {unreadCount}
                                                        <span className="sr-only">
                                                            {' '}
                                                            unread
                                                        </span>
                                                    </span>
                                                )}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </nav>
        </div>
    );
}
