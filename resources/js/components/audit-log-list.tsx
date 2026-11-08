import { Shield } from 'lucide-react';

export type AuditEntry = {
    id?: string;
    actor: string;
    action: string;
    detail?: string;
    at: string;
    is_system?: boolean;
    actor_role?: string;
};

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

export function AuditLogList({ entries }: { entries: AuditEntry[] }) {
    if (entries.length === 0) {
        return (
            <p className="text-body-sm text-muted-foreground">
                No history entries recorded yet.
            </p>
        );
    }

    return (
        <ol className="grid gap-4" aria-label="Audit log">
            {entries.map((entry, idx) => {
                const isSystem =
                    entry.is_system || entry.actor.toLowerCase() === 'system';
                return (
                    <li key={entry.id ?? idx} className="flex gap-3">
                        {isSystem ? (
                            <span
                                className="relative inline-grid size-8 shrink-0 place-items-center rounded-full bg-brand-100 text-caption font-bold text-brand-800"
                                aria-hidden="true"
                            >
                                <Shield className="size-4" />
                            </span>
                        ) : (
                            <span
                                className="relative inline-grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-caption font-bold text-success-text"
                                aria-hidden="true"
                            >
                                <span>{getInitials(entry.actor)}</span>
                            </span>
                        )}

                        <div className="grid min-w-0 flex-1 gap-0.5">
                            <p className="text-body">
                                <span className="font-bold">{entry.actor}</span>
                                {entry.actor_role && (
                                    <span className="text-muted-foreground">
                                        {' '}
                                        · {entry.actor_role}
                                    </span>
                                )}
                                <span> · {entry.action}</span>
                            </p>
                            {entry.detail && (
                                <p className="text-body-sm text-muted-foreground">
                                    {entry.detail}
                                </p>
                            )}
                            <p className="text-caption text-muted-foreground">
                                <time>{entry.at}</time>
                            </p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
