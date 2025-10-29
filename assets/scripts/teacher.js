class Teacher {
    constructor() {
        this.user = [];
        this.relation = [];
        this.initListener();
        Teacher.instance = this;
    }

    initListener() {
        const UserElement = document.getElementById('raw-user');
        const raw_user = UserElement.innerText;
        this.user = JSON.parse(raw_user);
        UserElement.innerText = '';
        const RelationElement = document.getElementById('raw-relation');
        const raw_relation = RelationElement.innerText;
        this.relation = JSON.parse(raw_relation);
        RelationElement.innerText = '';
        this.markUserRelations();
        this.makeUserList();

        const filterElement = document.getElementById('filter');
        if (filterElement) {
            filterElement.addEventListener('change', this.handleFilter.bind(this));
        }
        const subjectElement = document.getElementById('filter');
        if (subjectElement) {
            subjectElement.addEventListener('change', this.handleSubject.bind(this));
        }
    }

    markUserRelations() {
        if (!Array.isArray(this.relation) || this.relation.length === 0) return;

        this.user.forEach(user => {
            if (this.relation.some(rel => rel.id.includes(user.id))) {
                user.relation = true;
                // user.rating = this.relation.rating;
            }
        });
    }

    static findRelationsUser(id) {
        let relation_list = this.relation || Teacher.getRelationList();
        if (!Array.isArray(relation_list) || relation_list.length === 0) return;
        return relation_list.find(relation => relation.id.includes(id));
    }

    handleFilter(event) {
        const selectedValue = event.target.value;
        if (selectedValue == 'All') {
            system.search('teacher-search', 'teacher', 'block');
        } else if (selectedValue == 'Nearest') {
            // why this option
        } else if (selectedValue == 'Teacher only') {
            system.search('teacher-search', 'teacher', 'block', selectedValue.replace(' only', ''));
        } else if (selectedValue == 'Mentor only') {
            system.search('teacher-search', 'teacher', 'block', selectedValue.replace(' only', ''));
        } else if (selectedValue == 'High rated') {
            setTimeout(() => {
                this.filterByRating('teacher', 'High rate', 'block');
            }, 100);
        } else if (selectedValue == 'Low rated') {
            setTimeout(() => {
                this.filterByRating('teacher', 'Low rate', 'block');
            }, 100);
        } else {
            system.search('teacher-search', 'teacher', 'block', selectedValue);
        }
    }

    handleSubject(event) {
        const selectedValue = event.target.value;
        if (selectedValue == 'All') {
            system.search('teacher-search', 'teacher', 'block');
        } else {
            system.search('teacher-search', 'teacher', 'block', selectedValue);
        }

    }

    filterByRating(sample_space_class = 'teacher', filter_key = 'High rate', type = 'block') {
        const elements = document.getElementsByClassName(sample_space_class);
        const isHigh = filter_key.toLowerCase().includes('high');
        let miss=0;

        for (let i = 0; i < elements.length; i++) {
            const teacher = elements[i];
            const downSection = teacher.querySelector('.down');
            if (!downSection) continue;

            const ratingSpan = downSection.querySelector('span');
            if (!ratingSpan) continue;
            const ratingText = ratingSpan.textContent.trim();
            const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
            const rating = ratingMatch ? parseFloat(ratingMatch[0]) : 0;

            const show = isHigh ? rating >= 4.0 : rating < 4.0;
            teacher.style.display = show ? type : 'none';
            miss += show ? 1 : 0;
        }
        document.getElementById('teacher-searchDOD').style.display = miss!=elements.length?'block':'none';
    }

    search_user(sub, index = "rate", con = "low", pin = 159) {
        const selected_user = this.user.filter(u =>
            u.subject.includes(sub) &&
            Math.abs(u.pin - pin) <= 5
        );

        selected_user.sort((a, b) =>
            con === "low" ? a[index] - b[index] : b[index] - a[index]
        );

        return selected_user;
    }

    makeUserList(iteration = 'first') {
        let demo = document.querySelector('.body .teacher');
        if (demo != null) {
            if (this.user.length > 0) {
                for (let i = 0; i < this.user.length; i++) {
                    let user = this.user[i];
                    user.dp = (user.name?.split(' ').filter(Boolean)[0]?.[0] || '') + (user.name?.split(' ').filter(Boolean).slice(-1)[0]?.[0] || '0');
                    const card = document.createElement('div');
                    card.className = 'teacher';
                    card.innerHTML = demo.innerHTML;
                    card.setAttribute('onclick', `loadCard('${i}')`);

                    const walker = document.createTreeWalker(card, NodeFilter.SHOW_TEXT, null, false);

                    while (walker.nextNode()) {
                        const node = walker.currentNode;
                        const matches = node.textContent.match(/{(\w+)}/g);

                        if (matches) {
                            let updatedText = node.textContent;
                            matches.forEach(match => {
                                const key = match.replace(/[{}]/g, '');
                                if (user.hasOwnProperty(key)) {
                                    updatedText = updatedText.replace(match, user[key]);
                                }
                            });
                            node.textContent = updatedText;
                        }
                    }

                    card.querySelectorAll("*").forEach(el => {
                        for (let attr of el.getAttributeNames()) {
                            let val = el.getAttribute(attr);
                            const matches = val.match(/{(\w+)}/g);
                            if (matches) {
                                matches.forEach(match => {
                                    const key = match.replace(/[{}]/g, '');
                                    if (user.hasOwnProperty(key)) {
                                        let replacement = user[key];
                                        const quoted = `'${match}'`;
                                        if (val.includes(quoted)) {
                                            val = val.replace(quoted, replacement);
                                        } else {
                                            val = val.replace(match, replacement);
                                        }
                                    }
                                });
                                el.setAttribute(attr, val);
                            }
                        }
                    });
                    document.querySelector('.body').appendChild(card);
                    if(user?.relation){
                        const titleElement = document.querySelectorAll('.teacher .top .right .title')[i + 1];
                        const svgElement = titleElement.querySelector('svg');
                        svgElement.setAttribute('class', 'bi bi-bookmark-fill');
                        svgElement.innerHTML = '<path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>';
                    }
                }
            } else {
                document.getElementById('teacher-searchDOD').style.display = 'block';
            }
            demo.remove();
        }
    }

    static connect_user(index=0){
        if(document.getElementById('add').textContent == "Start Connection"){
            const data = {"id": "AIDA1302542@709-UID1907238613@2009", "subject": "Mathematics", "rating": 0, "desc": ""}; 
        }
    }

    static getUserList(){
        return Teacher.instance?.user || [];
    }

    static getRelationList(){
        return Teacher.instance?.relation || [];
    }
}

