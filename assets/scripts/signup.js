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
}
async function accountType(value){
    let signup = new SIGNUP(value.trim());
    let html = await signup.get_html_form();
    if(html!=null){
        document.getElementById("main").innerHTML = html.data;
        document.title = `Signup - ${value} - SuperAITutor`;
    }else{
        route('/signup');
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