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
                return true;
            }else{
                return false;
            }
        }
    },
    isLocalhost: (os) => {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && iface.internal === true) {
                    return true;
                }
            }
        }
        return false;
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
    generateBGColor: (name, email='') => {
        function hashString(str){
            let hash = 0;
            for(let i = 0; i < str.length; i++){
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return hash;
        }
        const hash = hashString(name);
        const hue = Math.abs(hash) % 360;
        const saturation = 75;
        const lightness = 88;
        if(name=='Krishnendu Mitra' && email=='krishnendumitra24@gmail.com'){
            return '#0c8ff9';
        }
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    },
    profile_setup(profile_info){
        try{
            let props;
            if(profile_info.id.startsWith('UID')){
                props = ['emergency_contact', 'relevent_certificate', 'job_status', 'previous_institute', 'familiar', 'fav_color', 'fav_book', 'amount', 'as_stud', 'status'];
            }else if(profile_info.id.startsWith('AID')){
                props = ['contact', 'address', 'parent_contact', 'previous_institute', 'fav_color', 'fav_book', 'amount', 'as_tech', 'status'];
            }else if(profile_info.id.startsWith('MID')){
                props = ['dob', 'contact', 'fav_color', 'fav_book', 'amount', 'referring_contact', 'permission', 'status'];
            }else{
                return null;
            }
            for(let i=0; i<props.length; i++){
                delete profile_info[props[i]];
            }
            let confidence = delete profile_info?.pass;
            if(confidence!=true){
                return false;
            }
            profile_info.bg = module.exports.generateBGColor(profile_info.name);
            return profile_info;
        }catch{
            return false;
        }
    },
    unblockTempUser: (varchar, clientIP, res) => {
        if(varchar.tempBlockedIPs.has(clientIP)) {
            varchar.tempBlockedIPs.delete(clientIP);
        }
        varchar.ipHits[clientIP] = 0;
        module.exports.setBlockCookie(res, 'normal');
    },
    unblockBlockUser: (varchar, clientIP, res) => {
        if(varchar.blockedIPs.has(clientIP)) {
            varchar.blockedIPs.delete(clientIP);
        }
        varchar.ipHits[clientIP] = 0;
        module.exports.setBlockCookie(res, 'normal');
    },
    foo:() => {
        return 0;
    }
};