new Teacher();


class UserCard{
    constructor(){
        this.id = '';
    }
    loadCard(id=this.id){
        let all_user = document.querySelectorAll('.body .teacher');
        if(all_user.length >= id){
            let teacher = Teacher.getUserList()[Number(id)];
            const card = document.getElementById('user_card');
            card.style.display = "block";

            let r_user, control = document.getElementById('add');

            if(teacher?.relation){
                r_user = Teacher.findRelationsUser(teacher.id);
                control.textContent = "Disconnect";
                control.setAttribute('class', 'btn btn-outline-danger');
            }else{
                control.textContent = "Start Connection";
                control.setAttribute('class', 'btn btn-outline-process');
            }
            teacher.subject_connect = r_user?.subject || 'No Connection';
            control.onclick = () => connect_user(Number(id));

            document.querySelector('#user_card .card .dp').style.background = teacher['bg'];
            Object.keys(teacher).forEach(key => {
                const elements = card.getElementsByClassName(key);
                for (let el of elements) {
                    el.textContent = teacher[key];
                }
            });

            card.querySelectorAll("*").forEach(el => {
                for (let attr of el.getAttributeNames()) {
                    let val = el.getAttribute(attr);
                    const matches = val.match(/{(\w+)}/g);
                    if (matches) {
                        matches.forEach(match => {
                            const key = match.replace(/[{}]/g, '');
                            if (teacher.hasOwnProperty(key)) {
                                let replacement = teacher[key];
                                const quoted = `'${match}'`;
                                if (val.includes(quoted)) {
                                    val = val.replace(quoted, replacement);
                                } else {
                                    val = val.replace(match, replacement);
                                }
                            }
                        });
                        el.setAttribute(attr, val);
                    }
                }
            });
        }else{
            document.getElementById('teacher-searchDOD').style.display = 'block';
            document.querySelector('.body').style.display = 'none';
        }
    }
    closeCard(){
        document.getElementById('user_card').style.display = "none";
    }
}

window.loadCard = (id) => new UserCard().loadCard(id);
window.closeCard = () => new UserCard().closeCard();
window.connect_user = (index) => Teacher.connect_user(index);
loadCard(1);