import { Head, router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { ChatList } from '@/components/chat-list';
import { ChatThread } from '@/components/chat-thread';
import { ReportDialog } from '@/components/report-dialog';
import AppLayout from '@/layouts/app-layout';
import SellerLayout from '@/layouts/seller-layout';
import type { Conversation, Message } from '@/types/chat';

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
    const { auth } = usePage().props;
    const Layout = workspace === 'seller' ? SellerLayout : AppLayout;
    const chatBase = workspace === 'seller' ? '/seller/chat' : '/account/chat';
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
        router.visit(`${chatBase}/${conv.id}`, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleBackToList = () => {
        setSelectedConv(null);
        router.visit(chatBase, {
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
            };

            setThreadMessages((prev) => [...prev, optimisticMsg]);

            router.post(
                `${chatBase}/${selectedConv.id}/messages`,
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
        [selectedConv, auth.user.id, chatBase, workspace],
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
