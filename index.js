const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const ejs = require('ejs');
const jsonfile = require('jsonfile');
let varchar, security, hex;
try{
    varchar = require('./config/env-variables');
    security = require('./config/security');
    hex = require('./config/hex');
}catch(e){
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


app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'public', 'index.html'));
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