module.exports = {
    substitutionEncoder: (plain_txt, key) => {
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
            hased = module.exports.substitutionEncoder(text, '404');
        }catch(e){
            let generateCaptcha = (module.exports.generateCaptcha);
            let generateImageCaptcha = (module.exports.generateImageCaptcha);
            text = generateCaptcha();
            imageData = generateImageCaptcha(document, text);
            hased = module.exports.substitutionEncoder(text, '404');
        }
        // security.vitals = hased;
        return imageData.toString();
    }, 
    generateCaptcha: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/@&!#*?%';
        let code = '';
        for(let i = 0; i < 6; i++){
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    },
    sessionKey: () => {
        let left_key = module.exports.generateCaptcha();
        let right_key = module.exports.generateCaptcha();
        let key = 'chs'+left_key+right_key;
        return key;
    },
    generateStudentId: (student) => {
        const { name, dob, email, pin, contact, parent_name } = student;

        const prefix = "AID";

        const x = name.trim()[0].toUpperCase();

        const birthYear = dob.split("-")[2];
        const y = birthYear[birthYear.length - 1];

        const emailPrefix = email.trim()[0] + email.trim()[1];
        const asciiSum = emailPrefix.charCodeAt(0) + emailPrefix.charCodeAt(1);
        const pinStr = pin.toString();
        const lastThreePin = parseInt(pinStr.slice(-3), 10);
        const zzz = asciiSum + lastThreePin;

        const contactSum = contact.toString().split("").reduce((sum, digit) => sum + parseInt(digit), 0);
        const n = contactSum.toString().slice(-1);

        const [parentFirst, parentLast] = parent_name.trim().split(" ");
        const parentAsciiSum = parentFirst.charCodeAt(0) + parentLast.charCodeAt(0);
        const p = parentAsciiSum.toString().slice(-1);

        const dd = String(module.exports.getTodayDate()).split("-")[0];

        const signupYear = String(module.exports.getTodayDate()).split("-")[2];
        const yy = signupYear.split("").reduce((sum, digit) => sum + parseInt(digit), 0).toString().padStart(2, "0");

        const numericPart = `${x}${y}${zzz}${n}${p}${dd}${yy}`;

        const atIndex = Math.floor(Math.random() * numericPart.length);
        const idWithAt = numericPart.slice(0, atIndex) + "@" + numericPart.slice(atIndex);

        return prefix + idWithAt;
    },
    generateTeacherId: (teacher) => {
        const { name, email, pin, contact, subject } = teacher;

        const prefix = "UID";

        const [firstName, lastNameRaw] = name.trim().split(" ");

        const lastName = lastNameRaw ? lastNameRaw : firstName.split("").reverse().join("");

        const ff = (firstName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const ll = (lastName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");
        
        const emailPrefix = email.trim().toLowerCase()[0] + email.trim().toLowerCase()[1];
        const asciiSum = emailPrefix.charCodeAt(0) + emailPrefix.charCodeAt(1);
        const lastThreePin = parseInt(pin.toString().slice(-3), 10);
        const zzz = (asciiSum + lastThreePin).toString().padStart(3, "0");

        const contactSum = contact.toString().split("").reduce((sum, digit) => sum + parseInt(digit), 0);
        const n = contactSum.toString().slice(-1);

        const s = (subject.trim()[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const dd = String(module.exports.getTodayDate()).split("-")[0];

        const signupYear = String(module.exports.getTodayDate()).split("-")[2];
        const yy = signupYear.split("").reduce((sum, digit) => sum + parseInt(digit), 0).toString().padStart(2, "0");

        const numericPart = `${ff}${ll}${zzz}${n}${s}${dd}${yy}`;

        const atIndex = Math.floor(Math.random() * numericPart.length);
        const idWithAt = numericPart.slice(0, atIndex) + "@" + numericPart.slice(atIndex);

        return prefix + idWithAt;
    },
    generateFeedbackId: (feedback) => {
        const { type, from, email, related, created } = feedback;

        const prefix = "LID";

        const [firstName, lastName] = from.trim().split(" ");
        const ff = (firstName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");
        const ll = (lastName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const emailPrefix = email.trim().toLowerCase().slice(0, 2);
        const asciiSum = emailPrefix.charCodeAt(0) + emailPrefix.charCodeAt(1);

        const t = (type.trim()[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const r = (related.trim()[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const [day, month, year] = created.split("-");
        const isoDate = `${year}-${month}-${day}`;
        const dateObj = new Date(isoDate);

        const dd = String(dateObj.getDate()).padStart(2, "0");
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const yyyy = dateObj.getFullYear();
        const yySum = yyyy.toString().split("").reduce((sum, d) => sum + parseInt(d), 0).toString().padStart(2, "0");

        const numericPart = `${ff}${ll}${asciiSum}${t}${r}${dd}${mm}${yySum}`;

        const atIndex = Math.floor(Math.random() * numericPart.length);
        const idWithAt = numericPart.slice(0, atIndex) + "@" + numericPart.slice(atIndex);

        return prefix + idWithAt;
    },
    generateRateId: (data) => {
        const sid = data?.id?.sid || data?.sid;
        const tid = data?.id?.tid || data?.tid;
        return `${sid}-${tid}`;
    },
    getTodayDate: () => {
        const today = new Date();

        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        return `${dd}-${mm}-${yyyy}`;
    }
};