const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const ejs = require('ejs');
const handlebars = require('handlebars');
const jsonfile = require('jsonfile');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const crypto = require('crypto');
const cookieParser = require('cookie-parser');
const os = require('os');
let varchar, security, hex, Memory;
try{
    varchar = require('./config/env-variables');
    security = require('./config/security');
    hex = require('./config/hex');
    Memory = require('./config/memory');
}catch{
    varchar = require('./config/env-variables.ts');
    security = require('./config/security.ts');
    hex = require('./config/hex.ts');
    Memory = require('./config/memory.ts');
}

require('./public/App.test.js');
require('dotenv').config();

const app = express();
let server = http.createServer(app);
const PORT = process.env.PORT || 6100;
const AppName = "superAITutor";

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.use('/assets', express.static(path.join(__dirname,'assets'), hex.isHosted(PORT) ? { maxAge: '30d', lastModified: true, setHeaders: function (res, path) {res.setHeader('Cache-Control', 'public, max-age=2592000, must-revalidate');}} : {}));
if(hex.isLocalhost(os)){
    app.use('/assets', express.static(path.join(__dirname, 'assets')));
}
app.use('/config', express.static(path.join(__dirname,'config')));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/public', (req, res, next) => {
    req.url = req.url.replace(/^\/public/, '');
    const staticMiddleware = express.static(path.join(__dirname, 'public'));
    staticMiddleware(req, res, next);
});
//{
//     etag: false,
//     lastModified: false,
//     maxAge: 0,
//     setHeaders: function (res, path) {
//         res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//         res.setHeader('Pragma', 'no-cache');
//         res.setHeader('Expires', '0');
//     }
// }));

app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    keyGenerator: (req) => ipKeyGenerator({ ip: req.headers['x-forwarded-for'] || req.ip }),
    skipSuccessfulRequests: true,
    message: 'Too many requests hit the server, please try again later or check our fair use policy',
});

app.use((req, res, next) => {
    res.locals.nonce = crypto.randomBytes(16).toString('base64');
    res.locals.isAppRequest = (req.headers['x-from-app'] === 'SuperAITutor' || req.query.token == '24fc8akm8o4s');
    next();
});

app.use((req, res, next) => {
    const frameSources = ["'self'", "https://vercel.live", "file:", "app:", "blob:"];
    if (res.locals.isAppRequest) {
        console.log("Request from APP");
        frameSources.push("*");
    }
    helmet.contentSecurityPolicy({
        useDefaults: true,
        directives: {
            "default-src": ["'self'"],
            "script-src": [
                "'self'",
                "'unsafe-hashes'",
                "https://cdnjs.cloudflare.com",
                "https://vercel.live",
                "https://vercel.com",
                "https://ai-dictionary.github.io",
                "https://code.jquery.com",
                "https://cdn.jsdelivr.net",
                (req, res) => `'nonce-${res.locals.nonce}'`
            ],
            "script-src-attr": ["'unsafe-inline'"],
            "style-src": [
                "'self'",
                "https://fonts.googleapis.com",
                "https://maxcdn.bootstrapcdn.com",
                "https://stackpath.bootstrapcdn.com",
                "https://ai-dictionary.github.io",
                "https://getbootstrap.com",
                "'unsafe-inline'" 
            ],
            "font-src": [
                "'self'",
                "https://maxcdn.bootstrapcdn.com",
                "https://stackpath.bootstrapcdn.com",
                "https://fonts.gstatic.com",
                "data:"
            ],
            "img-src": ["'self'", "data:", "https://avatars.githubusercontent.com", "https://ai-dictionary.github.io", "https://vercel.com", "https://raw.githubusercontent.com", "https://kidkrishkode.github.io"],
            "connect-src": [
                "'self'",
                "https://maxcdn.bootstrapcdn.com",
                "wss://ws-us3.pusher.com",
                "https://ws-us3.pusher.com",
                "https://chsapi.vercel.app",
            ],
            "frame-ancestors": frameSources
            // frameSrc: [
            //     "'self'",
            //     "https://vercel.live",
            // ],
        },
    })(req, res, next);
});

