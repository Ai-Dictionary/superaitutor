// metro-canparse-polyfill.js
if (!URL.canParse) {
    URL.canParse = function (url, base) {
        try {
            new URL(url, base);
            return true;
        } catch {
            return false;
        }
    };
}
