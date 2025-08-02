export function normalizeVersion(version) {
    if (!version)
        return null;
    const cleaned = version.trim().replace(/^v/i, '');
    const parts = cleaned.split('.');
    const [major = '0', minor = '0', patch = '0'] = parts;
    const normalized = [
        major.padStart(5, '0'),
        minor.padStart(5, '0'),
        patch.padStart(5, '0')
    ].join('.');
    if (normalized === '00000.00000.00000' && cleaned !== '0.0.0') {
        return null;
    }
    return normalized;
}
export function denormalizeVersion(normalized) {
    if (!normalized)
        return null;
    try {
        const parts = normalized.split('.');
        if (parts.length !== 3)
            return normalized;
        const denormalized = parts
            .map(part => {
            const num = parseInt(part, 10);
            if (isNaN(num))
                return part;
            return num.toString();
        })
            .join('.');
        return denormalized;
    }
    catch {
        return normalized;
    }
}
export function normalizeVersionForComparison(versionQuery) {
    const match = versionQuery.match(/^(>=|>|<=|<|=)?(.*)$/);
    const operator = match?.[1] || '=';
    const versionPart = match?.[2]?.trim() || versionQuery.trim();
    return {
        operator,
        version: normalizeVersion(versionPart)
    };
}