app.use([
    xss(),
    limiter,
    express.json(),
    express.urlencoded({ extended: true }),
    (req, res, next) => {
        const BLOCK_DURATION_MS = 60 * 1000;
        const clientIP = req.headers['x-forwarded-for'] || req.headers['x-vercel-forwarded-for'] || req.connection.remoteAddress || req.ip;
        const userAgent = req.headers['user-agent'];
        const cookieBlock = hex.isClientBlockedByCookie(req);
        
        if(req.url == '/'+varchar.revive) next();

        if(varchar.blockedIPs.includes(clientIP) || cookieBlock === 'blocked' || (!userAgent || userAgent.includes('bot') || userAgent.length < 10)){
            console.warn(`Blocked IP attempt to attack: ${clientIP}`);
            return req.destroy() || res.connection.destroy();
        }
        if(varchar.tempBlockedIPs.has(clientIP) || cookieBlock === 'temp'){
            const blockedAt = varchar.tempBlockedIPs.get(clientIP);
            const now = Date.now();
            if(now - blockedAt < BLOCK_DURATION_MS || cookieBlock === 'temp'){
                return res.status(403).send('Your IP is temporarily blocked due to excessive requests. Try again 1 min later either your account will be permanent blocked.');
            }else{
                varchar.tempBlockedIPs.delete(clientIP);
                varchar.ipHits[clientIP] = 0;
                hex.setBlockCookie(res, 'normal');
                // next();
            }
        }
        if(Object.keys(varchar.ipHits).length >= 10000 && !varchar.ipHits[clientIP]){
            console.warn(`Max users limit reached. Dropping new user with IP: ${clientIP}`);
            return res.status(429).send('Server is too busy now, Because to many user is present in the lobby. Please try again some time later or report us');
        }
        varchar.ipHits[clientIP] = (varchar.ipHits[clientIP] || 0) + 1;
        if((varchar.ipHits[clientIP] > 100 && varchar.ipHits[clientIP] < 200) && (clientIP != "::1")){
            varchar.tempBlockedIPs.set(clientIP, Date.now());
            delete varchar.ipHits[clientIP];
            hex.setBlockCookie(res, 'temp');
            return res.status(403).send('Your IP has been temporarily blocked due to exceed the request limit. Please check our fair use policy.');
        }
        if((varchar.ipHits[clientIP] >= 200) && (clientIP != "::1")){
            varchar.blockedIPs.push(clientIP);
            varchar.tempBlockedIPs.delete(clientIP);
            delete varchar.ipHits[clientIP];
            hex.setBlockCookie(res, 'blocked');
            return res.status(403).send('Access denied, client ip is permanent blocked due to past history of mal-practices! , don\'t try again other wise you even not hit our site also, So wait for a day.');
        }
        next();
    }
]);

app.use(async (req, res, next) => {
    try{
        const url = req.originalUrl;
        const query = url.split('?')[1];
        const baseURL = req.protocol + '://' + req.get('host');
        const params = new URL(url, baseURL).searchParams;
        const public_key = String(varchar.public_key);
        if(params.has('encode')){
            if(query!=undefined){
                const decodedUrl = security.substitutionDecoder(query.replace('encode=',''), public_key);
                req.url = `${url.split('?')[0]}?${decodedUrl}`;
                req.query = querystring.parse(decodedUrl);
            }
        }else{
            if(query!=undefined){
                const encodedUrl = security.substitutionEncoder(query, public_key);
                req.url = `${url}?encode=${encodedUrl}`;
                req.query = querystring.parse(encodedUrl);
            }
        }
        const my_browser = security.browser(req.headers);
        if(!security.validBrowser([my_browser[0], my_browser[1].split('.')[0]*1], varchar.browser_data) && hex.isHosted(req)){
            res.status(422).render('notfound',{error: 422, message: "Your browser is outdated and may not support certain features, Please upgrade to a modern browser."});
        }
        next();
    }catch(e){
        res.status(401).render('notfound',{error: 401, message: "Unauthorize entry not allow, check the source or report it", statement: e});
    }
});

