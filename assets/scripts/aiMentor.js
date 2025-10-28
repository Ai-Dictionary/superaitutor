class Chat {
    constructor() {
        this.loc = window.location;
        this.history = undefined;
        this.voice = true;
        this.pageId = ".chatBox";
        this.inputId = "input";
        this.sendBtnId = ".send";
        this.messageAreaId = "message-section";
        this.greetId = ".dume";
        this.optionsId = "#dume-options";
        this.currentBot = undefined;
        this.chatList_active = false;
        this.error_log = [
            {"code": 0, "desc": "Unexpeted error, You haven't entered any message yet. Please type something before sending your request."},
            {"code": 1, "desc": "File corrupted, and cannot be opened. Please obtain a fresh copy of the programe, or recover it for get the chat info from it."},
            {"code": 2, "desc": "Process failed, server not get chat history data from nano_json file. Please make sure that nano_json file are choose correctly."},
            {"code": 3, "desc": "Unexpted error, metadata of chat data is missing from selected nano_json file. Please make sure that nano_json file are choose correctly."},
            {"code": 4, "desc": "Process failed, system cann't harvest chat data from selcted nano_json file. Please choose any other nano_json file."},
            {"code": 5, "desc": "An <strong>error</strong> occurred. There was an error generating your response query, it is seem like backend Ti-Lama model is absent to handle this query, Please try some time later..<br><br> If this issue persists please contact us through our feedback line info.aidictionary24x7@gmail.com"},
            {"code": 6, "desc": "<strong>System error</strong>:<br>Compiler not create parser tree for the above LLM code and text content due to some connection error. That's why highlighter is also absent, check the correctness of this responce physically!"},
            {"code": 7, "desc": "An error occurred. There was an error getting when deleting your chat data. If this issue persists please your console pannel to identify the error."}
        ];
    }
    setUp(){
        const inputField = document.getElementById(this.inputId);
        inputField.addEventListener("keydown", function (e) {
            if (e.code === "Enter" && e.ctrlKey) {
                chat.messageSynthesis();
            }
        });
        const list = document.querySelector(this.optionsId);
        list.addEventListener("click", (e) => {
            if (e.target && e.target.tagName === "LI") {
                const clickedText = e.target.innerText.trim();
                this.addChat(clickedText, "user");
                this.addChat(`I can't understand your inquery using only the <strong>${clickedText}</strong>, which you enterd from the demo options, Please describe more about it, mean actually what you want, then i am give you the perfect answer.<br><br>If you are still confused then please check out our <a href='/docs'>Docs</a> Page for more information.`,"bot");
            }
        });
    }
    voiceOver(message){
        if (this.voice) {
            if (message == '' || message == undefined) {
                message = "This feature is not available in this version, please try another options";
            } try {
                const speech = new SpeechSynthesisUtterance();
                speech.lang = "en";
                speech.text = message;
                speech.volume = 1;
                speech.rate = 1;
                speech.pitch = 1;
                speech.gender = "male";
                window.speechSynthesis.speak(speech);
            } catch (e) {
                console.log(e);
            }
        }
    }
    textExtrector(id){
        return String(document.querySelector(`.${id}`).textContent);
    }
    messageSynthesis() {
        const inputField = document.getElementById(this.inputId);
        document.getElementById(this.inputId).disabled = true;
        document.querySelector(this.sendBtnId).innerHTML = "<i class='fa fa-circle-o-notch'></i>";
        let input = inputField.value.trim();
        if (input == "" || input == " " || input == undefined) {
            return this.addChat(0, 'error');
        }
        inputField.value = "";
        this.addChat(input, 'user');
        try {
            input != "" && this.output(input);
            setTimeout(() => {
                document.getElementById(this.inputId).disabled = false;
                document.querySelector(this.sendBtnId).innerHTML = "<i class='fa fa-send'></i>";
            }, 2000);
        } catch (e) {
            this.addChat(5, 'error');
        }
    }
    output(input) {
        let response;
        let text = input.toLowerCase().replace(/[^\w\s\d]/gi, "");
        text = text
            .replace(/[\W_]/g, " ")
            .replace(/ a /g, " ")
            .replace(/write the query /g, "")
            .replace(/write the code/g, "what is")
            .replace(/please /g, "")
            .replace(/ please/g, "")
            .trim();
        let comparedText = this.compare(userMessage, botReply, text);
        response = comparedText ? comparedText : alternative[Math.floor(Math.random() * alternative.length)];
        this.addChat(response, 'bot');
    }
    compare(triggerArray, replyArray, string) {
        let item, items;
        for (let x = 0; x < triggerArray.length; x++) {
            for (let y = 0; y < replyArray.length; y++) {
                if (triggerArray[x][y] == string) {
                    items = replyArray[x];
                    item = items[Math.floor(Math.random() * items.length)];
                }
            }
        }
        if (item) return item;
        else return this.containMessageCheck(string);
    }
    containMessageCheck(string){
        let item, items;
        for (let x = 0; x < expectedMessage.length; x++) {
            if (expectedMessage[x].includes(string)) {
                items = expectedReply[x];
                item = items[Math.floor(Math.random() * items.length)];
            }
        }
        return item;
    }
    addChat (input, type) {
        const mainDiv = document.getElementById(this.messageAreaId);
        document.querySelector(this.greetId).style.display = "none";
        document.querySelector(this.optionsId).style.display = "none";
        document.getElementById(this.messageAreaId).style.height = "80%";
        if (type == 'user') {
            let userDiv = document.createElement("div");
            userDiv.id = "user";
            userDiv.classList.add("message");
            userDiv.innerText = `${input}`;
            mainDiv.appendChild(userDiv);
        } else if (type == 'bot') {
            let code_present = 0; 
            let id = this.codeIdGenerator();
            let botDiv = document.createElement("div");
            botDiv.classList.add("message");
            if (String(input).search("```") != -1) {
                input = input.replaceAll(" ```", `<div class="code-editor">
                    <ul class="tabs codeheader_Clang"><li class="tab" title="Language Name">Code</li>
                    <li class="tabi"><span onclick="system.copy('#${id}_c');" title="Copy this code"><i class="fa fa-clone"></i></span>
                    <span onclick="system.downloadCode('${id}_c','main_${id}_c.txt');" title="Download it in text file"><i class="fa fa-download"></i></span></li></ul>
                    <div class="code-wrapper"><pre class="code language-sql" contenteditable="false" spellcheck="false" id="${id}_c">`);
                input = input.replaceAll("``` ", `</pre></div></div>`);
                code_present++;
            }
            botDiv.innerHTML = `<div id="bot"><span id="bot-response" class="${id}">${input}</span></div>
                <div class="flx options">
                    <i class="fa fa-clone" title="Copy the answer on your clipboard" onclick="system.copy('.${id}');"></i>
                    <i class="fa fa-volume-up" title="Listen the answer carefully" onclick="chat.voiceOver(chat.textExtrector('${id}').replaceAll(/'/g, ','));"></i>
                    <i class="fa fa-thumbs-o-down" title="Feed this answer on your favour" onclick="route('/feedback');"></i>
                    <i class="fa fa-trash-o" title="Delete this chat" onclick="chat.delete(this);"></i>
                </div>`;
            mainDiv.appendChild(botDiv);
            // try {
            //     if (code_present != 0) {
            //         sqlCompiler = eval(compiler.sqlCompiler);
            //         sqlCompiler('#' + id +'_c');
            //         code_present--;
            //     }
            // } catch (e) {
            //     this.addChat(6, 'error');
            // }
            var scroll = document.getElementById(this.messageAreaId);
            scroll.scrollTop = scroll.scrollHeight;
        } else if (type == 'import' || type == 'separetor') {
            let separetorDiv = document.createElement("div");
            separetorDiv.id = "separetor";
            separetorDiv.classList.add("message");
            separetorDiv.innerHTML = `<hr><span id="separetor-response">${input}</span><hr>`;
            mainDiv.appendChild(separetorDiv);
            var scroll = document.getElementById(this.messageAreaId);
            scroll.scrollTop = scroll.scrollHeight;
        } else if (type == 'error') {
            let error = this.error_log[input] == undefined ? 'An Error occure, please contact us to resolve it.' : this.error_log[input].desc;
            let errorDiv = document.createElement("div");
            errorDiv.id = "error";
            errorDiv.classList.add("message");
            errorDiv.innerHTML = `<span id="error-response">${error}</span>`;
            mainDiv.appendChild(errorDiv);
        } else {
            this.voiceOver("Some unwanted resource allocation command hit server..");
        }
    }
    insertQuestion (question) {
        document.getElementById(this.inputId).value = question;
    }
    codeIdGenerator() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        let id = '';
        for (let i = 0; i < 8; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        return id;
    }
    encoder (message, type, key) {
        if (type == 'bot') {
            message = message.replace(/<div class="code-editor">.*?<pre class="code language-sql".*?>|<\/pre><\/div><\/div>/gs, (match) => {
                if (match.includes('</pre>')) {
                    return '``` ';
                } else {
                    return ' ```';
                }
            }).replace(/<span class=".*?>|<\/span>/gs, (match) => {
                if (match.includes('</span>')) {
                    return '';
                } else {
                    return '';
                }
            });
        }
        let encoder = eval(config.security.encodedData);
        let hashed_message = Array(key).fill().reduce((acc) => encoder(acc), message);
        return hashed_message;
    }
    deleteChat () {
        try {
            const mainDiv = document.getElementById(this.messageAreaId);
            let l = mainDiv.childNodes.length;
            for (let i = 2; i < l; i++) {
                mainDiv.removeChild(mainDiv.childNodes[2]);
            }
            document.querySelector(this.greetId).style.display = "block";
            document.querySelector(this.optionsId).style.display = "flex";
            document.getElementById(this.messageAreaId).style.height = "70%";
        } catch (e) {
            system.handelPyError(this.error_log[7]);
            console.error("An error occurred. There was an error getting when deleting your chat data.\n" + e);
        }
    }
    delete(clickedElement) {
        try {
            const messageDiv = clickedElement.closest('.message');
            if (messageDiv) {
                messageDiv.remove();
            }
            if(document.getElementById(this.messageAreaId).childNodes.length <= 3){
                document.querySelector(this.greetId).style.display = "block";
                document.querySelector(this.optionsId).style.display = "flex";
                document.getElementById(this.messageAreaId).style.height = "70%";
            }
        } catch (e) {
            system.handelPyError(this.error_log[7]);
            console.error("An error occurred while deleting the chat.\n" + e);
        }
    }
    chatList_toggle(listName, mainName){
        if(this.chatList_active){
            document.querySelector(listName).style.display = "none";
            document.querySelector(mainName).style.width = "100%";
            this.chatList_active = false;
        }else{
            document.querySelector(listName).style.display = "block";
            document.querySelector(mainName).style.width = "80%";
            this.chatList_active = true;
        }
    }
    changeBot(botName){
        this.currentBot = botName;
        try{
            let head = document.getElementById('botName');
            if(head){
                head.textContent = botName;
            }
        }catch{
            this.voiceOver("Sorry user, we can't change your ai guid now due to some unwanted error. Please try some time later or contact with our helpline");
        }
    }
    // init(){
    //     this.setUp();
    // }
}

const chat = new Chat();
chat.setUp();
