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
app.use('/config', express.static(path.join(__dirname,'config'), hex.isHosted(PORT) ? { maxAge: '30d', lastModified: true, setHeaders: function (res, path) {res.setHeader('Cache-Control', 'public, max-age=2592000, must-revalidate');}} : {}));
// app.use('/public', express.static(path.join(__dirname,'public')));
app.use('/public', express.static(path.join(__dirname,'public'), hex.isHosted(PORT) ? { maxAge: '0d', lastModified: true, setHeaders: function (res, path) {res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');}} : {}));

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
            (req, res) => `'nonce-${res.locals.nonce}'`
        ],
        "script-src-attr": ["'unsafe-inline'"],
        "style-src": [
            "'self'",
            "https://fonts.googleapis.com",
            "https://maxcdn.bootstrapcdn.com",
            "https://stackpath.bootstrapcdn.com",
            "https://ai-dictionary.github.io",
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
        
        if(varchar.blockedIPs.includes(clientIP) || cookieBlock === 'blocked' || (!userAgent || userAgent.includes('bot') || userAgent.length < 10)){
            console.warn(`Blocked IP attempt to attack: ${clientIP}`);
            return req.destroy() || res.connection.destroy();
        }
        if(varchar.tempBlockedIPs.has(clientIP) || cookieBlock === 'temp'){
            const blockedAt = varchar.tempBlockedIPs.get(clientIP);
            const now = Date.now();
            if(now - blockedAt < BLOCK_DURATION_MS || cookieBlock === 'temp'){
                return res.status(403).send('Your IP is temporarily blocked due to excessive requests. Try again later.');
            }else{
                varchar.tempBlockedIPs.delete(clientIP);
                varchar.ipHits[clientIP] = 0;
            }
        }
        if(Object.keys(varchar.ipHits).length >= 10000 && !varchar.ipHits[clientIP]){
            console.warn(`Max users limit reached. Dropping new user with IP: ${clientIP}`);
            return res.status(429).send('Server is too busy now, Because to many user is present in the lobby. Please try again some time later or report us');
        }
        varchar.ipHits[clientIP] = (varchar.ipHits[clientIP] || 0) + 1;
        if(varchar.ipHits[clientIP] > 100 && varchar.ipHits[clientIP] < 200){
            varchar.tempBlockedIPs.set(clientIP, Date.now());
            delete varchar.ipHits[clientIP];
            hex.setBlockCookie(res, 'temp');
            return res.status(403).send('Your IP has been temporarily blocked due to exceed the request limit. Please check our fair use policy.');
        }
        if(varchar.ipHits[clientIP] >= 200){
            varchar.blockedIPs.push(clientIP);
            varchar.tempBlockedIPs.delete(clientIP);
            delete varchar.ipHits[clientIP];
            hex.setBlockCookie(res, 'blocked');
            return res.status(403).send('Access denied, client ip is blocked due to past history of mal-practices!');
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
    }else{
        memory.clusterName = 'student';
        profile_info = await memory.find_profile(email);
        if(profile_info?.status==3 && (!profile_info || Object.keys(profile_info).length === 0)){
            memory.clusterName = 'teacher';
            profile_info = await memory.find_profile(email);
        }
    }
    
    if(profile_info?.status!=3 && profile_info && Object.keys(profile_info).length > 0){
        if((profile_info.id === email || profile_info.email === email) && profile_info.pass === password){
            const expiryTime = Date.now() + 30 * 60 * 1000;
            const tokenPayload = JSON.stringify({ token: security.substitutionEncoder(String(email+'-'+expiryTime), 'security') });

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

app.get('/login', async (req, res) => {
    const nonce = res.locals.nonce;
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    const token = req.cookies.auth_token;
    if(token && hex.isHosted(req)){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let expiry = encripted_info.split("-")[1];
        if(Date.now() < expiry){
            return res.status(200).redirect("/deshboard");
        }
    }
    res.status(200).render('login',{nonce: nonce, key: '404', tutorial});
});

app.get('/signup', async (req, res) => {
    const nonce = res.locals.nonce;
    const tutorial = await ejs.renderFile('./views/quickTutorial.ejs', {
        link: 'https://youtube.com/@AiDictionary-e2x',
    });
    res.status(200).render('signup',{nonce: nonce, key: '404', tutorial});
});

app.get('/deshboard', (req, res) => {
    const token = req.cookies.auth_token;
    if(token){
        const encripted_info = security.substitutionDecoder(String((JSON.parse(token))?.token), 'security');
        let expiry = encripted_info.split("-")[1];
        if(Date.now() < expiry){
            res.status(200).send('<section style="text-align: center; margin: 10% auto; font-family: sans-serif;"><h1>Welcome Krish nice to meet you!</h1><p>Currently we can\'t provide you a web interface, because SAIT is under develoment, hope you understand.</p></section>');
        }else{
            res.status(401).send('<div style="margin: 10% auto; text-align: center; font-family: sans-serif;"><h2>Session Expired!</h2><p>Please login again, because your Identity card is now expired when check it.<a href="/login">Login</a></p></div>');
        }
    }else{
        res.status(401).send('<div style="margin: 10% auto; text-align: center; font-family: sans-serif;"><h2>We are not get your Identity Card</h2><p>Please login on SAIT at first then use this feature.<br>But if you are already login and still show this error then please contact us.<br><a href="/login">Login</a></p></div>');
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
    return profile_info;
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
    return hex.profile_setup(basic_info);
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

app.all(/.*/, (req, res) => {
    res.status(404).render('notfound',{nonce: res.locals.nonce, error: 404, message: "Page not found on this url, check the source or report it"});
});

// (async ()=>{
//     let memory = new Memory();
//     memory.clusterName = 'student';
//     // console.log(await memory.read());
//     let basic_info = await memory.find_all(['AIDA1302542@709', 'AIDA1302542@709']);
//     // let basic_info = await memory.find_profile('AIDA1302542@709');
//     console.log(basic_info);
// })();

server.listen(PORT, (err) => {
    if(err) console.log("Oops an error occure:  "+err);
    console.log(`Compiled successfully!\n\nYou can now view \x1b[33m./${path.basename(__filename)}\x1b[0m in the browser.`);
    console.info(`\thttp://localhost:${PORT}`);
    console.log("\n\x1b[32mNode web compiled!\x1b[0m \n");
});
