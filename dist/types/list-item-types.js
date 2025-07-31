export function isListItem(item) {
    return (typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.type === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.tags) &&
        typeof item.updated_at === 'string');
}
