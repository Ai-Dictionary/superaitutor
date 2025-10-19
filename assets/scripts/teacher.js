class Teacher {
    constructor() {
        this.user = [
            { name: "a", exp: 2, rate: 4.5, subject: ["math", "phy", "che"], pin: 159 },
            { name: "b", exp: 1, rate: 4.1, subject: ["math", "phy"], pin: 156 },
            { name: "c", exp: 3, rate: 4.9, subject: ["math", "che", "phy"], pin: 125 },
            { name: "d", exp: 1, rate: 4.8, subject: ["math", "phy"], pin: 162 },
            { name: "e", exp: 3, rate: 3.2, subject: ["math", "che"], pin: 158 },
            { name: "f", exp: 2, rate: 3.8, subject: ["che", "phy"], pin: 158 }
        ]
        this.initListener();
    }

    initListener() {
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
            this.filterByRating('teacher', 'High rate');
        } else if (selectedValue == 'Low rated') {
            this.filterByRating('teacher', 'Low rate');
        } else {
            system.search('teacher-search', 'teacher', 'block', selectedValue);
        }
    }

    handleSubject(event) {
        const selectedValue = event.target.value;
        if (selectedValue == 'All') {
            system.search('teacher-search', 'teacher', 'block');
        }else{
            system.search('teacher-search', 'teacher', 'block', selectedValue);
        }

    }

    filterByRating(sample_space_class = 'teacher', filter_key = 'High rate', type = 'block') {
        const elements = document.getElementsByClassName(sample_space_class);
        const isHigh = filter_key.toLowerCase().includes('high');

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
        }
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
}

const s = new Teacher().search_user("math", "rate", "high", 159);
// console.log(s);