app.post('/auth', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    
    let memory = new Memory();
    let profile_info = null;

    if(String(email).startsWith('AID')){
        memory.clusterName = 'student';
        profile_info = await memory.find_profile(email);
    }else if(String(email).startsWith('UID')){
        memory.clusterName = 'teacher';
        profile_info = await memory.find_profile(email);
    }else if(String(email).startsWith('MID')){
        memory.clusterName = 'master';
        profile_info = await memory.find_profile(email);
    }else if((/^[\w.-]+@[\w.-]+\.\w{2,}$/).test(email)){
        memory.clusterName = 'student';
        profile_info = await memory.find_profile(email);
        if(profile_info?.status==3 && (!profile_info || Object.keys(profile_info).length === 0)){
            memory.clusterName = 'teacher';
            profile_info = await memory.find_profile(email);
        }
    }else{
        profile_info.status==3;
    }
    
    if(profile_info?.status!=3 && profile_info && Object.keys(profile_info).length > 0){
        if((profile_info.id === email || profile_info.email === email) && profile_info.pass === password){
            const expiryTime = Date.now() + 30 * 60 * 1000;
            const tokenPayload = JSON.stringify({ token: security.substitutionEncoder(String(profile_info.id+'-'+expiryTime), 'security') });

            res.cookie('auth_token', tokenPayload, {
                maxAge: 30 * 60 * 1000,
                httpOnly: true,
                secure: true,
                sameSite: 'Strict'
            });

            res.status(200).json({ 'success': true, 'message': 'Authentication successful!' });
        }else{
            res.status(200).json({'error': 400, 'message': 'It looks like the login details you entered are not correct. Please double-check your userid and password, and try again in a little while.'});
        }
    }else{
        res.status(200).json({'error': 404, 'message': 'We could not find any profile that matches the details you entered. Please check your information carefully—like your name, ID, or email—and try again.'});
    }
});

app.get('/', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'only signup'});
    }
    let footer = await ejs.renderFile('./views/footer.ejs', {size: 'big'});
    res.status(200).render('landing',{nonce: nonce, header, footer, isHosted, AiName: jsonfile.readFileSync('./public/manifest.json').ai_name}); 
});

app.get('/about', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'only signup'});
    }
    let footer = await ejs.renderFile('./views/footer.ejs', {size: 'big'});
    res.status(200).render('about',{nonce: nonce, header, footer, isHosted}); 
});

app.get('/varchar', (req, res) => {
    res.status(200).json(varchar);
});

app.get('/login', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'only signup'});
    }
    res.status(200).render('login',{nonce: nonce, key: '404', header, tutorial, isHosted});
});

app.get('/signup', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'only login'});
    } 
    res.status(200).render('signup',{nonce: nonce, key: '404', header, tutorial, isHosted});
});

app.get('/signup/student', async (req, res) => {
    const filePath = path.join(__dirname, 'views', 'studentSignUp.ejs');
    res.status(200).send({data: await ejs.renderFile(filePath)});
});

app.get('/signup/teacher', async (req, res) => {
    const filePath = path.join(__dirname, 'views', 'teacherSignUp.ejs');
    res.status(200).send({data: await ejs.renderFile(filePath)});
});

app.get('/signup/admin', async (req, res) => {
    const filePath = path.join(__dirname, 'views', 'adminSignUp.ejs');
    res.status(200).send({data: await ejs.renderFile(filePath)});
});

app.post('/create_account', async (req, res) => {
    const profile_info = req.body.info;
    try{
        let memory = new Memory();
        if(profile_info.type == 'student'){
            memory.clusterName = 'student';
        }else if(profile_info.type == 'teacher'){
            memory.clusterName = 'teacher';
        }else if(profile_info.type == 'admin'){
            memory.clusterName = 'master';
            if(profile_info.details.access_token != process.env.Access_Token){
                return res.status(200).json({'message': jsonfile.readFileSync('./config/error_log.json')[9]});
            }
        }else{
            return null;
        }
        let work = await memory.write(profile_info.details);
        if(work?.id){
            res.status(200).json({'id': work.id});
        }else if(work?.status){
            res.status(200).json({'message': jsonfile.readFileSync('./config/error_log.json')[work.status]});
        }else{
            res.status(200).json({'message': 'Profile is not create due to some error, please try again later'});
        }
    }catch(e){
        console.log("Oops! you make some mistake to create a profile\n\n", e);
        return null;
    }
});

