# Moderation review flow (admin)

Queue → detail pane → decision → audit entry. Optimized for throughput and defensibility.

## Flow

1. **Queue** — `queueList` sorted by SLA by default: type icon, title, excerpt, `statusPill`, age + SLA (warn ≤ 15 min, breach = danger), reporter count, priority badge. `filterBar` above; checkboxes reveal `bulkBar` (md+ only).
2. **Detail** — phone: full-screen route; md+: right side of the split (`data-ds-master` / `data-ds-detail` manage `aria-current`). Sections: context strip (age/SLA/reports/assignee), `ContentPreview` (flagged text via `<mark>`, PII masked), report-reason tally, `auditLog`.
3. **Decision** — `actionBar` sticky at the pane bottom: Approve + Reject always visible; the rest in More on phone. Reject/Request-changes/Warn open the `reasonPicker` — a template reason is required, free text sent to the seller verbatim.
4. **Result** — assertive toast ("Listing rejected — message sent"); the queue keeps position, the pane advances to the next item; every action appends to `auditLog` (actor, action, quoted reason, `<time>`).

## Rules

- Destructive actions (Suspend, Escalate) always confirm via `ConfirmDialog`; Suspend is never a bulk action.
- ContentPreview is a snapshot: never link to a live listing that may have changed; chat excerpts show context only.
- Priority order: SLA breach > P1 > reporter count > age. Never silently re-order a queue mid-review.

Components: `statusPill`, `queueItem`, `filterBar`, `detailPane`, `reasonPicker`, `actionBar`, `bulkBar`, `auditLog`, `contentPreview`.
Reference: `screens/admin-queue.html`, `screens/admin-dashboard.html`.
