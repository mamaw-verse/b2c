/** Long date in the shop's own time zone so server and client markup agree (en-PH site). */
export function formatBlogDate(value: string): string {
    return new Date(value).toLocaleDateString('en-PH', {
        dateStyle: 'long',
        timeZone: 'Asia/Manila',
    });
}

export function readingTime(minutes: number): string {
    return `${minutes} min read`;
}
