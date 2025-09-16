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
let loader;
document.addEventListener("DOMContentLoaded",() => {
    loader = new Loader(true);
    loader.creat();
    loader.remove(2000);
});

function route(link){
    window.location.href = link;
}

function alertMessage(data){
    try{
        const alertId = "custom-alert";
        const alertHTML = `
            <section class="blbg" id="${alertId}">
                <div class="alert alert-warning" role="alert">
                    <h4 class="alert-heading">Error: ${data?.error} 
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

function substitutionEncoder(plain_txt, key){
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