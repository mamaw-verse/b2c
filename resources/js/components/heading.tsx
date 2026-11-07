export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header
            className={variant === 'small' ? 'grid gap-1' : 'mb-8 grid gap-1'}
        >
            <h2 className={variant === 'small' ? 'text-h4' : 'text-h2'}>
                {title}
            </h2>
            {description && (
                <p className="text-body-sm text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}
