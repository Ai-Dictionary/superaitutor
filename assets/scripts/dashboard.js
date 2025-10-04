class PageRouter {
    constructor(basePath = '..', hostedPath = 'https://ai-dictionary.github.io/superaitutor') {
        this.basePath = basePath;
        this.hostedPath = hostedPath;

        window.addEventListener('popstate', () => this.handlePopState());
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    isHosted() {
        return window.location.hostname !== 'localhost';
    }

    getAssetPrefix() {
        return this.isHosted() ? this.hostedPath : this.basePath;
    }

    loadPage(pageId) {
        try {
            const template = document.getElementById(`${pageId}-template`);
            if (template) {
                const container = document.getElementById('page-content');
                if (container) {
                    container.innerHTML = template.innerHTML;
                    this.loadAssets(pageId);
                    history.pushState({}, '', `/deshboard?page=${pageId}`);
                }
            }
        } catch (e) {
            console.error(`Oops! Some page is not set for "${pageId}" due to an error:\n`, e);
        }
    }

    loadAssets(pageId) {
        try {
            const prefix = this.getAssetPrefix();

            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = `${prefix}/assets/styles/${pageId}.css`;
            document.head.appendChild(css);

            const js = document.createElement('script');
            js.src = `${prefix}/assets/scripts/${pageId}.js`;
            document.body.appendChild(js);
        } catch (e) {
            console.error(`Oops! Some assets are not set for "${pageId}" due to an error:\n`, e);
        }
    }

    handlePopState() {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'general';
        this.loadPage(page);
    }

    init() {
        const params = new URLSearchParams(window.location.search);
        const page = params.get('page') || 'general';
        this.loadPage(page);
    }
}

const router = new PageRouter();
window.loadPage = (pageId) => router.loadPage(pageId);