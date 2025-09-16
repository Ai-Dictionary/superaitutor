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
                        console.log('Account created successfully. ID:', result.id);
                        route('/accountCreated?encode='+substitutionEncoder(`name=${formData.name}&email=${formData.email}&id=${result.id}`,'1441'))
                    }else if(result.message){
                        console.warn('Server responded with a message:', result.message);
                        alertMessage({'error': 400, 'message': result.message.message, 'mute': true});
                    }else{
                        console.warn('Unexpected response format:', result);
                        alertMessage({'error': 500, 'message': 'Unexpected response. Please try again later.', 'mute': true});
                    }
                }else{
                    console.error('Server returned an error status:', response.status, response?.message);
                    alert('Server error occurred. Please try again later.');
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
    }else{
        route('/signup');
    }
}

async function make_request_to_signup(formData){
    try{
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