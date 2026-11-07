import { Check } from 'lucide-react';

export type ProgressStepsProps = {
    steps: string[];
    current: number; // 0-based index
    label?: string;
    className?: string;
};

export function ProgressSteps({
    steps,
    current,
    label = 'Progress',
    className = '',
}: ProgressStepsProps) {
    const total = steps.length;
    const clampedCurrent = Math.max(0, Math.min(current, total - 1));
    const currentName = steps[clampedCurrent] ?? '';
    const percentage =
        total > 0 ? Math.round(((clampedCurrent + 1) / total) * 100) : 0;

    return (
        <nav aria-label={label} className={`@container ${className}`}>
            {/* Phone view: compact text + progress bar (< @2xl per FB-05) */}
            <div className="@2xl:hidden">
                <p className="text-body-sm text-muted-foreground">
                    Step {clampedCurrent + 1} of {total}:{' '}
                    <span className="font-bold text-foreground">
                        {currentName}
                    </span>
                </p>
                <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted"
                    aria-hidden="true"
                >
                    <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>

            {/* Desktop / wider container view: numbered circles + connectors */}
            <ol className="hidden items-center gap-2 @2xl:flex">
                {steps.map((step, index) => {
                    const isCompleted = index < clampedCurrent;
                    const isCurrent = index === clampedCurrent;
                    const isLast = index === total - 1;

                    return (
                        <li
                            key={step}
                            className={`flex items-center gap-2 ${isLast ? 'flex-none' : 'flex-1'}`}
                            aria-current={isCurrent ? 'step' : undefined}
                        >
                            {isCompleted ? (
                                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-label text-primary-foreground">
                                    <Check
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    <span className="sr-only">Completed:</span>
                                </span>
                            ) : isCurrent ? (
                                <span className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-primary bg-surface text-label font-bold text-primary">
                                    {index + 1}
                                </span>
                            ) : (
                                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-border-control bg-surface text-label text-muted-foreground">
                                    {index + 1}
                                </span>
                            )}

                            <span
                                className={`truncate text-label ${
                                    isCurrent
                                        ? 'text-foreground'
                                        : isCompleted
                                          ? 'text-foreground'
                                          : 'text-muted-foreground'
                                }`}
                            >
                                {step}
                            </span>

                            {!isLast && (
                                <span
                                    className={`h-0.5 flex-1 rounded-full ${
                                        isCompleted ? 'bg-primary' : 'bg-border'
                                    }`}
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
