export function removeInvisibleCharacters(str) {
    const invisibleChars = [
        '\u200B',
        '\u200C',
        '\u200D',
        '\u200E',
        '\u200F',
        '\u202A',
        '\u202B',
        '\u202C',
        '\u202D',
        '\u202E',
        '\u2060',
        '\u2061',
        '\u2062',
        '\u2063',
        '\u2064',
        '\u206A',
        '\u206B',
        '\u206C',
        '\u206D',
        '\u206E',
        '\u206F',
        '\uFEFF',
        '\uFFF9',
        '\uFFFA',
        '\uFFFB'
    ];
    const pattern = new RegExp(invisibleChars.map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
    return str.replace(pattern, '');
}
export function cleanString(str) {
    return removeInvisibleCharacters(str).trim();
}
