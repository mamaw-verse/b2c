import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { ChatList } from '@/components/chat-list';
import { ChatThread } from '@/components/chat-thread';
import { ReportDialog } from '@/components/report-dialog';
import AppLayout from '@/layouts/app-layout';
import SellerLayout from '@/layouts/seller-layout';
import type { Conversation, Message } from '@/types/chat';
import { index as buyerChatIndex, show as buyerChatShow } from '@/routes/chat';
import { store as buyerMessageStore } from '@/routes/chat/messages';
import {
    index as sellerChatIndex,
    show as sellerChatShow,
} from '@/routes/seller/chat';
import { store as sellerMessageStore } from '@/routes/seller/chat/messages';

interface ChatPageProps {
    conversations: Conversation[];
    activeConversation?: Conversation | null;
    messages?: Message[];
    workspace: 'buyer' | 'seller';
}

export default function ChatPage({
    conversations,
    activeConversation = null,
    messages = [],
    workspace,
}: ChatPageProps) {
    const { auth, seller } = usePage().props as {
        auth: { user: { id: string; name: string } };
        seller?: { role?: 'owner' | 'staff' };
    };
    const Layout = workspace === 'seller' ? SellerLayout : AppLayout;
    const chatIndex = workspace === 'seller' ? sellerChatIndex : buyerChatIndex;
    const chatShow = workspace === 'seller' ? sellerChatShow : buyerChatShow;
    const messageStore =
        workspace === 'seller' ? sellerMessageStore : buyerMessageStore;
    const conversationUrl = (conversationId: string): string =>
        chatShow.url(conversationId);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(
        activeConversation,
    );
    const [threadMessages, setThreadMessages] = useState<Message[]>(messages);
    const [showReport, setShowReport] = useState<boolean>(false);

    // Keep thread in sync when activeConversation prop updates
    useEffect(() => {
        setSelectedConv(activeConversation);
        setThreadMessages(messages);
    }, [activeConversation, messages]);

    // Inertia v3 polling: poll every 5 seconds if a conversation is active
    useEffect(() => {
        if (!selectedConv) {
            return;
        }

        const interval = setInterval(() => {
            router.reload({
                only: ['messages', 'conversations', 'unreadCounts'],
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedConv]);

    const handleSelectConversation = (conv: Conversation) => {
        setSelectedConv(conv);
        router.visit(conversationUrl(conv.id), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleBackToList = () => {
        setSelectedConv(null);
        router.visit(chatIndex.url(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSendMessage = useCallback(
        (text: string) => {
            if (!selectedConv) {
                return;
            }

            // Optimistic bubble
            const optimisticId = `temp-${Date.now()}`;
            const optimisticMsg: Message = {
                id: optimisticId,
                conversation_id: selectedConv.id,
                sender_id: auth.user.id,
                sender_role: workspace === 'seller' ? 'seller' : 'buyer',
                type: 'text',
                body: text,
                product_id: null,
                order_id: null,
                read_at: null,
                created_at: new Date().toISOString(),
                sender:
                    workspace === 'seller'
                        ? {
                              id: auth.user.id,
                              name: auth.user.name,
                              is_staff: seller?.role === 'staff',
                          }
                        : null,
            };

            setThreadMessages((prev) => [...prev, optimisticMsg]);

            router.post(
                messageStore.url(selectedConv.id),
                { body: text, type: 'text' },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: () => {
                        setThreadMessages((prev) =>
                            prev.map((m) =>
                                m.id === optimisticId
                                    ? { ...m, failed: true }
                                    : m,
                            ),
                        );
                    },
                },
            );
        },
        [selectedConv, auth.user.id, messageStore, workspace],
    );

    const handleRetry = useCallback(
        (failedMessage: Message) => {
            if (!selectedConv || !failedMessage.body) {
                return;
            }

            setThreadMessages((prev) =>
                prev.filter((m) => m.id !== failedMessage.id),
            );
            handleSendMessage(failedMessage.body);
        },
        [selectedConv, handleSendMessage],
    );

    return (
        <Layout>
            <Head title="Chat" />
            <h1 className="sr-only">Chats</h1>

            <div className="flex h-[calc(100dvh-var(--header-h)-var(--tabbar-h)-env(safe-area-inset-top,0px))] overflow-hidden md:h-[calc(100dvh-var(--header-h)-env(safe-area-inset-top,0px))]">
                {/* Conversations list column: full screen on phone when no active convo, 320px sidebar on md+ */}
                <div
                    className={`h-full w-full md:block md:w-80 md:shrink-0 lg:w-[var(--chat-list-w,320px)] ${
                        selectedConv ? 'hidden md:block' : 'block'
                    }`}
                >
                    <ChatList
                        conversations={conversations}
                        activeId={selectedConv?.id}
                        conversationUrl={conversationUrl}
                        onSelect={handleSelectConversation}
                    />
                </div>

                {/* Thread view column */}
                <div
                    className={`h-full min-w-0 flex-1 ${
                        selectedConv ? 'flex' : 'hidden md:flex'
                    } flex-col`}
                >
                    {selectedConv ? (
                        <ChatThread
                            shop={selectedConv.shop}
                            messages={threadMessages}
                            currentUserId={auth.user?.id}
                            onBack={handleBackToList}
                            onSend={handleSendMessage}
                            onReport={() => setShowReport(true)}
                            onRetry={handleRetry}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center p-6 text-center text-muted-foreground">
                            <div>
                                <p className="text-h4 text-foreground">
                                    Select a conversation
                                </p>
                                <p className="mt-1 text-body">
                                    Choose a chat from the left or message a
                                    seller from any product page.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {selectedConv && (
                <ReportDialog
                    open={showReport}
                    onClose={() => setShowReport(false)}
                    targetType="shop"
                    targetId={selectedConv.shop.id}
                    targetTitle={`Report ${selectedConv.shop.name}`}
                />
            )}
        </Layout>
    );
}
