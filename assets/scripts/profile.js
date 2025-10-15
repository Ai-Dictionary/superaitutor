class Profile{
    constructor(){
        this.mode = "lock";
        this.updated_info ={};
        this.initSelectValues();
        this.toggleUserData('lock');
        this.changeInfo();
        this.regex ={
            name: /^[a-zA-Z\s]{3,50}$/,
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
        this.setupValidation();
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

        this.updated_info ={};

        const saveBtn = document.querySelector(".save-option .save-info");
        saveBtn.innerHTML = saveBtn.innerHTML.replace("Save Change", "No Change Detect");
        saveBtn.classList.remove("btn-outline-success");
        saveBtn.classList.add("btn-outline-secondary");
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
        }else if(id === "pass"){
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
        const fields = document.querySelectorAll(".user-info input, .user-info select, .user-info textarea");

        fields.forEach(field => {
            field.addEventListener("input", () => {
                this.validateField(field);
            });
        });

        const submitBtn = document.querySelector(".submit-btn");
        if(submitBtn){
            submitBtn.addEventListener("click", (e) => {
                let allValid = true;
                fields.forEach(field => {
                    const valid = validateField(field);
                    if(!valid){
                        allValid = false;
                    }
                });

                if(!allValid){
                    e.preventDefault();
                    alert("Please correct the highlighted fields before submitting.");
                }else{
                    console.log("All fields valid. Proceeding...");
                }
            });
        }
    }

    saveChange(){
        if(this.mode == 'lock'){
            if(Object.keys(this.updated_info).length != 0){
                document.querySelector(".save-option .save-info").disabled = "false";
                new Process().start();
                fetch('/update_profile_info',{
                    method: 'POST',
                    headers:{
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "id": document.querySelector(".head h4 span").textContent.split('for ')[1],
                        "update_info": this.updated_info
                    })
                }).then(response => response.json()).then(data => {
                    new Process().end();
                    if(data.status === true){
                        new PopUp("success", 4000).create("Profile information updated successfully, Reload for getting new profile data.");
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
                popup.create("Please change your profile details first and then try to send request for update that!");
            }
        }else{
            let popup = new PopUp("warning", 4000);
            popup.create("Some unwanted resource access command hit the application server.");
            console.warn("Save Change Not Possible For This Call");
        }
    }
}

const userProfile = new Profile();
window.toggleUserData =() => userProfile.toggleUserData();
