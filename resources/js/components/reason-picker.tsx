import { CircleAlert } from 'lucide-react';
import { useId, useState } from 'react';

export type ReasonPickerProps = {
    templates: string[];
    required?: boolean;
    noteLabel?: string;
    name?: string;
    value?: string;
    note?: string;
    internalNote?: boolean;
    onChangeValue?: (value: string) => void;
    onChangeNote?: (note: string) => void;
    onChangeInternalNote?: (checked: boolean) => void;
    error?: string;
};

export function ReasonPicker({
    templates,
    required = true,
    noteLabel = 'Message to seller',
    name = 'reason',
    value,
    note = '',
    internalNote = false,
    onChangeValue,
    onChangeNote,
    onChangeInternalNote,
    error,
}: ReasonPickerProps) {
    const uid = useId();
    const [charCount, setCharCount] = useState(note.length);

    return (
        <div className="grid gap-4">
            <fieldset className="grid">
                <legend className="mb-1 text-label">
                    Reason {required && '(required)'}
                </legend>
                {templates.map((template, i) => (
                    <label
                        key={i}
                        htmlFor={`${uid}-r-${i}`}
                        className="flex min-h-touch items-start gap-3 py-2.5"
                    >
                        <input
                            id={`${uid}-r-${i}`}
                            type="radio"
                            name={name}
                            value={template}
                            required={required}
                            checked={value === template}
                            onChange={() => onChangeValue?.(template)}
                            className="mt-0.5 size-5 shrink-0 accent-primary"
                        />
                        <span className="grid gap-0.5">
                            <span className="text-body">{template}</span>
                        </span>
                    </label>
                ))}
                {error && (
                    <p
                        className="flex items-start gap-1 text-body-sm font-bold text-danger"
                        role="alert"
                    >
                        <CircleAlert
                            aria-hidden="true"
                            className="icon mt-px size-4"
                        />
                        <span>{error}</span>
                    </p>
                )}
            </fieldset>

            <div className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                    <label
                        htmlFor={`${uid}-note`}
                        className="text-label text-foreground"
                    >
                        {noteLabel}
                    </label>
                </div>
                <textarea
                    id={`${uid}-note`}
                    rows={3}
                    className="field"
                    placeholder="e.g. Remove the logo from photos 2 and 3."
                    maxLength={1000}
                    value={note}
                    aria-describedby={`${uid}-note-help ${uid}-note-count`}
                    onChange={(e) => {
                        setCharCount(e.target.value.length);
                        onChangeNote?.(e.target.value);
                    }}
                />
                <div className="flex gap-2">
                    <p
                        id={`${uid}-note-help`}
                        className="text-body-sm text-muted-foreground"
                    >
                        Sent with the decision. Be specific about what to
                        change.
                    </p>
                    <p
                        id={`${uid}-note-count`}
                        className="tabular ml-auto shrink-0 text-body-sm text-muted-foreground"
                        aria-live="polite"
                    >
                        {charCount} / 1000
                    </p>
                </div>
            </div>

            <label
                htmlFor={`${uid}-int`}
                className="flex min-h-touch items-start gap-3 py-2.5"
            >
                <input
                    id={`${uid}-int`}
                    type="checkbox"
                    className="mt-0.5 size-5 shrink-0 accent-primary"
                    checked={internalNote}
                    onChange={(e) => onChangeInternalNote?.(e.target.checked)}
                />
                <span className="grid gap-0.5">
                    <span className="text-body">
                        Add internal note only (not sent)
                    </span>
                </span>
            </label>
        </div>
    );
}
