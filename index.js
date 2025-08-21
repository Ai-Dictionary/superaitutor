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
let varchar, security, hex;
try{
    varchar = require('./config/env-variables');
    security = require('./config/security');
    hex = require('./config/hex');
}catch{
    varchar = require('./config/env-variables.ts');
    security = require('./config/security.ts');
    hex = require('./config/hex.ts');
}

require('./public/App.test.js');
require('dotenv').config();

const app = express();
let server = http.createServer(app);
const PORT = process.env.PORT || 6100;
const AppName = "superAITutor";

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/assets', express.static(path.join(__dirname,'assets'), hex.isHosted(PORT) ? { maxAge: '30d' } : {}));
app.use('/config', express.static(path.join(__dirname,'config'), hex.isHosted(PORT) ? { maxAge: '30d' } : {}));
app.use('/public', express.static(path.join(__dirname,'public'), hex.isHosted(PORT) ? { maxAge: '30d' } : {}));

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
            (req, res) => `'nonce-${res.locals.nonce}'`
        ],
        // "script-src-attr": ["'unsafe-inline'"],
        "style-src": [
            "'self'",
            "https://fonts.googleapis.com",
            "https://maxcdn.bootstrapcdn.com",
            "https://stackpath.bootstrapcdn.com",
            "'unsafe-inline'" 
        ],
        "font-src": [
            "'self'",
            "https://maxcdn.bootstrapcdn.com",
            "https://stackpath.bootstrapcdn.com",
            "https://fonts.gstatic.com",
            "data:"
        ],
        "img-src": ["'self'", "data:", "https://avatars.githubusercontent.com", "https://ai-dictionary.github.io"],
        "connect-src": ["'self'"],
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
        const cookieBlock = hex.isClientBlockedByCookie(req);
        
        if(varchar.blockedIPs.includes(clientIP) || cookieBlock === 'blocked'){
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


app.get('/', (req, res) => {
    const nonce = res.locals.nonce;
    fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, html) => {
        if (err) return res.status(200).send('Error to loading the page, contain non-auth scripting!');
        const modifiedHtml = html.replaceAll('<script>', `<script nonce="${nonce}">`);
        res.status(200).send(modifiedHtml);
    });
});

app.all(/.*/, (req, res) => {
    res.status(404).render('notfound',{error: 404, message: "Page not found on this url, check the source or report it"});
});

server.listen(PORT, (err) => {
    if(err) console.log("Oops an error occure:  "+err);
    console.log(`Compiled successfully!\n\nYou can now view \x1b[33m./${path.basename(__filename)}\x1b[0m in the browser.`);
    console.info(`\thttp://localhost:${PORT}`);
    console.log("\n\x1b[32mNode web compiled!\x1b[0m \n");
});