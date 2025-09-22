function Admin_listener(){
    const slidePage = document.querySelector(".slide-page");
    const progressText = document.querySelectorAll(".step p");
    const progressCheck = document.querySelectorAll(".step .check");
    const bullet = document.querySelectorAll(".step .bullet");
    let current = 1;
    
    const nextBtns = document.querySelectorAll("[data-next-step]");
    nextBtns.forEach(btn => {
        btn.addEventListener("click", function (event) {
            event.preventDefault();
            const step = parseInt(btn.getAttribute("data-next-step"));
            if(!validateCurrentPage(current - 1)){
                return;
            }
            slidePage.style.marginLeft = `-${step * 20}%`;
            bullet[current - 1].classList.add("active");
            progressCheck[current - 1].classList.add("active");
            progressText[current - 1].classList.add("active");
            setTimeout(()=>{
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },1000);
            try{
                document.getElementById('custom-alert').remove();
            }catch{};
            current += 1;
        });
    });

    const prevBtns = document.querySelectorAll("[data-prev-step]");
    prevBtns.forEach(btn => {
        btn.addEventListener("click", function (event) {
            event.preventDefault();
            const step = parseInt(btn.getAttribute("data-prev-step"));
            slidePage.style.marginLeft = `-${step * 20}%`;
            bullet[current - 2].classList.remove("active");
            progressCheck[current - 2].classList.remove("active");
            progressText[current - 2].classList.remove("active");
            setTimeout(()=>{
                window.scrollTo({ top: 0, behavior: 'smooth' });
            },1000);
            try{
                document.getElementById('custom-alert').remove();
            }catch{};
            current -= 1;
        });
    });

    const submitBtn = document.querySelector(".submit");
    submitBtn.addEventListener("click", function () {
        const pages = document.querySelectorAll(".page");

        let allValid = true;
        const formData = {};

        pages.forEach((page, index) => {
            const isPageValid = validateCurrentPage(index);
            if(!isPageValid){
                pages[4].querySelector(".title").innerHTML += `<span>Page ${index + 1} is not filled out correctly.</span>`;
                console.warn(`Page ${index + 1} is not filled out correctly.`);
                system.alert({'error': 400, 'message': `It appears that Page ${index + 1} contains missing or incorrectly entered details. To proceed, please review all fields on this page and ensure they are completed accurately. Once all required information is provided in the correct format, you'll be able to continue.`, 'mute': true});
                allValid = false;
            }else{
                const fields = page.querySelectorAll("input, select, textarea");
                fields.forEach(field => {
                    const id = field.id;
                    const value = field.value.trim();
                    if(id){
                        formData[id] = value;
                    }
                });
            }
        });

        if (!allValid) return;
        try{
            bullet[current - 1].classList.add("active");
            progressCheck[current - 1].classList.add("active");
            progressText[current - 1].classList.add("active");
            current += 1;
        }catch{
            console.log("Again fill");
        }

        console.log("All pages validated successfully!");
        // console.log(formData);
        (async()=>{
            delete formData.iagree;
            delete formData.confirmPassword;
            formData.accountType = "admin";
            formData.status = "active";
            await make_request_to_signup(formData);
        })();
    });

    const regex = {
        name: /^[a-zA-Z\s]{3,50}$/,
        email: /^[\w.-]+@[\w.-]+\.\w{2,}$/,
        admin: /^(N\/A|MID(?=[\d]*@[\d]*$)[\d@]+)$/,
        url: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
        textarea: /^(.{20,400})$/,
        text: /^[A-Za-z0-9\s\-+,#@$&.:;!?]{5,250}$/,
        dob: /^\d{4}-\d{2}-\d{2}$/,
        contact: /^[6-9]\d{9}$/,
        address: /^[A-Za-z0-9\s\-+,#@$&.:;!?]{10,250}$/,
        pin: /^\d{6}$/,
        password: /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^+=])[A-Za-z\d@$!%*#?&^+=]{8,}$/,
    };

    function validateCurrentPage(stepIndex) {
        // return true;
        const pages = document.querySelectorAll(".page");
        const currentPage = pages[stepIndex];
        const fields = currentPage.querySelectorAll("input, select, textarea");
        let isValid = true;

        currentPage.querySelector(".title").innerHTML = currentPage.querySelector(".title").innerHTML.replace("<span>Please ensure that all fields are completed accurately before proceeding</span>",'');

        fields.forEach(field => {
            const pass = validateField(field);
            if (!pass) {
                console.warn(`Invalid field: #${field.id} (${field.type}) - value entered: "${field.value.trim()}"`);
                isValid = false;
            }
        });

        if(!isValid){
            currentPage.querySelector(".title").innerHTML += "<span>Please ensure that all fields are completed accurately before proceeding</span>";
            console.warn("Please ensure that all fields are completed accurately before proceeding.");
            system.alert({'error': 400, 'message': 'Before proceeding, please ensure that all required fields have been filled out accurately. Some entries appear to be missing or incorrectly formatted. Kindly review the form and make the necessary corrections to continue.', 'mute': true});
        }
        return isValid;
    }
    function validateField(field) {
        const value = field.value.trim();
        const type = field.type || field.tagName.toLowerCase();
        const id = field.id;

        let pass = false;

        if (id === "name" || id=='referringAdmin' || type === "name"){
            pass = regex.name.test(value);
            if(!pass && id=='referringAdmin'){
                pass = value=='N/A';
            }
        }else if (id === "dob"){
            if (regex.dob.test(value)){
                const birthYear = new Date(value).getFullYear();
                const age = new Date().getFullYear() - birthYear;
                pass = age >= 18 && age <= 60;
            }
        }else if (id === "contact" || type==="tel"){
            pass = regex.contact.test(value);
        }else if (id==="referringAdminContact" || type === "email"){
            pass = regex.email.test(value);
            if(!pass && id=="referringAdminContact"){
                pass = regex.admin.test(value);
            }
        }else if (id === "address"){
            pass = regex.address.test(value);
        }else if (type === "text"){
            pass = regex.text.test(value);
        }else if (type === "url"){
            pass = regex.url.test(value);
            if(!pass){
                pass = value=='N/A';
            }
        }else if (id === "pin"){
            pass = regex.pin.test(value);
        }else if (id === "pass" || type=="password"){
            pass = regex.password.test(value);
        }else if (id === "confirmPassword"){
            const password = document.getElementById("pass")?.value.trim();
            pass = value === password && regex.password.test(value);
        }else if (type === "select-one" || type === "date"){
            pass = value !== "";
        }else{
            pass = value.length > 0;
        }

        field.classList.toggle("is-valid", pass);
        field.classList.toggle("is-invalid", !pass);
        return pass;
    }
    document.querySelectorAll("input, select, textarea").forEach(field => {
        field.addEventListener("input", () => {
            validateField(field);
        });
    });

}

Admin_listener();