app.get('/accountCreated', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    let queryParams = new URLSearchParams(decodeURIComponent(req.originalUrl).split('?')[1]);
    if(queryParams.has('encode')){
        let decoded_url = security.substitutionDecoder(decodeURIComponent(req.originalUrl).split('?encode=')[1], String(varchar.public_key));
        queryParams = new URLSearchParams(decoded_url);
    }
    const name = queryParams.get('name') || 'user';
    const id = queryParams.get('id') || 'Private ID';
    const email = queryParams.get('email') || 'Private Email';
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'both'});
    }
    res.status(200).render('accountCreated',{nonce: nonce, header, tutorial, id, email, name, isHosted});
});

app.get('/docs', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'only signup'});
    };
    res.status(200).send(hex.renderHBS(fs, handlebars, 'docs', {nonce: nonce, key: '404', header, tutorial, isHosted}));
});

app.post('/security', async (req, res) => {
    const view = req.body.view;
    res.status(200).send(hex.renderHBS(fs, handlebars, 'raw_legal', {
        id: view==undefined?0:view,
        AppName: AppName, 
        update: (new Date().toDateString()).substring(4,8)+(new Date().toDateString()).substring(11,16),
        contact: jsonfile.readFileSync('./public/manifest.json').contact,
        developer: jsonfile.readFileSync('./public/manifest.json').developer,
        view: view==undefined?0:view,
        license: view==2?fs.readFileSync(path.join(__dirname,'LICENSE')).toString():''
    }, {compile: false, ejs: ejs}));
});

app.get('/legal', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    let header;
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let [id, expiry] = encripted_info.split("-");
        if(Date.now() < expiry){
            header = await ejs.renderFile('./views/header.ejs', {displayMode: hex.get_UserInitials(id)});
        }
    }else{
        header = await ejs.renderFile('./views/header.ejs', {displayMode: 'only signup'});
    };
    res.status(200).send(hex.renderHBS(fs, handlebars, 'legal', {nonce: nonce, key: '404', header, tutorial, isHosted}));
});

app.get('/dashboard', async (req, res) => {
    try{
        const nonce = res.locals.nonce;
        const token = req.cookies.auth_token;
        if(token){
            const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
            let [id, expiry] = encripted_info.split("-");
            if(Date.now() < expiry){
                let memory = new Memory();
                if(String(id).startsWith('AID')){
                    memory.clusterName = 'student';
                }else if(String(id).startsWith('UID')){
                    memory.clusterName = 'teacher';
                }else if(String(id).startsWith('MID')){
                    memory.clusterName = 'master';
                }else{
                    return null;
                }
                let profile_info = await memory.find_profile(id);
                profile_info.bg = hex.generateBGColor(profile_info.name);
                profile_info = hex.profile_setup(profile_info);

                res.status(200).send(`<section style="text-align: center; margin: 10% auto; font-family: sans-serif;"><h1>Welcome User (${id}) nice to meet you!</h1><p>Currently we can\'t provide you a web interface, because SAIT is under develoment, hope you understand.</p><pre style="text-align: left;">${JSON.stringify(profile_info, null, 2)}</pre></section>`);
            }else{
                res.status(419).send(hex.renderHBS(fs, handlebars, 'session_expire', {nonce: nonce})); //Session Expired
            }
        }else{
            res.status(401).send(hex.renderHBS(fs, handlebars, 'unauthorize_entry', {nonce: nonce})); //unauthorize user open
        }
    }catch(e){
        res.status(400).redirect('/notfound',{error: 500, message: "Some unwanted error occure while setup the dashboard and fetching your information, If you see this error multi-time then please inform us about this faliur, and try some time later..", statement: e});
    }
});

