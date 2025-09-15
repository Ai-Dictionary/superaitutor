function Student_listener(){
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
                alertMessage({'error': 400, 'message': `It appears that Page ${index + 1} contains missing or incorrectly entered details. To proceed, please review all fields on this page and ensure they are completed accurately. Once all required information is provided in the correct format, you'll be able to continue.`, 'mute': true});
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

        bullet[current - 1].classList.add("active");
        progressCheck[current - 1].classList.add("active");
        progressText[current - 1].classList.add("active");
        current += 1;

        console.log("All pages validated successfully!");
        
        (async()=>{
            await make_request_to_hire(formData);
        })();
    });

    function validateCurrentPage(stepIndex) {
        return true;
        const pages = document.querySelectorAll(".page");
        const currentPage = pages[stepIndex];
        const fields = currentPage.querySelectorAll("input, select, textarea");
        let isValid = true;

        currentPage.querySelector(".title").innerHTML = currentPage.querySelector(".title").innerHTML.replace("<span>Please ensure that all fields are completed accurately before proceeding</span>",'');

        const regex = {
            name: /^[a-zA-Z\s]{3,50}$/,
            email: /^[\w.-]+@[\w.-]+\.\w{2,}$/,
            url: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/,
            textarea: /^(.{20,400})$/,
            number: /^(?:[5-9][0-9]{2}|[1-9][0-9]{3,5}|10{5,6})$/,
            text: /^[A-Za-z0-9\s\-+,#@$&.:;!?]{10,250}$/
        };

        fields.forEach(field => {
            const value = field.value.trim();
            const type = field.type || field.tagName.toLowerCase();
            const id = field.id;

            let pass = false;

            if(type === "name"){
                pass = regex.name.test(value);
            }else if (type === "email"){
                pass = regex.email.test(value);
            }else if (type === "url" || type === "link"){
                pass = regex.url.test(value);
            }else if (type === "select-one"){
                pass = value !== "";
            }else if (type === "textarea"){
                pass = regex.textarea.test(value);
            }else if (type === "date"){
                pass = value !== "";
            }else if (type === "text"){
                pass = regex.text.test(value);
            }else if (type === "number"){
                pass = regex.number.test(value);
            }else{
                pass = value.length > 0;
            }

            field.classList.toggle("is-valid", pass);
            field.classList.toggle("is-invalid", !pass);

            if(!pass){
                console.warn(`Invalid field: #${id} (${type}) – value entered: "${value}"`);
                isValid = false;
            }                                   
        });
        if(!isValid){
            currentPage.querySelector(".title").innerHTML += "<span>Please ensure that all fields are completed accurately before proceeding</span>";
            console.warn("Please ensure that all fields are completed accurately before proceeding.");
            alertMessage({'error': 400, 'message': 'Before proceeding, please ensure that all required fields have been filled out accurately. Some entries appear to be missing or incorrectly formatted. Kindly review the form and make the necessary corrections to continue.', 'mute': true});
        }
        return isValid;
    }

}

document.querySelectorAll('.time-table td[data-day]').forEach(td => {
    td.addEventListener('click', () => {
        const day = td.getAttribute('data-day');
        const rowTds = document.querySelectorAll(`td[data-day="${day}"]`);

        rowTds.forEach(cell => cell.classList.remove('selected'));

        td.classList.add('selected');

        const radio = td.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    });
});


Student_listener();

