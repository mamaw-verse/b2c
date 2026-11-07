import { Plus, Send } from 'lucide-react';
import { type KeyboardEvent, useRef, useState } from 'react';
import { IconButton } from '@/components/ui/icon-button';
import { cn } from '@/lib/utils';

export interface ChatComposerProps {
    onSend: (message: string) => void;
    onAttach?: () => void;
    disabled?: boolean;
    disabledNotice?: string;
    placeholder?: string;
    className?: string;
}

export function ChatComposer({
    onSend,
    onAttach,
    disabled = false,
    disabledNotice = 'You can’t reply to this chat.',
    placeholder = 'Type a message',
    className,
}: ChatComposerProps) {
    const [text, setText] = useState('');
    const [liveText, setLiveText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    if (disabled) {
        return (
            <div
                className={cn(
                    'border-t border-border bg-surface p-3',
                    className,
                )}
            >
                <p className="text-body text-muted-foreground">
                    {disabledNotice}
                </p>
            </div>
        );
    }

    const handleInput = () => {
        const el = textareaRef.current;
        if (!el) {
            return;
        }
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed) {
            return;
        }
        onSend(trimmed);
        setText('');
        setLiveText('Message sent');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Prevent sending during IME composition (for Taglish / Filipino virtual keyboards)
        if (e.nativeEvent.isComposing) {
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                handleSend();
            }}
            className={cn(
                'flex items-end gap-1 border-t border-border bg-surface px-2 pt-2 pb-[calc(.5rem+env(safe-area-inset-bottom,0px))]',
                className,
            )}
        >
            {onAttach && (
                <IconButton
                    icon={<Plus aria-hidden="true" />}
                    label="Attach photo, product or order"
                    onClick={onAttach}
                />
            )}
            <label htmlFor="chat-composer-input" className="sr-only">
                Message
            </label>
            <textarea
                id="chat-composer-input"
                ref={textareaRef}
                rows={1}
                value={text}
                onChange={(e) => {
                    setText(e.target.value);
                    handleInput();
                }}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                enterKeyHint="send"
                className="field max-h-40 min-h-touch flex-1 resize-none rounded-search py-2.5 text-input"
            />
            <button
                type="submit"
                aria-label="Send"
                className="btn btn-icon rounded-full"
            >
                <Send aria-hidden="true" className="size-5" />
            </button>
            <p className="sr-only" aria-live="polite">
                {liveText}
            </p>
        </form>
    );
}
