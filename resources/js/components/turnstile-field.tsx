import { usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import {
    loadTurnstile,
    registerWidget,
    unregisterWidget,
} from "@/lib/turnstile";

/**
 * Cloudflare Turnstile widget that fills a hidden `cf-turnstile-response`
 * input. It stays invisible unless Cloudflare needs an interactive challenge.
 * Renders nothing when the check is disabled (no site key shared).
 *
 * Tokens are single-use, so pair it with `onFinish={resetTurnstile}` on the
 * surrounding <Form>.
 */
export default function TurnstileField({ error }: { error?: string }) {
    const { turnstileSiteKey } = usePage().props;
    const container = useRef<HTMLDivElement>(null);
    const [token, setToken] = useState("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        if (!turnstileSiteKey || !container.current) {
            return;
        }

        let widgetId: string | null = null;
        let cancelled = false;

        loadTurnstile()
            .then((turnstile) => {
                if (cancelled || !container.current) {
                    return;
                }

                widgetId = turnstile.render(container.current, {
                    sitekey: turnstileSiteKey,
                    appearance: "interaction-only",
                    callback: (value: string) => {
                        setToken(value);
                        setFailed(false);
                    },
                    "expired-callback": () => setToken(""),
                    "error-callback": () => {
                        setToken("");
                        setFailed(true);
                    },
                });
                registerWidget(widgetId);
            })
            .catch(() => setFailed(true));

        return () => {
            cancelled = true;
            if (widgetId) {
                unregisterWidget(widgetId);
                window.turnstile?.remove(widgetId);
            }
        };
    }, [turnstileSiteKey]);

    if (!turnstileSiteKey) {
        return null;
    }

    const message =
        error ??
        (failed
            ? "We could not load the security check. Disable content blockers and refresh the page."
            : undefined);

    return (
        <div className="grid gap-2">
            <div ref={container} data-turnstile />
            <input type="hidden" name="cf-turnstile-response" value={token} />
            {message && (
                <p role="alert" className="text-body-sm text-danger-text">
                    {message}
                </p>
            )}
        </div>
    );
}
