import { Banner } from '@/components/ui/alert';

/** Cold-chain note for frozen halal items. Persistent, inline. */
export function ColdChainNote({ className }: { className?: string }) {
    return (
        <Banner tone="info" title="Ships frozen" className={className}>
            Packed with ice packs. Delivery is limited to areas with cold-chain
            coverage; check your address at checkout.
        </Banner>
    );
}
