const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
let security;
try{
    security = require('./security');
}catch{
    security = require('./security.ts');
}
require('dotenv').config();

/**
    * @class MEMORY
*/
class MEMORY{
    /**
        * @type {string}
    */
    student_id;
    teacher_id;
    feedback_id;
    public_key;
    memoryName;
    /**
        * @type {any}
    */
    secret;
    email;
    /**
        * @type {string[]}
    */
    scopes;
    /**
        * @constructor
    */
    constructor (){
        this.student_id = process.env.STUDENT_ID || '';
        this.teacher_id = process.env.TEACHER_ID || '';
        this.feedback_id = process.env.FEEDBACK_ID || '';
        this.public_key = String(process.env.PUBLIC_KEY) || '';
        this.secret = security.substitutionDecoder(process.env.private_key, this.public_key).replace(/\\n/g, "\n") || '';
        this.email = security.substitutionDecoder(process.env.client_email, this.public_key) || '';
        this.scopes = ["https://www.googleapis.com/auth/spreadsheets"];
        this.memoryName = '';
    }
    currentMemory(){
        if(this.memoryName=='student'){
            return this.student_id;
        }else if(this.memoryName=='teacher'){
            return this.teacher_id;
        }else if(this.memoryName=='feedback'){
            return this.feedback_id;
        }else{
            return '';
        }
    }
    makeUserId(data){
        if(this.memoryName=='student'){
            return this.generateStudentId(data);
        }else if(this.memoryName=='teacher'){
            return this.generateTeacherId(data);
        }else if(this.memoryName=='feedback'){
            return '';
        }else{
            return '';
        }
    }
    async read(){
        try{ 
            const client = new JWT({
                email: this.email,
                key: this.secret,
                scopes: this.scopes,
            });
            const doc = new GoogleSpreadsheet(this.currentMemory(), client);
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
            return {"status": 1};
        }

    }
    async write(newData){
        try{
            const client = new JWT({
                email: this.email,
                key: this.secret,
                scopes: this.scopes,
            });
            const doc = new GoogleSpreadsheet(this.currentMemory(), client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();

            const rows = await sheet.getRows();
            
            const id = this.makeUserId(newData);
            
            const isDuplicate = rows.some(row =>
                row.email === newData.email || row.contact === newData.contact || row.id.replace("@","") === id.replace("@","")
            );

            if(isDuplicate){
                return {"status": 7};
            }
            newData.id = id;
            newData.signup_date = this.getTodayDate();
            newData.last_update = this.getTodayDate();

            await sheet.addRow(newData);
            return true;
        }catch(e){
            console.error("Error occure when try to writting on sheet:", e);
            return {"status": 2};
        }
    }
    async delete(id){
        try{
            const idToDelete = id;
            const client = new JWT({
                email: this.email,
                key: this.secret,
                scopes: this.scopes,
            });
            const doc = new GoogleSpreadsheet(this.currentMemory(), client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();
            
            const rows = await sheet.getRows();
            const matchingRows = rows.filter((row) => {
                const rawid = row._rawData[sheet.headerValues.indexOf("id")];
                return String(rawid).trim() === String(idToDelete).trim();
            });

            if(matchingRows.length === 0){
                return {"status": 3};
            }

            const rowToDelete = matchingRows[matchingRows.length - 1];
            await rowToDelete.delete();

            return true;
        }catch(e){
            console.error("Error occure when try to deleting row:", e);
            return {"status": 4};
        }
    }
    async update({ id, key, value }){
        try{
            const client = new JWT({
                email: this.email,
                key: this.secret,
                scopes: this.scopes,
            });

            const doc = new GoogleSpreadsheet(this.currentMemory(), client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();

            const rows = await sheet.getRows();

            const targetIndex = sheet.headerValues.indexOf("id");
            const updateIndex = sheet.headerValues.indexOf(key);

            if((targetIndex === -1 || updateIndex === -1) && key != 'id'){
                return {"status": 5};
            }

            const matchingRows = rows.filter((row) => {
                const rawid = row._rawData[targetIndex];
                return String(rawid).trim() === String(id).trim();
            });

            if(matchingRows.length === 0){
                return {"status": 3};
            }

            const rowToUpdate = matchingRows[matchingRows.length - 1];
            const keyIndex = rowToUpdate["_worksheet"]["_headerValues"].indexOf(key);
            
            if(rowToUpdate["_rawData"][keyIndex] == value){
                return {"status": 8};
            }
            
            rowToUpdate["_rawData"][keyIndex] = value;
            rowToUpdate["_rawData"][rowToUpdate["_worksheet"]["_headerValues"].indexOf("last_update")] = this.getTodayDate();
            
            await rowToUpdate.save();

            return true;
        }catch (e){
            console.error("Error occurred while updating row:", e);
            return {"status": 6};
        }
    }
    generateStudentId(student){
        const { name, dob, email, pin, contact, parent_name } = student;

        const prefix = "AID";

        const x = name.trim()[0].toUpperCase();

        const birthYear = dob.split("-")[2];
        const y = birthYear[birthYear.length - 1];

        const emailPrefix = email.trim()[0] + email.trim()[1];
        const asciiSum = emailPrefix.charCodeAt(0) + emailPrefix.charCodeAt(1);
        const pinStr = pin.toString();
        const lastThreePin = parseInt(pinStr.slice(-3), 10);
        const zzz = asciiSum + lastThreePin;

        const contactSum = contact.toString().split("").reduce((sum, digit) => sum + parseInt(digit), 0);
        const n = contactSum.toString().slice(-1);

        const [parentFirst, parentLast] = parent_name.trim().split(" ");
        const parentAsciiSum = parentFirst.charCodeAt(0) + parentLast.charCodeAt(0);
        const p = parentAsciiSum.toString().slice(-1);

        const dd = String(this.getTodayDate()).split("-")[0];

        const signupYear = String(this.getTodayDate()).split("-")[2];
        const yy = signupYear.split("").reduce((sum, digit) => sum + parseInt(digit), 0).toString().padStart(2, "0");

        const numericPart = `${x}${y}${zzz}${n}${p}${dd}${yy}`;

        const atIndex = Math.floor(Math.random() * numericPart.length);
        const idWithAt = numericPart.slice(0, atIndex) + "@" + numericPart.slice(atIndex);

        return prefix + idWithAt;
    }
    generateTeacherId(teacher){
        const { name, email, pin, contact, subject } = teacher;

        const prefix = "UID";

        const [firstName, lastName] = name.trim().split(" ");

        const ff = (firstName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const ll = (lastName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const emailPrefix = email.trim().toLowerCase()[0] + email.trim().toLowerCase()[1];
        const asciiSum = emailPrefix.charCodeAt(0) + emailPrefix.charCodeAt(1);
        const lastThreePin = parseInt(pin.toString().slice(-3), 10);
        const zzz = (asciiSum + lastThreePin).toString().padStart(3, "0");

        const contactSum = contact.toString().split("").reduce((sum, digit) => sum + parseInt(digit), 0);
        const n = contactSum.toString().slice(-1);

        const s = (subject.trim()[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const dd = String(this.getTodayDate()).split("-")[0];

        const signupYear = String(this.getTodayDate()).split("-")[2];
        const yy = signupYear.split("").reduce((sum, digit) => sum + parseInt(digit), 0).toString().padStart(2, "0");

        const numericPart = `${ff}${ll}${zzz}${n}${s}${dd}${yy}`;

        const atIndex = Math.floor(Math.random() * numericPart.length);
        const idWithAt = numericPart.slice(0, atIndex) + "@" + numericPart.slice(atIndex);

        return prefix + idWithAt;
    }
    getTodayDate(){
        const today = new Date();

        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();

        return `${dd}-${mm}-${yyyy}`;
    }
}


module.exports = MEMORY;

