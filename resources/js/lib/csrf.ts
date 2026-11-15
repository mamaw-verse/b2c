export function getCsrfHeaders(): Record<string, string> {
    if (typeof document === 'undefined') {
        return {};
    }

    const raw = document.cookie
        .split('; ')
        .find((c) => c.startsWith('XSRF-TOKEN='))
        ?.slice('XSRF-TOKEN='.length);
    const meta = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');

    return {
        ...(raw ? { 'X-XSRF-TOKEN': decodeURIComponent(raw) } : {}),
        ...(meta ? { 'X-CSRF-TOKEN': meta } : {}),
    };
}
