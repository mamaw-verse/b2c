import { useId } from 'react';
import { DsIcon } from '@/components/ds-icon';
import { formatPeso } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface SalesChartProps {
    data: [string, number][];
    title?: string;
    period?: string;
    onPeriodChange?: (period: string) => void;
    noun?: string;
    className?: string;
}

export function SalesChart({
    data,
    title = 'Sales, last 7 days',
    period = '7D',
    onPeriodChange,
    noun = 'Sales',
    className,
}: SalesChartProps) {
    const id = useId();
    const values = data.map((d) => d[1]);
    const max = Math.max(...values, 1);
    const total = values.reduce((acc, v) => acc + v, 0);
    const bestItem = data.find((d) => d[1] === max);
    const bestDay = bestItem ? bestItem[0] : '';
    const W = 100 / Math.max(data.length, 1);

    const descText = `Bar chart. ${data.map(([d, v]) => `${d} ${formatPeso(v)}`).join(', ')}.`;

    return (
        <section
            className={cn('panel p-4', className)}
            aria-labelledby={`${id}-t`}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <h2 id={`${id}-t`} className="text-h4">
                        {title}
                    </h2>
                    <p className="text-body-sm text-muted-foreground">
                        Total{' '}
                        <span className="tabular font-bold text-foreground">
                            {formatPeso(total)}
                        </span>
                        {bestDay ? ` · best day ${bestDay}` : ''}
                    </p>
                </div>
                {onPeriodChange && (
                    <fieldset className="inline-flex rounded-button bg-surface-muted p-1">
                        <legend className="sr-only">Period</legend>
                        {['7D', '30D', '90D'].map((p) => {
                            const isChecked = period === p;
                            return (
                                <label
                                    key={p}
                                    className={cn(
                                        'relative flex min-h-9 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-button px-3 text-label whitespace-nowrap text-muted-foreground after:absolute after:-inset-y-1 hover:text-foreground',
                                        isChecked &&
                                            'bg-surface text-foreground shadow-card-hover',
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name={`${id}-period`}
                                        value={p}
                                        checked={isChecked}
                                        onChange={() => onPeriodChange(p)}
                                        className="sr-only"
                                    />
                                    <span>{p}</span>
                                </label>
                            );
                        })}
                    </fieldset>
                )}
            </div>

            <figure className="mt-4">
                <svg
                    viewBox="0 0 100 52"
                    className="h-48 w-full md:h-56"
                    role="img"
                    aria-labelledby={`${id}-t ${id}-d`}
                    preserveAspectRatio="none"
                >
                    <desc id={`${id}-d`}>{descText}</desc>
                    {[0, 0.5, 1].map((f) => (
                        <line
                            key={f}
                            x1="0"
                            x2="100"
                            y1={48 - f * 44}
                            y2={48 - f * 44}
                            className="stroke-border"
                            strokeWidth=".3"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {data.map(([d, v], n) => {
                        const height = (v / max) * 44;
                        const y = 48 - height;
                        const x = n * W + W * 0.2;
                        const width = W * 0.6;
                        const isMax = v === max && v > 0;

                        return (
                            <rect
                                key={d + n}
                                x={x}
                                y={y}
                                width={width}
                                height={height}
                                rx="1"
                                className={
                                    isMax ? 'fill-primary' : 'fill-brand-400'
                                }
                            />
                        );
                    })}
                </svg>
                <figcaption
                    className="mt-1 grid text-center text-caption text-muted-foreground"
                    style={{
                        gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))`,
                    }}
                    aria-hidden="true"
                >
                    {data.map(([d], idx) => (
                        <span key={idx} className="truncate px-0.5">
                            {d}
                        </span>
                    ))}
                </figcaption>
            </figure>

            <details className="mt-3">
                <summary className="inline-flex min-h-touch cursor-pointer items-center gap-1 text-label text-primary-text">
                    <DsIcon name="list" className="size-4" />
                    <span>View as table</span>
                </summary>
                <table className="mt-2 w-full text-body">
                    <caption className="sr-only">{title}</caption>
                    <thead>
                        <tr>
                            <th
                                scope="col"
                                className="py-1 text-left text-th text-muted-foreground uppercase"
                            >
                                Day
                            </th>
                            <th
                                scope="col"
                                className="py-1 text-right text-th text-muted-foreground uppercase"
                            >
                                {noun}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map(([d, v], idx) => (
                            <tr key={idx}>
                                <th
                                    scope="row"
                                    className="py-1.5 text-left font-normal"
                                >
                                    {d}
                                </th>
                                <td className="tabular py-1.5 text-right">
                                    {formatPeso(v)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </details>
        </section>
    );
}