app.post('/update_profile_info', async (req, res) => {
    let memory = new Memory();
    if(String(req.body.id).startsWith('AID')){
        memory.clusterName = 'student';
    }else if(String(req.body.id).startsWith('UID')){
        memory.clusterName = 'teacher';
    }else if(String(req.body.id).startsWith('MID')){
        memory.clusterName = 'master';
    }else{
        return res.status(400).json({"status": false});
    }
    let confirmation = await memory.update_all({"id": req.body.id, "updates": req.body.update_info});
    if(confirmation?.status){
        res.status(400).json({'status': confirmation.status, 'message': jsonfile.readFileSync('./config/error_log.json')[confirmation.status].message});
    }else{
        res.status(200).json({'status': true});
    }
});

app.post('/profile_security_info', async (req, res) => {
    let memory = new Memory();
    if(String(req.body.id).startsWith('AID')){
        memory.clusterName = 'student';
    }else if(String(req.body.id).startsWith('UID')){
        memory.clusterName = 'teacher';
    }else if(String(req.body.id).startsWith('MID')){
        memory.clusterName = 'master';
    }else{
        return res.status(400).json({"status": false});
    }
    let record = await memory.find_profile(req.body.id);
    if(record?.status && Object.keys(record.status).length <= 1){
        res.status(400).json({'status': record.status, 'message': jsonfile.readFileSync('./config/error_log.json')[record.status].message});
    }else{
        if(record.pass == security.substitutionDecoder(req.body.pass, '@Sait2025')){
            res.status(200).json({'profile': security.objDecoder({"fav_book": record.fav_book, "fav_color": record.fav_color, "pass": record.pass}, '@Sait2025')});
        }else{
            res.status(401).json({'status': 10, 'message': jsonfile.readFileSync('./config/error_log.json')[10].message})
        }
    }
});

app.post('/make_relation_between_user', async (req, res) => {
    const relation = req.body.relation;
    let memory = new Memory();
    memory.clusterName = "relationship";

    const fullId = relation.id.sid + "-" + relation.id.tid;
    const relation_info = await memory.find_relation(fullId, String(relation?.subject));
    
    if(!relation_info || relation_info.status === 3){
        relation.rating = 0;
        relation.desc = "";
        const confirmation = await memory.write(relation);
        if(confirmation?.id){
            res.status(200).json({ status: true });
        }else{
            const message = jsonfile.readFileSync('./config/error_log.json')[confirmation.status]?.message || "Unknown error";
            res.status(200).json({ status: confirmation.status, message });
        }
    }else if(relation_info.status === 11){
        const message = jsonfile.readFileSync('./config/error_log.json')[relation_info.status]?.message || "Limit exceeded";
        res.status(200).json({ status: relation_info.status, message });
    }else{
        const existingSubjects = relation_info.subject.split(",").map(s => s.trim());

        if(!existingSubjects.includes(relation.subject)){
            existingSubjects.push(relation.subject);
            const updatedSubjects = existingSubjects.join(",");
            await memory.update({id: fullId, key: 'subject', value: updatedSubjects});
            res.status(200).json({ status: true });
        }else{
            res.status(200).json({ status: false });
        }
    }
});

