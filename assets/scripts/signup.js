class SIGNUP{
    constructor(type){
        this.account_type = type;
    }
    async get_html_form(){
        try{
            const res = await fetch(`/signup/${this.account_type}`);
            const data = await res.json();
            return data;
        }catch(err){
            console.error('Failed to load form:', err);
            alertMessage({'error': 500, 'message': 'Oops! Something went wrong. Due to an internal issue, we couldn\'t load the required signup form. Please double-check your selected account type and try again sometime later.'});
            return null;
        }
    }
    async make_request(formData){
        try{
            if(this.account_type=='student'){
                const response = await fetch('/create_account', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ info:{"type": this.account_type, "details": formData} })
                });

                const result = await response.json();

                if(response.ok){
                    if(result.id){
                        console.log('Account created successfully. Your ID:', result.id);
                        route('/accountCreated?encode='+encodeURIComponent(substitutionEncoder(`name=${formData.name.replaceAll(' ','%20')}&email=${formData.email}&id=${result.id}`,'1441')));
                    }else if(result.message){
                        console.warn('Server responded with a message:', result.message);
                        document.getElementById("waitpopup").style.display = "none";
                        alertMessage({'error': 400, 'message': result.message.message, 'mute': true});
                    }else{
                        console.warn('Unexpected response format:', result);
                        document.getElementById("waitpopup").style.display = "none";
                        alertMessage({'error': 500, 'message': 'We encountered an unexpected issue while processing your signup request. This may be due to a temporary server error or an incomplete response. Please wait a few moments and try again. If your user ID does not appear within 60 seconds, refresh the page and resubmit the form. Your data has not been saved yet.', 'mute': true});
                    }
                }else{
                    console.error('Server returned an error status:', response.status, response?.message);
                    document.getElementById("waitpopup").style.display = "none";
                    alertMessage({'error': 500, 'message':"Our servers are currently experiencing an issue and couldn't complete your signup request. This may be due to high traffic or a temporary outage. Please wait a moment and try again. If the problem continues, your account has not been created—refresh the page and resubmit the form.", 'mute': true});
                }
            }
        }catch{
            console.error('Failed to creat account:', err);
            alertMessage({'error': 500, 'message': 'Oops! Something went wrong. Due to an internal issue, we couldn\'t creat your account using this data. Please double-check your field information and try again sometime later.', 'mute': true});
            return null;
        }
    }
}
async function accountType(value){
    let signup = new SIGNUP(value.trim());
    let html = await signup.get_html_form();
    if(html!=null){
        document.getElementById("main").innerHTML = html.data;
        document.title = `Signup - ${value} - SuperAITutor`;
        const script = document.createElement('script');
        script.id = 'dynamic-script';
        script.type = 'text/javascript';
        script.src = `${window.isHosted=='true'?'https://ai-dictionary.github.io/superaitutor':'..'}/assets/scripts/${value}SignUp.js`;
        script.onload = () => console.log('Script loaded:', script.src);
        script.onerror = () => console.error('Failed to load script:', script.src);
        document.body.appendChild(script);

        const link = document.createElement('link');
        link.id = 'dynamic-style';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = `${window.isHosted == 'true' ? 'https://ai-dictionary.github.io/superaitutor' : '..'}/assets/styles/${value}SignUp.css`;
        link.onload = () => console.log('Stylesheet loaded:', link.href);
        link.onerror = () => console.error('Failed to load stylesheet:', link.href);

        document.head.appendChild(link);

        const url = new URL(window.location.href);
        url.searchParams.set('type', value);
        window.history.replaceState(null, '', url.toString());
    }else{
        route('/signup');
    }
}

async function make_request_to_signup(formData){
    try{
        document.getElementById("waitpopup").style.display = "block";
        let signup = new SIGNUP(formData.accountType);
        await signup.make_request(formData);
    }catch(e){
        console.log("lol");
    }
}

let params = new URL(window.location.href);
let searchParams = new URLSearchParams(params.search);

if(searchParams.has('type')){
    let typeValue = searchParams.get('type');
    (async () => {
        await accountType(typeValue);
    })();
}