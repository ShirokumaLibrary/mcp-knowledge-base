export function isTaskItem(item) {
    return ['issues', 'plans', 'bugs'].includes(item.type);
}
export function isDocumentItem(item) {
    return ['docs', 'knowledge', 'recipe', 'tutorial'].includes(item.type);
}
export function isSessionItem(item) {
    return item.type === 'sessions';
}
export function isSummaryItem(item) {
    return item.type === 'dailies';
}
export class RelatedItemsHelper {
    static parse(ref) {
        const [type, ...idParts] = ref.split('-');
        return { type, id: idParts.join('-') };
    }
    static format(type, id) {
        return `${type}-${id}`;
    }
    static filterByBaseType(related, baseTypeCheck) {
        return related.filter(ref => {
            const { type } = this.parse(ref);
            return baseTypeCheck(type);
        });
    }
}
