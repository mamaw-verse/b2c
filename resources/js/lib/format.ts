export function formatPeso(centavos: number): string {
    const pesos = centavos / 100;

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: Number.isInteger(pesos) ? 0 : 2,
    }).format(pesos);
}

export function compactCount(n: number): string {
    return new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
    })
        .format(n)
        .toLowerCase();
}
