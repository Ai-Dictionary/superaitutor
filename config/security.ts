module.exports = {
    substitutionEncoder: (plain_txt, key) => {
        // vigenere encoding
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
    },
    substitutionDecoder: (cipher, key) => {
        // vigenere decoding
        const vocabulary = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@!*+#%$&^,|?/";
        let plain_txt = "";
        key = key.repeat(Math.ceil(cipher.length / key.length));

        for(let i = 0; i < cipher.length; i++){
            let cipherIndex = vocabulary.indexOf(cipher[i]);
            let keyIndex = vocabulary.indexOf(key[i]);
            if (cipherIndex !== -1 && keyIndex !== -1) {
                let newIndex = (cipherIndex - keyIndex + vocabulary.length) % vocabulary.length;
                plain_txt += vocabulary[newIndex];
            } else {
                plain_txt += cipher[i];
            }
        }
        return plain_txt;
    },
    objEncoder: (obj, key='1441') => {
        const encrypted = {};
        for (let field in obj) {
            const value = String(obj[field]);
            encrypted[field] = module.exports.substitutionEncoder(value, key);
        }
        return encrypted;
    },
    objDecoder: (encryptedObj, key='1441') => {
        const decrypted = {};
        for (let field in encryptedObj) {
            decrypted[field] = module.exports.substitutionDecoder(encryptedObj[field], key);
        }
        return decrypted;
    },
    browser: (navigator) => { 
        var browserAgent = navigator['user-agent']; 
        var browserName, browserVersion, browserMajorVersion; 
        var Offset, OffsetVersion, ix; 
        if((OffsetVersion = browserAgent.indexOf("Chrome")) != -1){ 
            browserName = "Chrome"; 
            browserVersion = browserAgent.substring(OffsetVersion + 7);
        }else if((OffsetVersion = browserAgent.indexOf("MSIE")) != -1){ 
            browserName = "Microsoft Internet Explorer"; 
            browserVersion = browserAgent.substring(OffsetVersion + 5); 
        }else if((OffsetVersion = browserAgent.indexOf("Firefox")) != -1){ 
            browserName = "Firefox"; 
        }else if((OffsetVersion = browserAgent.indexOf("Safari")) != -1){ 
            browserName = "Safari"; 
            browserVersion = browserAgent.substring(OffsetVersion + 7); 
            if((OffsetVersion = browserAgent.indexOf("Version")) != -1) 
                browserVersion = browserAgent.substring(OffsetVersion + 8); 
        }else if((Offset = browserAgent.lastIndexOf(' ') + 1) < (OffsetVersion = browserAgent.lastIndexOf('/'))){ 
            browserName = browserAgent.substring(Offset, OffsetVersion); 
            browserVersion = browserAgent.substring(OffsetVersion + 1); 
            if(browserName.toLowerCase() == browserName.toUpperCase()){ 
                browserName = navigator.appName; 
            } 
        } 
        if((ix = browserVersion.indexOf(";")) != -1) 
            browserVersion = browserVersion.substring(0, ix); 
        if((ix = browserVersion.indexOf(" ")) != -1) 
            browserVersion = browserVersion.substring(0, ix); 
            browserMajorVersion = parseInt('' + browserVersion, 10); 
        if(isNaN(browserMajorVersion)){ 
            browserVersion = '' + parseFloat(navigator.appVersion); 
            browserMajorVersion = parseInt(navigator.appVersion, 10); 
        }
        return [browserName,browserVersion];
    },
    validBrowser: (browser_info,list) => {
        for(let i=0; i<list.length; i++){
            if(list[i].name == browser_info[0] && browser_info[1] >= list[i].version){
                return true;
            }
        }
        return false;
    },
    generateImageCaptcha: (document, text) => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF00';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold italic 40px "Fontdiner Swanky" ';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const spacing = 5;
        let x = canvas.width / 2 - (text.length * 25) / 2;
        const y = canvas.height / 2;
        for(const char of text){
            ctx.fillText(char, x, y);
            x += ctx.measureText(char).width + spacing;
        }
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        const underlineY = y;
        ctx.beginPath();
        ctx.moveTo(10, underlineY);
        ctx.lineTo(canvas.width - 10, underlineY);
        ctx.stroke();
        return canvas.toDataURL();
    },
    getCaptcha: (document) => {
        let text, imageData, hased;
        try{
            text = module.exports.generateCaptcha();
            imageData = module.exports.generateImageCaptcha(document, text);
            hased = module.exports.encodedData(text);
        }catch(e){
            let generateCaptcha = (module.exports.generateCaptcha);
            let generateImageCaptcha = (module.exports.generateImageCaptcha);
            text = generateCaptcha();
            imageData = generateImageCaptcha(document, text);
            hased = system.encodedData(text);
        }
        security.vitals = hased;
        return imageData.toString();
    }, 
    generateCaptcha: () => {
        var cap = new Array('A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','/','@','&','!','#','*','?','%','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9');
        let i, a, b, c, d, e, f;
        for(i=0;i<6;i++){
            a = cap[Math.floor(Math.random()*cap.length)];
            b = cap[Math.floor(Math.random()*cap.length)];
            c = cap[Math.floor(Math.random()*cap.length)];
            d = cap[Math.floor(Math.random()*cap.length)];
            e = cap[Math.floor(Math.random()*cap.length)];
            f = cap[Math.floor(Math.random()*cap.length)];
        }
        var code = a+b+c+d+e+f;
        return code;
    },
    sessionKey: () => {
        let left_key = module.exports.generateCaptcha();
        let right_key = module.exports.generateCaptcha();
        let key = 'chs'+left_key+right_key;
        return key;
    }
};