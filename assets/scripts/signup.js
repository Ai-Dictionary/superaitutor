class SIGNUP{
    constructor(type){
        this.account_type = type;
    }
    async get_html_form(){
        try {
            const res = await fetch(`/signup/${this.account_type}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error('Failed to load form:', err);
            return null;
        }
    }
}
async function accountType(value){
    let signup = new SIGNUP(value.trim());
    let html = await signup.get_html_form();
    if(html!=null){
        document.getElementById("main").innerHTML = html.data;
    }
}