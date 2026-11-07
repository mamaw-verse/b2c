import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useAppearance } from '@/hooks/use-appearance';
import { useFlashToast } from '@/hooks/use-flash-toast';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            position="bottom-right"
            visibleToasts={1}
            gap={8}
            className="toaster group"
            toastOptions={{
                className:
                    'on-inverse rounded-panel border-0 bg-surface-inverse text-body text-foreground-inverse shadow-popover',
            }}
            style={
                {
                    '--normal-bg': 'var(--surface-inverse)',
                    '--normal-text': 'var(--foreground-inverse)',
                    '--normal-border': 'transparent',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
