import { Check, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

export type TimelineEventState = 'done' | 'current' | 'todo';

export type TimelineEvent = {
    title: string;
    detail?: string | null;
    time?: string | null;
    state?: TimelineEventState;
    icon?: ReactNode;
};

export type TimelineProps = {
    events: TimelineEvent[];
    label?: string;
    className?: string;
};

export function Timeline({
    events,
    label = 'Order tracking',
    className = '',
}: TimelineProps) {
    return (
        <ol className={`grid ${className}`} aria-label={label}>
            {events.map((event, index) => {
                const isLast = index === events.length - 1;
                const state = event.state ?? (index === 0 ? 'current' : 'done');
                const isDone = state === 'done';
                const isCurrent = state === 'current';
                const isTodo = state === 'todo';

                return (
                    <li
                        key={`${event.title}-${index}`}
                        className="relative grid grid-cols-[1.5rem_1fr] gap-3 pb-5 last:pb-0"
                        aria-current={isCurrent ? 'step' : undefined}
                    >
                        {/* Connector line */}
                        {!isLast && (
                            <span
                                className={`absolute top-6 bottom-0 left-[.6875rem] w-0.5 ${
                                    isDone ? 'bg-primary' : 'bg-border'
                                }`}
                                aria-hidden="true"
                            />
                        )}

                        {/* Node circle */}
                        {isDone ? (
                            <span className="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                                <Check
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                            </span>
                        ) : isCurrent ? (
                            <span className="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary-soft">
                                {event.icon ?? (
                                    <Truck
                                        className="size-3.5"
                                        aria-hidden="true"
                                    />
                                )}
                            </span>
                        ) : (
                            <span className="relative z-10 mt-0.5 grid size-6 place-items-center rounded-full border-2 border-border-control bg-surface" />
                        )}

                        {/* Event content */}
                        <div className="grid gap-0.5">
                            <p
                                className={`text-label ${
                                    isTodo
                                        ? 'text-muted-foreground'
                                        : 'text-foreground'
                                }`}
                            >
                                {isDone && (
                                    <span className="sr-only">Completed: </span>
                                )}
                                {isCurrent && (
                                    <span className="sr-only">Current: </span>
                                )}
                                {event.title}
                            </p>
                            {event.detail && (
                                <p className="text-body-sm text-muted-foreground">
                                    {event.detail}
                                </p>
                            )}
                            {event.time && (
                                <p className="tabular text-body-sm text-muted-foreground">
                                    <time>{event.time}</time>
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