app.get('/deshboard', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-vercel-forwarded-for'] || req.connection.remoteAddress || req.ip;
    const user = jsonfile.readFileSync('./public/manifest.json').sample_profile;
    const type =  hex.user_type(user.id);
    const promises = [
        ejs.renderFile('./views/sideNav.ejs', {type: type}),
        ejs.renderFile('./views/templates/general.ejs', {isHosted, name: user.name, edge_request: varchar.ipHits[clientIP]}),
        ejs.renderFile('./views/templates/myCourse.ejs'),
        ejs.renderFile('./views/templates/teacher.ejs', {
            type: type, 
            isHosted, 
            users: !isHosted?hex.profile_list_setup(jsonfile.readFileSync('./assets/json/db.json')):[],
            relation: !isHosted?hex.find_MatchingRecords(jsonfile.readFileSync('./assets/json/relation.json'), user.id):[],
        }),
        ejs.renderFile('./views/templates/aiMentor.ejs', {name: user.name}),
        ejs.renderFile('./views/templates/exam.ejs', {isHosted, id: user.id, Category: user.class, stream: user.stream}),
        ejs.renderFile('./views/templates/profile.ejs', {
            user: hex.profile_setup(user, 'self'), 
            type: type, 
            page: type=='student'?await ejs.renderFile('./views/studentSignUp.ejs'):(type=='teacher'?await ejs.renderFile('./views/teacherSignUp.ejs'):(type=='admin'?await ejs.renderFile('./views/adminSignUp.ejs'):''))
        }),
    ];
    Promise.all(promises).then(([sideNav, general, myCourse, teacher, aiMentor, exam, profile]) => {
        res.status(200).render('dashboard', {nonce: nonce, isHosted, user: {name: user.name, bg: hex.generateBGColor(user.name, user.email)}, sideNav, general, myCourse, teacher, aiMentor, exam, profile});
    });
});

app.post('/api/mindvault', (req, res) => {
    let decoded_query = security.substitutionDecoder(req.body.queryKey, process.env.Access_Token || '1441').replaceAll('%20', ' ');
    // console.log(decoded_query);
    let paper = {
        question: jsonfile.readFileSync('./assets/json/geography.json'),
        section: jsonfile.readFileSync('./assets/json/geography.json').section
    }
    res.status(200).json({paper: paper});
});

app.get('/examcall', (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const queryKey = Object.keys(req.query)[0];
    if(queryKey == undefined){
        return res.status(404).render('notfound',{error: 400, message: "Missing or invalid exam token. Please use the official exam link provided by SAIT to proceed"});
    }
    let question, section, fullmarks, time;
    if(queryKey.split("-")[3] == 'AI'){
        question = {};
        section = {};
        fullmarks = 70;
        time = "00:30:50";
    }else{
        question = jsonfile.readFileSync('./assets/json/geography.json');
        section = question.section; 
        fullmarks = 70;
        time = "00:30:50";
    }
    let paper = { 
        init: hex.get_UserInitials(queryKey.split("-")[0]),
        name: queryKey.split("-")[1],
        topic: queryKey.split("-")[2],
        time,
        fullmarks,
        question,
        section
    }
    res.status(200).send(hex.renderHBS(fs, handlebars, 'exam', {
        isHosted, 
        nonce,
        paper: JSON.stringify(paper),
        key: process.env.Access_Token || '1441'
    }, {compile: false, ejs: ejs}));
});

app.get('/medikit', (req, res)=>{
    try{
        const clientIP = req.headers['x-forwarded-for'] || req.headers['x-vercel-forwarded-for'] || req.connection.remoteAddress || req.ip;
        hex.unblockTempUser(varchar, clientIP, res);
        hex.unblockBlockUser(varchar, clientIP, res);
        res.status(200).send("Serum injected!");
    }catch(e){
        res.status(500).send(e);
    }
});

app.all(/.*/, (req, res) => {
    res.status(404).render('notfound',{nonce: res.locals.nonce, error: 404, message: "Page not found on this url, check the source or report it"});
});

// (async ()=>{
//     let memory = new Memory();
//     memory.clusterName = 'rate';
//     console.log(await memory.read());
//     // let basic_info = await memory.find_all(['AIDA1302542@709', 'AIDA1302542@709']);
//     // let basic_info = await memory.find_profile('MIDK5@37402209');
//     // console.log(basic_info);
// })();

server.listen(PORT, (err) => {
    if(err) console.log("Oops an error occure:  "+err);
    console.log(`Compiled successfully!\n\nYou can now view \x1b[33m./${path.basename(__filename)}\x1b[0m in the browser.`);
    console.info(`\thttp://localhost:${PORT}`);
    console.log("\n\x1b[32mNode web compiled!\x1b[0m \n");
});
