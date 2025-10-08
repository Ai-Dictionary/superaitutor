const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const ejs = require('ejs');
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
    next();
});

app.use(helmet.contentSecurityPolicy({
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
        "img-src": ["'self'", "data:", "https://avatars.githubusercontent.com", "https://ai-dictionary.github.io", "https://vercel.com", "https://raw.githubusercontent.com"],
        "connect-src": [
            "'self'",
            "https://maxcdn.bootstrapcdn.com",
            "wss://ws-us3.pusher.com",
            "https://ws-us3.pusher.com",
            "https://chsapi.vercel.app",
        ],
        frameSrc: [
            "'self'",
            "https://vercel.live"
        ],
    },
}));

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

app.get('/', (req, res) => {
    const nonce = res.locals.nonce;
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, html) => {
        if (err) return res.status(200).send('Error to loading the page, contain non-auth scripting!');
        const modifiedHtml = html.replaceAll('<script>', `<script nonce="${nonce}">`);
        res.status(200).send(modifiedHtml);
    });
});

app.get('/varchar', (req, res) => {
    res.status(200).json(varchar);
})

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

app.get('/dashboard', async (req, res) => {
    try{
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
                res.status(401).send('<div style="margin: 10% auto; text-align: center; font-family: sans-serif;"><h2>Session Expired!</h2><p>Please login again, because your Identity card is now expired when check it.<a href="/login">Login</a></p></div>');
            }
        }else{
            res.status(401).send('<div style="margin: 10% auto; text-align: center; font-family: sans-serif;"><h2>We are not get your Identity Card</h2><p>Please login on SAIT at first then use this feature.<br>But if you are already login and still show this error then please contact us.<br><a href="/login">Login</a></p></div>');
        }
    }catch(e){
        res.status(400).redirect('/notfound',{error: 500, message: "Unauthorize entry not allow, check the source or report it", statement: e});
    }
});

app.get('/my_profile_info', async (req, res) => {
    let memory = new Memory();
    if(String(req.body.id).startsWith('AID')){
        memory.clusterName = 'student';
    }else if(String(req.body.id).startsWith('UID')){
        memory.clusterName = 'teacher';
    }else{
        return null;
    }
    let profile_info = await memory.find_profile(req.body.id);
    profile_info.bg = hex.generateBGColor(profile_info.name);
    res.status(200).json(profile_info);
});

app.get('/other_profile_info', async (req, res) => {
    let memory = new Memory();
    if(String(req.body.id).startsWith('AID')){
        memory.clusterName = 'student';
    }else if(String(req.body.id).startsWith('UID')){
        memory.clusterName = 'teacher';
    }else{
        return null;
    }
    let basic_info = await memory.find_profile(req.body.id);
    res.status(200).json({profile_info: hex.profile_setup(basic_info)});
});

app.get('/relation_profile_info', async (req, res) => {
    let memory = new Memory();
    memory.clusterName = "relationship";
    let relation_info = await memory.find_relation(req.body.id);
    if(relation_info && relation_info.length!=0 && relation_info?.status==undefined){
        let id_pool = [];
        for(let i=0; i<relation_info.length; i++){
            id_pool.push(relation_info[i].id);
        }
        if(req.body.id.startsWith('AID')){
            memory.clusterName = 'teacher';
        }else if(req.body.id.startsWith('UID')){
            memory.clusterName = 'student';
        }else{
            return null;
        }
        let relative_info = await memory.find_all(id_pool);
        if(relative_info && relative_info.length!=0 && relative_info?.status==undefined){
            return relative_info;
        }else{
            return null;
        }
    }else{
        return null;
    }

});

app.get('/chat', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const header = await ejs.renderFile('./views/header.ejs');
    res.status(200).render('chatPage',{nonce: nonce, header, isHosted});
});

app.get('/deshboard', async (req, res) => {
    const nonce = res.locals.nonce;
    const isHosted = hex.isHosted(req);
    const sideNav = await ejs.renderFile('./views/sideNav.ejs')
    const promises = [
        ejs.renderFile('./views/templates/general.ejs', {isHosted, name: 'Krishnendu Mitra'}),
        ejs.renderFile('./views/templates/myCourse.ejs'),
        ejs.renderFile('./views/templates/aiMentor.ejs'),
    ];
    Promise.all(promises).then(([general, myCourse, aiMentor]) => {
        res.status(200).render('dashboard',{nonce: nonce, isHosted, sideNav, general, myCourse, aiMentor});
    });
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
//     memory.clusterName = 'student';
//     console.log(await memory.read());
//     // let basic_info = await memory.find_all(['AIDA1302542@709', 'AIDA1302542@709']);
//     let basic_info = await memory.find_profile('MIDK5@37402209');
//     console.log(basic_info);
// })();

server.listen(PORT, (err) => {
    if(err) console.log("Oops an error occure:  "+err);
    console.log(`Compiled successfully!\n\nYou can now view \x1b[33m./${path.basename(__filename)}\x1b[0m in the browser.`);
    console.info(`\thttp://localhost:${PORT}`);
    console.log("\n\x1b[32mNode web compiled!\x1b[0m \n");
});
