import { Form, Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDateTime } from '@/lib/format';
import { index as auditLogIndex } from '@/routes/admin/audit-log';

type Entry = {
    id: string;
    actor: { name: string; email: string } | null;
    action: string;
    subject: { type: string; id: string } | null;
    metadata: Record<string, unknown> | null;
    ip: string | null;
    created_at: string;
};

export default function AdminAuditLog({
    entries,
    actions,
    filters,
}: {
    entries: Entry[];
    actions: string[];
    filters: { action: string | null; subject_type: string | null };
}) {
    return (
        <AdminLayout>
            <Head title="Audit log" />
            <div className="mx-auto grid max-w-container gap-4 p-gutter py-8">
                <h1 className="text-h1">Audit log</h1>

                <Form
                    action={auditLogIndex().url}
                    method="get"
                    className="panel flex flex-wrap items-end gap-3 p-4"
                >
                    <div className="grid gap-1.5">
                        <label
                            htmlFor="filter-action"
                            className="text-body-sm font-medium"
                        >
                            Action
                        </label>
                        <Select
                            id="filter-action"
                            name="action"
                            defaultValue={filters.action ?? ''}
                            className="w-56"
                        >
                            <option value="">All actions</option>
                            {actions.map((action) => (
                                <option key={action} value={action}>
                                    {action}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div className="grid gap-1.5">
                        <label
                            htmlFor="filter-subject"
                            className="text-body-sm font-medium"
                        >
                            Subject type
                        </label>
                        <Input
                            id="filter-subject"
                            name="subject_type"
                            defaultValue={filters.subject_type ?? ''}
                            placeholder="e.g. Payout"
                            className="w-48"
                        />
                    </div>
                    <Button type="submit" variant="outline">
                        Filter
                    </Button>
                </Form>

                {entries.length === 0 ? (
                    <p className="text-body text-muted-foreground">
                        No audit events recorded yet.
                    </p>
                ) : (
                    <ul className="grid gap-3">
                        {entries.map((entry) => (
                            <li
                                key={entry.id}
                                className="panel grid gap-1 p-4"
                                data-test="audit-entry"
                            >
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <p className="text-label">{entry.action}</p>
                                    <p className="text-body-sm text-muted-foreground">
                                        {formatDateTime(entry.created_at)}
                                    </p>
                                </div>
                                <p className="text-body-sm text-muted-foreground">
                                    {entry.actor
                                        ? `${entry.actor.name} (${entry.actor.email})`
                                        : 'System'}
                                    {entry.subject &&
                                        ` · ${entry.subject.type} ${entry.subject.id}`}
                                    {entry.ip && ` · ${entry.ip}`}
                                </p>
                                {entry.metadata && (
                                    <pre
                                        tabIndex={0}
                                        className="overflow-x-auto rounded-sm bg-surface-muted p-2 text-body-sm text-muted-foreground"
                                    >
                                        {JSON.stringify(entry.metadata)}
                                    </pre>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </AdminLayout>
    );
}
