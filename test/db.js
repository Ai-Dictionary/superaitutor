let sample = [];

async function make_request(formData) {
    try {
        console.log(formData.name);
        if (formData.account_type == 'student' || formData.account_type == 'teacher' || formData.account_type == 'admin') {
            const response = await fetch('http://localhost:6100/create_account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ info: { "type": formData.account_type, "details": formData } })
            });

            const result = await response.json();

            if (response.ok) {
                if (result.id) {
                    console.log('Account created successfully. Your ID:', result.id);
                } else if (result.message) {
                    console.warn('Server responded with a message:', result.message);
                } else {
                    console.warn('Unexpected response format:', result);
                }
            } else {
                console.error('Server returned an error status:', response.status, response?.message);
            }
        }
    } catch {
        console.error('Failed to creat account:', err);
        return null;
    }
}

(async () => {
    for (let i = 0; i < sample.length; i++) {
        try {
            let formData = sample[i];
            formData.account_type = "teacher";
            formData.status = "active";
            await make_request(formData);
            console.log("Pused ", i, " no sample");
        } catch (e) {
            console.log("Fail to push the sample ", i, " due to ", e);
        }
    }
    console.log("\n\nAll done");
})();