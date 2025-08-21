const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
const secure = require("./fork.json");
let security;
try{
    security = require('./security');
}catch{
    security = require('./security.ts');
}
require('dotenv').config();

class memory{
    constructor (){
        this.student_id = process.env.STUDENT_ID || '';
        this.secret = '';
        this.scopes = ["https://www.googleapis.com/auth/spreadsheets"];
    }
    async read(){
        try{
            this.secret = await security.objDecoder(secure, String(process.env.PUBLIC_KEY));
            const client = new JWT({
                email: await security.substitutionDecoder(process.env.client_email, String(process.env.PUBLIC_KEY)),
                key: this.secret.private_key.replace(/\\n/g, "\n"),
                scopes: this.scopes,
            });
            const doc = new GoogleSpreadsheet(this.student_id, client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();
            
            const rows = await sheet.getRows();

            const data = rows.map((row) => {
                const obj = {};
                sheet.headerValues.forEach((key, i) => {
                    obj[key] = row._rawData[i];
                });
                return obj;
            });

            return data;
        }catch(e){
            console.error("Error reading sheet:", e);
        }

    }
    async write(newData){
        try{
            this.secret = await security.objDecoder(secure, String(process.env.PUBLIC_KEY));
            const client = new JWT({
                email: await security.substitutionDecoder(process.env.client_email, String(process.env.PUBLIC_KEY)),
                key: this.secret.private_key.replace(/\\n/g, "\n"),
                scopes: this.scopes,
            });
            const doc = new GoogleSpreadsheet(this.student_id, client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();

            await sheet.addRow(newData);
            console.log("Data added");
        }catch(e){
            console.error("Error writing to sheet:", e);
        }
    }
    async delete(roll){
        try{
            this.secret = await security.objDecoder(secure, String(process.env.PUBLIC_KEY));
            const rollToDelete = roll;
            const client = new JWT({
                email: await security.substitutionDecoder(process.env.client_email, String(process.env.PUBLIC_KEY)),
                key: this.secret.private_key.replace(/\\n/g, "\n"),
                scopes: this.scopes,
            });
            const doc = new GoogleSpreadsheet(this.student_id, client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();
            
            const rows = await sheet.getRows();
            const matchingRows = rows.filter((row) => {
                const rawRoll = row._rawData[sheet.headerValues.indexOf("roll")];
                return String(rawRoll).trim() === String(rollToDelete).trim();
            });
            if(matchingRows.length === 0){
                return `No row found with roll ${rollToDelete}`;
            }
            const rowToDelete = matchingRows[matchingRows.length - 1];
            await rowToDelete.delete();

            console.log(`Deleted last row with roll number ${rollToDelete}`);
        }catch(e){
            console.error("Error deleting row:", e);   
        }
    }
}


module.exports = memory;

