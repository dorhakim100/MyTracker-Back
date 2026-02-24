"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDateFromISO = getDateFromISO;
exports.makeId = makeId;
exports.isEnglishWord = isEnglishWord;
function getDateFromISO(isoString) {
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
}
function makeId(length = 6) {
    let txt = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        txt += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return txt;
}
function isEnglishWord(input) {
    const LATIN_WORDS = 
    // eslint-disable-next-line no-useless-escape
    /^\p{Script=Latin}+(?:[’'\-]\p{Script=Latin}+)*(?:\s+\p{Script=Latin}+(?:[’'\-]\p{Script=Latin}+)*)*$/u;
    const s = input.trim();
    if (!s)
        return false;
    // quick reject: any Hebrew/Cyrillic/etc.
    if (/[\u0590-\u05FF\u0400-\u04FF]/.test(s))
        return false;
    // disallow digits/symbol-heavy tokens
    if (/[0-9_@#]/.test(s))
        return false;
    return LATIN_WORDS.test(s.slice(0, 1));
}
