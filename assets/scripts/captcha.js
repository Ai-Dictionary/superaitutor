class CAPTCHA{
    constructor(){
        this.vitals = '';
    }
    tokenizer(plain_txt, key){
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
    generateImageCaptcha(document, text){
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF00';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'normal italic 35px Verdana';
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 4;
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
        const angle = [10, 20, 30, 40, 50, 60, -60, -40];
        const randomAngle = angle[Math.floor(Math.random() * angle.length)];
        ctx.beginPath();
        ctx.moveTo(10, underlineY+randomAngle);
        ctx.lineTo(canvas.width - 20, underlineY - 40);
        ctx.stroke();
        return canvas.toDataURL();
    }
    getCaptcha(document, key){
        let text, imageData, hased;
        try{
            text = this.generateCaptcha();
            imageData = this.generateImageCaptcha(document, text);
            hased = this.tokenizer(text, '404');
        }catch(e){
            let generateCaptcha = (this.generateCaptcha);
            let generateImageCaptcha = (this.generateImageCaptcha);
            text = generateCaptcha();
            imageData = generateImageCaptcha(document, text);
            hased = this.tokenizer(text, String(key));
        }
        this.vitals = hased;
        return imageData.toString();
    }
    generateCaptcha(){
        // const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/@&!#*?%';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/@&!#*?%';
        let code = '';
        for(let i = 0; i < 6; i++){
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
}