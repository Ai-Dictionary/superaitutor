/** @type {NodeJS.Require} */
var require = require;
const { GoogleSpreadsheet } = require("google-spreadsheet");
const { JWT } = require("google-auth-library");
let security, hex;
try{
    security = require('./security');
    hex = require('./hex');
}catch{
    security = require('./security.ts');
    hex = require('./hex.ts');
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
    master_id;
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
        this.master_id = process.env.MASTER_ID || '';
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
        }else if(this.clusterName=='master' || this.clusterName=='admin'){
            this.isUpdatable = true;
            return this.master_id;
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
            return security.generateStudentId(data);
        }else if(this.clusterName=='teacher'){
            return security.generateTeacherId(data);
        }else if(this.clusterName=='master' || this.clusterName=='admin'){
            return security.generateAdminId(data);
        }else if(this.clusterName=='feedback'){
            return security.generateFeedbackId(data);
        }else if(this.clusterName=='relationship' || this.clusterName=='rate'){
            return security.generateRateId(data);
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
                newData.signup_date = security.getTodayDate();
                newData.last_update = security.getTodayDate();
            }else{
                newData.created = security.getTodayDate();
            }
            
            await sheet.addRow(newData);
            return {"id": id};
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
                rowToUpdate["_rawData"][rowToUpdate["_worksheet"]["_headerValues"].indexOf("last_update")] = security.getTodayDate();
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
                rowToUpdate._rawData[lastUpdateIndex] = security.getTodayDate();
            }

            await rowToUpdate.save();
            return true;
        }catch(e){
            console.error("Error occurred while updating row:", e);
            return {"status": 6};
        }
    }
    async find_profile(id){
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

            const match = rows.find(row => {
                const rawId = row._rawData[sheet.headerValues.indexOf((id.startsWith('AID') || id.startsWith('UID'))?'id':'email')];
                return rawId && rawId === id;
            });

            if (!match) return {"status": 3};

            const result = {};
            sheet.headerValues.forEach((key, i) => {
                result[key] = match._rawData[i];
            });
            return result;
        }catch(e){
            console.error("Error to finding specific row by ID:", e);
            return {"status": 1};
        }
    }
    async find_relation(id){
        try{
            const client = new JWT({
                email: this.email,
                key: this.secret,
                scopes: this.scopes,
            });

            const doc = new GoogleSpreadsheet(this.relationship_id, client);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            await sheet.loadHeaderRow();

            const rows = await sheet.getRows();

            const matches = rows.filter(row => {
                const rawId = row._rawData[sheet.headerValues.indexOf('id')];
                if (!rawId) return false;
                if(id.startsWith('AID')){
                    return rawId.split("-")[0] === id;
                }else{
                    return rawId.split("-")[1] === id;
                }
            });

            if (matches.length === 0) return { status: 3 };

            const results = matches.map(row => {
                const obj = {};
                sheet.headerValues.forEach((key, i) => {
                    obj[key] = row._rawData[i];
                });
                return obj;
            });

            return results;
        }catch(e){
            console.error("Error to finding specific relation by ID:", e);
            return {"status": 1};
        }
    }
    async find_all(id_list){
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
            
            let results = [];
            for(let j=0; j<id_list.length; j++){

                const id = id_list[j];
                const matches = rows.filter(row => {
                    const rawId = row._rawData[sheet.headerValues.indexOf('id')];
                    if (!rawId) return false;
                    if(id.startsWith('AID')){
                        return rawId.split("-")[0] === id;
                    }else{
                        return rawId.split("-")[1] === id;
                    }
                });

                let result = matches.map(row => {
                    const obj = {};
                    sheet.headerValues.forEach((key, i) => {
                        obj[key] = row._rawData[i];
                    });
                    return hex.profile_setup(obj);
                });
                // @ts-ignore
                if (result.length!=0) results.push(result[0]);
            }
            return results;
        }catch(e){
            console.error("Error to finding specific relation by ID:", e);
            return {"status": 1};
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
}

// @ts-ignore
module.exports = MEMORY;

