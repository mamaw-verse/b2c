const SCRIPT_SRC =
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
    render: (
        container: HTMLElement,
        options: Record<string, unknown>,
    ) => string;
    reset: (widgetId?: string) => void;
    remove: (widgetId: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Loads the Turnstile script once and resolves with its API. */
export function loadTurnstile(): Promise<TurnstileApi> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Turnstile requires a browser"));
    }

    if (window.turnstile) {
        return Promise.resolve(window.turnstile);
    }

    scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () =>
            window.turnstile
                ? resolve(window.turnstile)
                : reject(new Error("Turnstile failed to initialise"));
        script.onerror = () => {
            scriptPromise = null;
            reject(new Error("Turnstile failed to load"));
        };
        document.head.appendChild(script);
    });

    return scriptPromise;
}

const widgets = new Set<string>();

export function registerWidget(id: string): void {
    widgets.add(id);
}

export function unregisterWidget(id: string): void {
    widgets.delete(id);
}

/** Tokens are single-use: call after every submit attempt to get a fresh one. */
export function resetTurnstile(): void {
    widgets.forEach((id) => window.turnstile?.reset(id));
}

/**
 * Exchanges a Turnstile token for the signed `human_pass` cookie so later
 * submissions on guarded routes (`human` middleware) need no fresh challenge.
 */
export async function issueHumanPass(token: string): Promise<boolean> {
    const csrf = document
        .querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
        ?.getAttribute("content");

    const response = await fetch("/human-check", {
        method: "POST",
        credentials: "same-origin",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
        },
        body: JSON.stringify({ token }),
    });

    return response.ok;
}
