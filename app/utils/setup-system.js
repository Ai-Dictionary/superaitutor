import { ACCESS_TOKEN, API_URL, LOCAL_API_URL, PUBLIC_KEY } from '@env';
import { Platform, } from 'react-native';

class System{
    constructor(){
        this.access_token = ACCESS_TOKEN;
        this.VOCAB = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@!*+#%$&^,|?/";
        this.VOCAB_SIZE = this.VOCAB.length;
    }
    server_link(mode='None'){
        if(Platform.OS != 'web' || mode != 'None'){
            return API_URL;
        }else{
            return LOCAL_API_URL;
        }
    }
    substitutionEncoder(plain_txt, key='1441'){
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
    modInverse(a, m) {
        for (let x = 1; x < m; x++) {
            if ((a * x) % m === 1) return x;
        }
        return null;
    }
    encrypt(plainText) {
        let cipher = "";
        plainText = String(Math.floor(Math.random()*9))+plainText+"."+(new Date().toISOString());
        for (let ch of plainText) {
            const idx = this.VOCAB.indexOf(ch);
            if (idx !== -1) {
                const encIdx = (idx * PUBLIC_KEY) % this.VOCAB_SIZE;
                cipher += this.VOCAB[encIdx];
            } else {
                cipher += ch;
            }
        }
        return this.substitutionEncoder(cipher);
    }
}

export default new System();