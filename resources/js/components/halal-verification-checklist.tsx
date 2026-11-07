import { CircleAlert, CircleCheck, CircleHelp } from 'lucide-react';

export type CheckResult = 'pass' | 'fail' | 'unknown';

export type ChecklistItem = {
    question: string;
    result: CheckResult;
    note?: string;
};

const RESULT_CONFIG: Record<
    CheckResult,
    { icon: React.ElementType; className: string; label: string }
> = {
    pass: { icon: CircleCheck, className: 'text-success', label: 'Passed' },
    fail: { icon: CircleAlert, className: 'text-danger', label: 'Failed' },
    unknown: {
        icon: CircleHelp,
        className: 'text-warning',
        label: 'Needs a manual check',
    },
};

/** Default halal verification checklist items derived from the product context. */
export const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { question: 'Halal certificate attached', result: 'unknown' },
    {
        question: 'Certifier is on the current accredited list',
        result: 'unknown',
    },
    { question: 'Certificate is valid today', result: 'unknown' },
    { question: 'Certificate covers this product', result: 'unknown' },
    {
        question: 'Ingredients contain no pork, alcohol or their derivatives',
        result: 'unknown',
    },
];

export function HalalVerificationChecklist({
    items = DEFAULT_CHECKLIST,
}: {
    items?: ChecklistItem[];
}) {
    return (
        <ul className="grid gap-3" aria-label="Halal verification checklist">
            {items.map((item, i) => {
                const config = RESULT_CONFIG[item.result];
                const Icon = config.icon;
                return (
                    <li key={i} className="grid grid-cols-[1.5rem_1fr] gap-x-3">
                        <span className={`mt-0.5 ${config.className}`}>
                            <Icon aria-hidden="true" className="icon" />
                        </span>
                        <div className="grid gap-0.5">
                            <p className="text-body">
                                <span className="sr-only">
                                    {config.label}:{' '}
                                </span>
                                {item.question}
                            </p>
                            {item.note && (
                                <p className="text-body-sm text-muted-foreground">
                                    {item.note}
                                </p>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
