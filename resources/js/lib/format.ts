export function formatPeso(centavos: number): string {
    const pesos = centavos / 100;

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: Number.isInteger(pesos) ? 0 : 2,
    }).format(pesos);
}

export function formatDateTime(value: string | Date): string {
    return new Date(value).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function formatDate(value: string | Date): string {
    return new Date(value).toLocaleDateString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

export function compactCount(n: number): string {
    return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    })
        .format(n)
        .toLowerCase();
}
