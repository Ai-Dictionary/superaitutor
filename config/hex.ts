module.exports = {
    pyerrorscanner: function pyerrorscanner(data){
        if((data*1) - (data*1) == 0){
            return true;
        }else{
            return false;
        }
    },
    pyerrorinfo: function pyerrorinfo(error_log, code){
        let message = '';
        for(let i=0; i<error_log.length; i++){
            if(error_log[i].code == code){
                message = error_log[i].desc;
            }
        }
        return {code, message};
    },
    isHosted: (req) => {
        if(req != Number){
            const host = req.hostname;
            if(host === 'localhost' || host === '127.0.0.1'){
                return false;
            }else{
                return true;
            }
        }else{
            if(req == 6100){
                return false;
            }else{
                return true;
            }
        }
    },
    mergeListToString: (singleImgBin) => {
        if (!Array.isArray(singleImgBin)) {
            throw new Error("Input must be an array");
        }
        return singleImgBin.join('');
    },
    margeListToArray: (multipleImgBin) => {
        if (!Array.isArray(multipleImgBin)) {
            throw new Error("Input must be an array");
        }
        for(let i=0; i<multipleImgBin.length; i++){
            multipleImgBin[i] = multipleImgBin[i].join('');
        }
        return multipleImgBin;
    },
    stringSizeInKB: (str) => {
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(str);
        const sizeInBytes = uint8Array.byteLength;
        const sizeInKB = sizeInBytes/1024;
        return Math.floor(sizeInKB);
    },
    setBlockCookie: (res, type) => {
        const timestamp = Date.now();
        const value = `${type}${timestamp}`;
        const encoded = Buffer.from(value).toString('base64');

        res.cookie('blockState', encoded, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: type === 'blocked' ? 24 * 60 * 60 * 1000 : 60 * 1000
        });
    },
    isClientBlockedByCookie: (req) => {
        const cookie = req?.cookies?.['blockState'];
        if (!cookie) return null;

        try{
            const decoded = Buffer.from(cookie, 'base64').toString();
            const type = decoded.startsWith('blocked') ? 'blocked' : decoded.startsWith('temp') ? 'temp' : null;
            const timestamp = parseInt(decoded.replace(String(type), ''), 10);
            const now = Date.now();

            if (type === 'blocked' && now - timestamp < 24 * 60 * 60 * 1000) return 'blocked';
            if (type === 'temp' && now - timestamp < 60 * 1000) return 'temp';
        }catch(err){
            return null;
        }
        return null;
    },
    foo:() => {
        return 0;
    }
};