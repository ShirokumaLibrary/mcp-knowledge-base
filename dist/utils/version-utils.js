export function normalizeVersion(version) {
    if (!version) {
        return null;
    }
    const trimmed = version.trim();
    if (!/^\d+\.\d+\.\d+$/.test(trimmed)) {
        return null;
    }
    const parts = trimmed.split('.');
    const [major, minor, patch] = parts;
    const majorNum = parseInt(major, 10);
    const minorNum = parseInt(minor, 10);
    const patchNum = parseInt(patch, 10);
    if (isNaN(majorNum) || isNaN(minorNum) || isNaN(patchNum)) {
        return null;
    }
    if (majorNum > 99999 || minorNum > 99999 || patchNum > 99999) {
        return null;
    }
    const normalized = [
        major.padStart(5, '0'),
        minor.padStart(5, '0'),
        patch.padStart(5, '0')
    ].join('.');
    return normalized;
}
export function denormalizeVersion(normalized) {
    if (!normalized) {
        return null;
    }
    try {
        const parts = normalized.split('.');
        if (parts.length !== 3) {
            return normalized;
        }
        const denormalized = parts
            .map(part => {
            const num = parseInt(part, 10);
            if (isNaN(num)) {
                return part;
            }
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
