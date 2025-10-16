class Profile{
    constructor(){
        this.mode = "lock";
        this.updated_info ={};
        this.id = document.querySelector(".head h4 span").textContent.split('for ')[1];
        this.initSelectValues();
        this.toggleUserData('lock');
        this.changeInfo();
        this.regex ={
            name: /^(?=.{7,50}$)([a-zA-Z]{3,}\s+){1,2}[a-zA-Z]{3,}$/,
            email: /^[\w.-]+@[\w.-]+\.\w{2,}$/,
            url: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
            textarea: /^(.{20,400})$/,
            text: /^[A-Za-z0-9\s\-+,#@$&.:;!?]{5,250}$/,
            dob: /^\d{4}-\d{2}-\d{2}$/,
            contact: /^[6-9]\d{9}$/,
            address: /^[A-Za-z0-9\s\-+,#@$&.:;!?]{10,250}$/,
            pin: /^\d{6}$/,
            gpa: /^(10(\.0{1,2})?|[0-9](\.\d{1,2})?)$/,
            percentage: /^(100(\.0{1,2})?|[0-9]{1,2}(\.\d{1,2})?)$/,
            subjectList: /^[A-Za-z\s]+(,\s*[A-Za-z\s]+)*$/,
            password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^+=])[A-Za-z\d@$!%*#?&^+=]{8,}$/
        };
    }

    initSelectValues(){
        document.querySelectorAll('select[data-value]').forEach(function(select){
            const val = select.getAttribute('data-value');
            if(val){
                const match = Array.from(select.options).find(opt =>
                    opt.value.toLowerCase() === val.toLowerCase()
                );
                if(match) select.value = match.value;
            }
        });
    }

    toggleUserData(){
        const fields = document.querySelectorAll('.user-data input, .user-data select, .user-data textarea');
        const shouldDisable = this.mode === 'lock';

        fields.forEach(field => {
            field.disabled = shouldDisable;
        });

        document.querySelector('.save-option').style.display = this.mode == 'lock' ? 'none' : 'block';
        document.querySelector('.normal-option').style.display = this.mode == 'lock' ? 'block' : 'none';
        if(this.mode == 'lock'){
            this.setupValidation();
        }
        this.mode = this.mode == 'lock' ? 'unlock' : 'lock';
    }

    changeInfo(){
        const changedFields ={};

        const fields = document.querySelectorAll(".user-data input, .user-data select, .user-data textarea");

        fields.forEach(field => {
            const originalValue = field.value;

            field.addEventListener("change", () => {
                const currentValue = field.value;
                const fieldId = field.id;

                if(currentValue !== originalValue){
                    changedFields[fieldId] = currentValue;
                }else{
                    delete changedFields[fieldId];
                }

                this.updated_info = changedFields;
                let saveBtn = document.querySelector(".save-option .save-info");
                saveBtn.innerHTML = saveBtn.innerHTML.replace("No Change Detect", "Save Change");
                saveBtn.classList.remove("btn-outline-secondary");
                saveBtn.classList.add("btn-outline-success");
                this.updateDP();
                if(Object.keys(changedFields).length == 0){
                    this.cancelChange();
                }
            });
        });
    }

    cancelChange(){
        const fields = document.querySelectorAll(".user-data input, .user-data select, .user-data textarea");

        fields.forEach(field => {
            if(field.tagName === "SELECT"){
                field.selectedIndex = field.defaultSelected;
            }else{
                field.value = field.defaultValue;
            }
        });
        this.initSelectValues();
        this.updateDP();

        this.updated_info ={};

        const saveBtn = document.querySelector(".save-option .save-info");
        saveBtn.innerHTML = saveBtn.innerHTML.replace("Save Change", "No Change Detect");
        saveBtn.classList.remove("btn-outline-success");
        saveBtn.classList.add("btn-outline-secondary");
        document.querySelector(".security-mark").style.display = "block";
        document.querySelector(".hidden").style.display = "none";
        this.toggleUserData();
    }

    validateField(field){
        const value = field.value.trim();
        const type = field.type || field.tagName.toLowerCase();
        const id = field.id;
        let pass = false;

        if(id === "name" || type === "name"){
            pass = this.regex.name.test(value);
        }else if(id === "dob"){
            if(this.regex.dob.test(value)){
                const birthYear = new Date(value).getFullYear();
                const age = new Date().getFullYear() - birthYear;
                pass = age >= 8 && age <= 60;
            }
        }else if(id === "contact" || type === "tel"){
            pass = this.regex.contact.test(value);
        }else if(type === "email"){
            pass = this.regex.email.test(value);
        }else if(id === "address"){
            pass = this.regex.address.test(value);
        }else if(type === "text"){
            pass = this.regex.text.test(value);
        }else if(id === "pin"){
            pass = this.regex.pin.test(value);
        }else if(id === "results"){
            pass = this.regex.gpa.test(value) || this.regex.percentage.test(value);
        }else if(id === "fav_subjects" || id === "diff_subjects"){
            pass = this.regex.subjectList.test(value);
        }else if(id === "pass" || id === "password"){
            pass = this.regex.password.test(value);
        }else if(id === "confirmPassword"){
            const password = document.getElementById("pass")?.value.trim();
            pass = value === password && this.regex.password.test(value);
        }else if(type === "select-one" || type === "date"){
            pass = value !== "";
        }else{
            pass = value.length > 0;
        }

        field.classList.toggle("is-valid", pass);
        field.classList.toggle("is-invalid", !pass);
        return pass;
    }

    setupValidation(){
        const allFields = document.querySelectorAll(".body input, .body select, .body textarea");

        const fields = Array.from(allFields).filter(field => {
            if (field.closest(".security-mark")) return false;
            const hiddenParent = field.closest(".hidden");
            if (hiddenParent && getComputedStyle(hiddenParent).display === "none") return false;
            return true;
        });

        fields.forEach(field => {
            field.addEventListener("input", () => {
                this.validateField(field);
            });
        });
    }

    changeValidate(){
        const allFields = document.querySelectorAll(".body input, .body select, .body textarea");

        const fields = Array.from(allFields).filter(field => {
            if (field.closest(".security-mark")) return false;
            const hiddenParent = field.closest(".hidden");
            if (hiddenParent && getComputedStyle(hiddenParent).display === "none") return false;
            return true;
        });
        
        let allValid = true;
        
        fields.forEach(field => {
            const valid = this.validateField(field);
            if(!valid){
                allValid = false;
            }
        });

        return allValid;
    }

    saveChange(){
        if(this.mode == 'lock'){
            if(Object.keys(this.updated_info).length != 0 && this.changeValidate()){
                document.querySelector(".save-option .save-info").disabled = "false";
                new Process().start();
                fetch('/update_profile_info',{
                    method: 'POST',
                    headers:{
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "id": this.id,
                        "update_info": this.updated_info
                    })
                }).then(response => response.json()).then(data => {
                    new Process().end();
                    if(data.status === true){
                        new PopUp("success", 4000).create("Profile information updated successfully, Reload for getting new profile data.");
                        setTimeout(() => {
                            route(window.location.href);
                        },3500);
                    }else if(data.status === false){
                        new PopUp("warning", 4000).create("Provided user id is not associate with any profile type, Please provide valid user id");
                    }else{
                        system.alert({ "error": data.status, "message": data.message });
                    }
                }).catch(error => {
                    console.error('Error:', error);
                });
            }else{
                let popup = new PopUp("normal", 4000);
                popup.create("Please change your profile details correctly first and then try to send request for update that!");
            }
        }else{
            let popup = new PopUp("warning", 4000);
            popup.create("Some unwanted resource access command hit the application server.");
            console.warn("Save Change Not Possible For This Call");
        }
    }

    call_for_security_info(pass){
        fetch('/profile_security_info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: this.id,
                pass: String(system.encoder(pass, "@Sait2025"))
            })
        }).then(response => response.json()).then(data => {
            new Process().end();
            if(data.status){
                system.alert({ "error": data.status, "message": data.message });
            }else if(data.profile){
                const profile = system.objEncoder(data.profile, "@Sait2025");
                document.querySelector(".security-mark").style.display = "none";
                document.querySelector(".hidden").style.display = "block";
                document.getElementById("fav_color").value = profile.fav_color;
                document.getElementById("fav_book").value = profile.fav_book;
                document.getElementById("pass").value = profile.pass;
            }else{
                new PopUp("warning", 4000).create("Some unexpted error occure while send request for security information");
                console.warn(data);
            }
        }).catch(error => {
            let popup = new PopUp("warning", 4000);
            popup.create("Some unwanted resource access command hit the application server.");
            console.warn("Save Change Not Possible For This Call");
        });
    }

    unlock(){
        const password = document.getElementById("password");
        const valid = this.validateField(password);
        if(valid){
            new Process().start();
            this.call_for_security_info(password.value);
        }
    }

    updateDP(){
        let name = document.getElementById("name");
        if(this.validateField(name)){
            let dp = name.value.split(' ')[0][0]+name.value.split(' ')[name.value.split(' ').length-1][0];
            document.querySelector('.profile-dp').textContent = dp;
        }
    }
}

const userProfile = new Profile();
window.toggleUserData =() => userProfile.toggleUserData();
