// metro-polyfill.js
if (typeof URL !== 'undefined' && !URL.canParse) {
    URL.canParse = function (url, base) {
        try {
            new URL(url, base);
            return true;
        } catch {
            return false;
        }
    };
    console.log("▲ Polyfill: URL.canParse injected successfully into the active process context.");
}
