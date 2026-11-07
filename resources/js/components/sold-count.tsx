import { compactCount } from '@/lib/format';

export function SoldCount({ count }: { count: number }) {
    return <span className="tabular">{compactCount(count)} sold</span>;
}
