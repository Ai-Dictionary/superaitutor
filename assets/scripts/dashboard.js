class PageRouter {
    constructor(basePath = '..', hostedPath = 'https://ai-dictionary.github.io/superaitutor') {
        this.basePath = basePath;
        this.hostedPath = hostedPath;
        this.currentPage = undefined;

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
                if(this.currentPage!=undefined){
                    document.getElementById(this.currentPage).innerHTML = document.getElementById('page-content').innerHTML;
                }
                const container = document.getElementById('page-content');
                if (container) {
                    container.innerHTML = template.innerHTML!='undefined'?template.innerHTML:(this.isHosted()?"<img src='https://ai-dictionary.github.io/superaitutor/assets/images/404.webp' alt='sait' class='Img404'/>":"<img src='../assets/images/404.webp' alt='sait' class='Img404'/>");
                    this.loadAssets(pageId);
                    this.currentPage = `${pageId}-template`;
                    history.pushState({}, '', `/deshboard?page=${pageId}`);
                }
                if(pageId=='general'){
                    setTimeout(()=>{
                        general.performanceGraph();
                    },1000);
                }
            }
        } catch (e) {
            console.error(`Oops! Some page is not set for "${pageId}" due to an error:\n`, e);
        }
    }

    loadAssets(pageId) {
        try {
            const prefix = this.getAssetPrefix();

            const cssHref = `${prefix}/assets/styles/${pageId}.css`;
            const jsSrc = `${prefix}/assets/scripts/${pageId}.js`;

            const cssPath = new URL(cssHref, location.origin).pathname;
            const jsPath = new URL(jsSrc, location.origin).pathname;

            const cssExists = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => new URL(link.href).pathname === cssPath);

            if (!cssExists) {
                const css = document.createElement('link');
                css.rel = 'stylesheet';
                css.href = cssHref;
                document.head.appendChild(css);
            }

            const jsExists = Array.from(document.querySelectorAll('script[src]')).some(script => new URL(script.src).pathname === jsPath);

            if (!jsExists) {
                const js = document.createElement('script');
                js.src = jsSrc;
                document.body.appendChild(js);
            }
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