class Loader{
    constructor(load){
        this.loaded = load;
    }
    create(){
        if(this.loaded!=false){
            const loaderEle = document.createElement('div');
            loaderEle.classList.add("loader");
            loaderEle.innerHTML = `<div class="centerDia"><div class="loading"></div></div>`;
            document.body.appendChild(loaderEle);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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

class PopUp {
    constructor(type = 'normal', time = 3000, maxVisible = 5) {
        this.type = type;
        this.time = time;
        this.maxVisible = maxVisible;

        if(!document.querySelector('#popup-container')){
            const container = document.createElement('div');
            container.id = 'popup-container';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '10px';
            container.style.zIndex = '999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column-reverse';
            container.style.gap = '10px';
            document.body.appendChild(container);
        }
    }

    create(message = 'Some popup want to appear but due to permission limitation they are not shown in display.'){
        const container = document.querySelector('#popup-container');
        const div = document.createElement('div');
        div.className = 'popup';

        const timeoutId = setTimeout(() => {
            div.remove();
        }, this.time);

        div.innerHTML = `
            <div class="alert alert-${this.type === 'normal' ? 'secondary' : this.type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="close" data-dismiss="alert" aria-label="Close" onclick="clearTimeout(${timeoutId}); document.querySelector('.${div.className}').remove();">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
        `;

        container.appendChild(div);

        const popups = container.querySelectorAll('.popup');
        if (popups.length > this.maxVisible) {
            popups[0].remove();
        }
    }
    delete(){
        const popups = container.querySelectorAll('.popup');
        if(popups){
            for(let i=0; i<popups.length; i++){
                popups[i].remove();
            }
        }
    }
}

class System{
    constructor(){

    }
    alert(data){
        try{
            const alertId = "custom-alert";
            const alertHTML = `
                <section class="blbg" id="${alertId}">
                    <div class="alert ${data?.error>=200 && data?.error<= 299?'alert-success':data?.error>=400 && data?.error <= 600?'alert-warning':'alert-danger'}" role="alert">
                        <h4 class="alert-heading">${data?.error>=200 && data?.error<= 299?'Success':'Error'}: ${data?.error} 
                            <button type="button" class="close" data-dismiss="alert" aria-label="Close" onclick="document.getElementById('${alertId}').remove(); ${data?.mute!=true ?'window.location.reload()':''};">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </h4>
                        <p>${data?.message}</p>
                        <hr>
                        <p class="mb-0">If you see this message rapidly or unexpected way then please <a href="mailto:info.aidictionary24x7@gmail.com?subject=Unexpected%20Dialog%20popup%20coming%20in%20SAIT">contact us</a>.</p>
                    </div>
                </section>`;
            document.body.insertAdjacentHTML("beforeend", alertHTML);
        }catch(e){
            alert("Somthin went wrong! \n", e, String(data));
        }
    }
    encoder(plain_txt, key){
        const vocabulary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@!*+#%$&^,|?/";
        let cipher = "";
        key = key.repeat(Math.ceil(plain_txt.length / key.length));

        for(let i = 0; i < plain_txt.length; i++){
            let plain_txtIndex = vocabulary.indexOf(plain_txt[i]);
            let keyIndex = vocabulary.indexOf(key[i]);
            if(plain_txtIndex !== -1 && keyIndex !== -1){
                let newIndex = (plain_txtIndex + keyIndex) % vocabulary.length;
                cipher += vocabulary[newIndex];
            } else {
                cipher += plain_txt[i];
            }
        }
        return cipher;
    }
    copy(id){
        const textToCopy = document.querySelector(id);
        const tempTextarea = document.createElement("textarea");
        tempTextarea.value = textToCopy.textContent;
        document.body.appendChild(tempTextarea);
        tempTextarea.select();
        tempTextarea.setSelectionRange(0, 99999);
        document.execCommand("copy");
        document.body.removeChild(tempTextarea);
        alert("Text has been copied to the clipboard!");
    }
    search(data, list, type='list-item'){
        let find = 0;
        let miss=0;
        let input = document.getElementById(`${data}`).value;
        input = input.toLowerCase();
        let x = document.getElementsByClassName(`${list}`);
        for(let i = 0; i<x.length; i++){ 
            if(!x[i].textContent.toLowerCase().includes(input)){
                x[i].style.display = "none";
                miss++;
            }else{
                x[i].style.display = type; //list-item
                find++;
            }
        }
        if(data == 'searchSelectList'){
            data = 'searchData';
        }
        if(miss>find && find==0 && miss!=0){
            document.getElementById(data+'DOD').style.display = "block";
        }else{
            document.getElementById(data+'DOD').style.display = "none";
        }
    }
}

let loader;
let system;
document.addEventListener("DOMContentLoaded",() => {
    loader = new Loader(true);
    loader.create();
    loader.remove(2000);
    system = new System();
});

function route(link){
    window.location.href = link;
}

function invalid(){
    alert("This feature is not present on this version or you are not permitted to access this resource from this site, Please wait until the new version release or contact us for permission");
}