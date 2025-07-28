/**
 * @ai-context Unified item types for the consolidated database structure
 * @ai-pattern Single table inheritance pattern for all item types
 * @ai-critical All IDs are strings to support both numeric and timestamp formats
 */
/**
 * @ai-intent Type guards for item type discrimination
 * @ai-pattern Runtime type checking
 */
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
/**
 * @ai-intent Helper for parsing related item references
 * @ai-pattern Consistent format: "type-id"
 */
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
//# sourceMappingURL=unified-types.js.map