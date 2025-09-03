class Loader{
    constructor(load){
        this.loaded = load;
    }
    creat(){
        if(this.loaded!=false){
            const loaderEle = document.createElement('div');
            loaderEle.classList.add("loader");
            loaderEle.innerHTML = `<div class="centerDia"><div class="loading"></div></div>`;
            document.body.appendChild(loaderEle);
            document.body.style.overflowY = "hidden";
        }
    }
    remove(time){
        if(time<100){
            return false;
        }
        setTimeout(()=>{
            document.body.removeChild(document.querySelector('.loader'));
            this.loaded = false;
            document.body.style.overflowY = "scroll";
        },time);
    }
}
let loader;
document.addEventListener("DOMContentLoaded",() => {
    loader = new Loader(true);
    loader.creat();
    loader.remove(2000);
});

function route(link){
    window.location.href = link;
}