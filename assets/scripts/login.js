const emailOrUserIdRegex = /^(?:[\w.-]+@[\w.-]+\.\w{2,}|(?:AID|UID)[A-Za-z](?=(?:\d*@\d*|\d*@\d*)$)[\d@]{11,15})$/;

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const emailField = document.getElementById("useremail");
const passwordField = document.getElementById("userpassword");

function validateInput(field, regex){
    const value = field.value.trim();
    const isValid = regex.test(value);
    field.classList.toggle("is-valid", isValid);
    field.classList.toggle("is-invalid", !isValid);
}

emailField.addEventListener("input", () => validateInput(emailField, emailOrUserIdRegex));
passwordField.addEventListener("input", () => validateInput(passwordField, passwordRegex));

let captcha = new CAPTCHA();

function refreshCaptcha(key){
    document.getElementById('captcha-img').src = captcha.getCaptcha(document, key);
}
refreshCaptcha(window.captchaKey);
document.getElementById('captcha-btn').addEventListener("click", () => refreshCaptcha(window.captchaKey));

function login(){
    const validEmail = emailOrUserIdRegex.test(emailField.value.trim());
    const validPassword = passwordRegex.test(passwordField.value.trim());
    const captcha_text = document.getElementById("captcha-txt").value;
    document.querySelector('.error').style.display = "block";
    if(validEmail && validPassword){
        if (captcha.vitals == captcha.tokenizer(captcha_text, window.captchaKey) && captcha_text != '') {
            document.querySelector('.error').innerHTML = "<span style='color: green;'>Waiting for server response!</span>";
            loginBtn.style.display = "none";
            fetch('/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailField.value.trim(),
                    password: passwordField.value.trim()
                })
            }).then(response => response.json()).then(data => {
                if(data?.success){
                    passwordField.value = "";
                    window.location.href = '/deshboard';
                }else{
                    alertMessage(data);
                    // window.location.href = '/login';
                }
            }).catch(error => {
                console.error('Error:', error);
            });
        }else{
            document.querySelector('.error').textContent = ">> Your entered captcha is incorrect. Please try again later!";
        }
    }else{
        document.querySelector('.error').textContent = ">> Your entered credentials are incorrect format. Please try again later!";
    }
}
const loginBtn = document.getElementById("login");
loginBtn.addEventListener("click", () => login());

function alertMessage(data){
    try{
        const alertId = "custom-alert";
        const alertHTML = `
            <section class="blbg" id="${alertId}">
                <div class="alert alert-warning" role="alert">
                    <h4 class="alert-heading">Error: ${data?.error} 
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close" onclick="document.getElementById('${alertId}').remove(); window.location.href = '/login';">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </h4>
                    <p>${data?.message}</p>
                    <hr>
                    <p class="mb-0">If you see this message rapidly or unexpected way then please <a href="mailto:info.aidictionary24x7@gmail.com?subject=Unexpected%20Dialog%20popup%20coming%20in%20SAIT">contact us</a>.</p>
                </div>
            </section>`;
        document.body.insertAdjacentHTML("beforeend", alertHTML);
    }catch(e){
        alert("Somthin went wrong! \n", e, String(data));
    }
}