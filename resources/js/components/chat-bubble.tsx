import { AlertCircle, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatBubbleProps {
    text: string;
    out?: boolean;
    status?: 'sent' | 'read' | 'failed';
    time?: string;
    senderPrefix?: string;
    onRetry?: () => void;
    className?: string;
}

export function ChatBubble({
    text,
    out = false,
    status = 'sent',
    time,
    senderPrefix,
    onRetry,
    className,
}: ChatBubbleProps) {
    const defaultPrefix = out ? 'You, ' : 'Seller, ';
    const prefix = senderPrefix ?? defaultPrefix;
    const isFailed = status === 'failed';

    return (
        <li
            className={cn(
                'flex',
                out ? 'justify-end' : 'justify-start',
                className,
            )}
        >
            <div
                className={cn(
                    'grid max-w-[80%] gap-1',
                    out && 'justify-items-end',
                )}
            >
                <p
                    data-ds-bubble-text
                    className={cn(
                        'rounded-panel px-3 py-2 text-body whitespace-pre-wrap',
                        out
                            ? 'rounded-br-badge bg-primary text-primary-foreground'
                            : 'rounded-bl-badge border border-border bg-surface text-foreground',
                    )}
                >
                    {text}
                </p>
                <div
                    className={cn(
                        'flex items-center gap-1 text-caption',
                        isFailed ? 'text-danger-text' : 'text-muted-foreground',
                    )}
                >
                    <span className="sr-only">{prefix}</span>
                    {time && <time>{time}</time>}

                    {out && !isFailed && (
                        <>
                            {status === 'read' ? (
                                <>
                                    <CheckCheck
                                        aria-hidden="true"
                                        className="size-3.5 text-primary-text"
                                    />
                                    <span>Read</span>
                                </>
                            ) : (
                                <>
                                    <Check
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                    <span>Sent</span>
                                </>
                            )}
                        </>
                    )}

                    {out && isFailed && (
                        <>
                            <AlertCircle
                                aria-hidden="true"
                                className="size-3.5"
                            />
                            <span>Not sent · </span>
                            {onRetry && (
                                <button
                                    type="button"
                                    onClick={onRetry}
                                    className="inline-flex min-h-touch min-w-touch items-center justify-center font-bold underline"
                                >
                                    Retry
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </li>
    );
}
