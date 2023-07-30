const IOS_REGEX = /iPad|iPhone|iPod/i;
const MAC_REGEX = /Mac/i;

export default function isOniOS() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined')
        return false;

    const userAgent = navigator.userAgent;
    const matchesRegex = IOS_REGEX.test(userAgent);
    if (matchesRegex)
        return true;

    // iPadOS does not have 'iPad' at all in the userAgent so
    // we need an additional check
    const maxTouchPoints = navigator.maxTouchPoints ?? 0;
    return userAgent.match(MAC_REGEX) && maxTouchPoints > 2;
}
