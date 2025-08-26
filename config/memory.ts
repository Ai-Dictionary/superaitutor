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
    relationship_id;
    public_key;
    clusterName;
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
        * @type {bool}
    */
    isUpdatable;
    /**
        * @constructor
    */
    constructor (){
        this.student_id = process.env.STUDENT_ID || '';
        this.teacher_id = process.env.TEACHER_ID || '';
        this.feedback_id = process.env.FEEDBACK_ID || '';
        this.relationship_id = process.env.RELATIONSHIP_ID || '';
        this.public_key = String(process.env.PUBLIC_KEY) || '';
        this.secret = security.substitutionDecoder(process.env.private_key, this.public_key).replace(/\\n/g, "\n") || '';
        this.email = security.substitutionDecoder(process.env.client_email, this.public_key) || '';
        this.scopes = ["https://www.googleapis.com/auth/spreadsheets"];
        this.clusterName = '';
        this.isUpdatable = false;
    }
    currentMemory(){
        if(this.clusterName=='student'){
            this.isUpdatable = true;
            return this.student_id;
        }else if(this.clusterName=='teacher'){
            this.isUpdatable = true;
            return this.teacher_id;
        }else if(this.clusterName=='feedback'){
            this.isUpdatable = false;
            return this.feedback_id;
        }else if(this.clusterName=='relationship' || this.clusterName=='rate'){
            this.isUpdatable = true;
            return this.relationship_id;
        }else{
            return '';
        }
    }
    makeUserId(data){
        if(this.clusterName=='student'){
            return this.generateStudentId(data);
        }else if(this.clusterName=='teacher'){
            return this.generateTeacherId(data);
        }else if(this.clusterName=='feedback'){
            return this.generateFeedbackId(data);
        }else if(this.clusterName=='relationship' || this.clusterName=='rate'){
            return this.generateRateId(data);
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
            
            const isDuplicate = rows.some(row => {
                if(['rate', 'relationship'].includes(this.clusterName)){
                    return row._rawData[sheet.headerValues.indexOf('id')] === id;
                }else{
                    return row._rawData[sheet.headerValues.indexOf('email')] === newData.email || 
                            row._rawData[sheet.headerValues.indexOf('contact')] === newData.contact || 
                            row._rawData[sheet.headerValues.indexOf('id')].replace("@", "") === id.replace("@", "");
                }
            });

            if(isDuplicate){
                return {"status": 7};
            }
            newData.id = id;
            if(this.isUpdatable){
                newData.signup_date = this.getTodayDate();
                newData.last_update = this.getTodayDate();
            }else{
                newData.created = this.getTodayDate();
            }
            
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
            if(this.isUpdatable){
                rowToUpdate["_rawData"][rowToUpdate["_worksheet"]["_headerValues"].indexOf("last_update")] = this.getTodayDate();
            }
            
            await rowToUpdate.save();
            return true;
        }catch (e){
            console.error("Error occurred while updating row:", e);
            return {"status": 6};
        }
    }
    async update_all({ id, updates }){
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
            const headerValues = sheet.headerValues;

            const targetIndex = headerValues.indexOf("id");
            if (targetIndex === -1) return {"status": 5};

            const matchingRows = rows.filter((row) => {
                const rawid = row._rawData[targetIndex];
                return String(rawid).trim() === String(id).trim();
            });

            if (matchingRows.length === 0) return {"status": 3};

            const rowToUpdate = matchingRows[matchingRows.length - 1];
            const worksheetHeaders = rowToUpdate._worksheet._headerValues;

            let hasChanges = false;

            for(const [key, value] of Object.entries(updates)){
                if (key === "id") continue; 

                const keyIndex = worksheetHeaders.indexOf(key);
                if (keyIndex === -1) return {"status": 5};

                const currentValue = rowToUpdate._rawData[keyIndex];
                if(String(currentValue).trim() !== String(value).trim()){
                    rowToUpdate._rawData[keyIndex] = value;
                    hasChanges = true;
                }
            }

            if (!hasChanges) return {"status": 8};

            const lastUpdateIndex = worksheetHeaders.indexOf("last_update");
            if(lastUpdateIndex !== -1 && this.isUpdatable){
                rowToUpdate._rawData[lastUpdateIndex] = this.getTodayDate();
            }

            await rowToUpdate.save();
            return true;
        }catch(e){
            console.error("Error occurred while updating row:", e);
            return {"status": 6};
        }
    }
    async truncate(){
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

            for(const row of rows){
                await row.delete();
            }
            return true;
        }catch(e){
            console.error("Error occure when try to truncating the memory:", e);
            return {"status": 4};
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
    generateFeedbackId(feedback){
        const { type, from, email, related, created } = feedback;

        const prefix = "LID";

        const [firstName, lastName] = from.trim().split(" ");
        const ff = (firstName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");
        const ll = (lastName[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const emailPrefix = email.trim().toLowerCase().slice(0, 2);
        const asciiSum = emailPrefix.charCodeAt(0) + emailPrefix.charCodeAt(1);

        const t = (type.trim()[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const r = (related.trim()[0].toUpperCase().charCodeAt(0) - 64).toString().padStart(2, "0");

        const [day, month, year] = created.split("-");
        const isoDate = `${year}-${month}-${day}`;
        const dateObj = new Date(isoDate);

        const dd = String(dateObj.getDate()).padStart(2, "0");
        const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
        const yyyy = dateObj.getFullYear();
        const yySum = yyyy.toString().split("").reduce((sum, d) => sum + parseInt(d), 0).toString().padStart(2, "0");

        const numericPart = `${ff}${ll}${asciiSum}${t}${r}${dd}${mm}${yySum}`;

        const atIndex = Math.floor(Math.random() * numericPart.length);
        const idWithAt = numericPart.slice(0, atIndex) + "@" + numericPart.slice(atIndex);

        return prefix + idWithAt;
    }
    generateRateId(data){
        const sid = data?.id?.sid || data?.sid;
        const tid = data?.id?.tid || data?.tid;
        return `${sid}-${tid}`;
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

