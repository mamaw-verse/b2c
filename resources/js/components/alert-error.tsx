import { Banner } from '@/components/ui/alert';

export default function AlertError({
    errors,
    title,
}: {
    errors: string[];
    title?: string;
}) {
    return (
        <Banner tone="danger" title={title || 'Something went wrong'} live>
            <ul className="list-inside list-disc text-body-sm">
                {Array.from(new Set(errors)).map((error, index) => (
                    <li key={index}>{error}</li>
                ))}
            </ul>
        </Banner>
    );
}
