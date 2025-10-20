class Teacher {
    constructor() {
        this.user = [];
        this.initListener();
    }

    initListener() {
        const BodyElement = document.getElementById('raw-data');
        const raw_data = BodyElement.innerText;
        this.user = JSON.parse(raw_data);
        this.make_user_list();

        const filterElement = document.getElementById('filter');
        if (filterElement) {
            filterElement.addEventListener('change', this.handleFilter.bind(this));
        }
        const subjectElement = document.getElementById('filter');
        if (subjectElement) {
            subjectElement.addEventListener('change', this.handleSubject.bind(this));
        }
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

    make_user_list(iteration = 'first') {
        let demo = document.querySelector('.body .teacher');
        if (demo != null) {
            if (this.user.length > 0) {
                for (let i = 0; i < this.user.length; i++) {
                    let user = this.user[i];
                    user.dp = (user.name?.split(' ').filter(Boolean)[0]?.[0] || '') + (user.name?.split(' ').filter(Boolean).slice(-1)[0]?.[0] || '0');
                    const card = document.createElement('div');
                    card.className = 'teacher';
                    card.innerHTML = demo.innerHTML;

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
                }
            } else {
                document.getElementById('teacher-searchDOD').style.display = 'block';
            }
            demo.remove();
        }
    }
}

new Teacher();