let exam; //sen
let interVal = 0;
let temp;

class Question {
    constructor(text, choices, answer, img = undefined) {
        this.text = text;
        this.choices = choices;
        this.answer = answer;
        this.img = img;
    }
    isCorrectAnswer(choice) {
        return this.answer === choice;
    }
    hasImage() {
        return this.img != undefined;
    }
}
class Exam {
    constructor(questions, questionList, shared) {
        this.score = 0;
        this.questions = questions;
        this.questionIndex = 0;
        this.questionList = questionList;
        this.shared = shared;
        this.answerListner();
    }
    answerListner() {
        const optionButtons = document.querySelectorAll('.option_btn');
        optionButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                this.guess(index + 1);
            });
        });
    }
    getQuestionIndex() {
        return this.questions[this.questionIndex];
    }
    guess(id) {
        let answer = document.getElementById("option" + id).value;
        if (this.shared.solveList.length > 0 && exam.questions.length > 0) {
            this.shared.solveList[this.shared.currentQuestionNumber - 1][2] = answer;
        } else {
            for (let i = 0; i < exam.questions.length; i++) {
                this.shared.solveList[i] = [i + 1, null, null];
            }
            this.guess(id);
        }
        if (this.getQuestionIndex().isCorrectAnswer(answer)) {
            this.score++;
        }
        this.questionIndex++;
        this.questionList();
    }
    isEnded() {
        return this.questionIndex === this.questions.length;
    }
    getNewQuestion(number) {
        var element = document.querySelector(".question");
        let QuestionIndex = this.questions[number];
        element.innerHTML = QuestionIndex.text;
        this.printOptionSheet(QuestionIndex.choices, number);
        this.shared.solveList[number][1] = this.questions[number];
        this.showProgress(number);
        this.questionTimerStart(number);
        this.questionList();
        this.answerListner();
    }
    printOptionSheet(choices, number) {
        this.temp = '';
        let a;
        for (let i = 0; i < choices.length; i++) {
            if (this.shared.solveList[number][2] === choices[i] && this.shared.solveList[number][2] != null) {
                a = "checked='true'";
            } else {
                a = '';
            }
            this.temp += `
            <div class="form-group option">
                <input type="radio" id="option${i + 1}" name="option" value="${choices[i]}" ${a} />
                <label for="option${i + 1}" id="choice${i + 1}">${choices[i]}</label>
            </div>`;
        }
        document.querySelector('.options').innerHTML = this.temp;
        for (let i = 0; i < choices.length; i++) {
            const radio = document.getElementById(`option${i + 1}`);
            radio.addEventListener("change", () => {
                this.guess(i + 1);
            });
        }
    }
    showProgress(number) {
        this.shared.currentQuestionNumber = number + 1;
        var element = document.getElementById("qno");
        element.innerHTML = this.shared.currentQuestionNumber;
        if (number == this.questions.length - 1) {
            document.getElementById("finish").style.display = "block";
        } else {
            document.getElementById("finish").style.display = "none";
        }
    }
    showScores() {
        var gameOverHTML = "<h1 onclick='anssheet();'>Result</h1>";
        gameOverHTML += "<h2 id='score'> Your scores: " + this.score + "</h2> <br><h4 id='puma'>Totale question: " + this.questions.length + "<br>Right answer: " + this.score + "<br>Your parsentage: " + this.score / this.questions.length * 100 + "%</h4><br><p id='parform'>If your scores > 75% <br>then you are able,<br> If your scores < 75%<br> then you are not able<br>but <b><i>Never Giveup</i></b></p><br><button id='refresh'value='restart'onclick='restart();'>Restart</button>";
        var element = document.getElementById("exam");
        element.innerHTML = gameOverHTML;
        alert("Congratulation we calculate your scores..");
    }
    examTimeRange() {
        temp = (new Date().getMonth() + 1) + ' ' + new Date().getDate() + ' ' + new Date().getFullYear();
        let hours = new Date(`${temp}, ${this.shared.currentPaper.time}`).getHours();
        let minutes = new Date(`${temp}, ${this.shared.currentPaper.time}`).getMinutes();
        let second = new Date(`${temp}, ${this.shared.currentPaper.time}`).getSeconds();
        return [hours, minutes, second];
    }
    exameTimeOccupied(time=false) {
        let occupiedTime = 0;
        for (let i = 0; i < this.shared.currentPaper.section.length - 1; i++) {
            if (i == 0) {
                occupiedTime += this.shared.currentPaper.section[i][0] * this.shared.currentPaper.section[i][1];
            } else {
                occupiedTime += (this.shared.currentPaper.section[i][0] - this.shared.currentPaper.section[i - 1][0]) * this.shared.currentPaper.section[i][1];
            }
        }
        if(time==true){
            return occupiedTime;
        }
        let hours = Math.floor(occupiedTime / 3600);
        let remainingSeconds = occupiedTime % 3600;
        let minutes = Math.floor(remainingSeconds / 60);
        remainingSeconds = remainingSeconds % 60;
        return [hours, minutes, remainingSeconds];
    }
    examTimeRemain() {
        let bigTime = this.examTimeRange();
        let smallTime = this.exameTimeOccupied();
        return [bigTime[0] - smallTime[0], bigTime[1] - smallTime[1], bigTime[2] - smallTime[2]];
    }
    examTimeRemainInSecond(time) {
        return (time[0] * 3600 ) + (time[1] * 60) + time[2];
    }
    examMarksOccupied() {
        let marks = 0;
        for (let i = 0; i < this.shared.currentPaper.section.length - 1; i++) {
            if (i == 0) {
                marks += this.shared.currentPaper.section[i][0] * this.shared.currentPaper.section[i][2];
            } else {
                marks += (this.shared.currentPaper.section[i][0] - this.shared.currentPaper.section[i - 1][0]) * this.shared.currentPaper.section[i][2];
            }
        }
        return marks;
    }
    examMarksRemain() {
        return this.shared.currentPaper.fullmarks - this.examMarksOccupied();
    }
    examTimerStart() {
        let time = this.examTimeRange();
        let timeInSec = ((time[0] * 3600) + (time[1] * 60) + time[2]) * 1000;
        const interVal = setInterval(() => {
            document.getElementById("timer").textContent = `Time Left: ${time[0] < 10 ? '0' + time[0] : time[0]}:${time[1] < 10 ? '0' + time[1] : time[1]}:${time[2] < 10 ? '0' + time[2] : time[2]}`;
            time[2]--;
            if (time[2] == -1) {
                time[2] = 59;
                time[1]--;
                if (time[1] == -1) {
                    time[0]--;
                }
            }
        }, 1000);
        setTimeout(() => {
            clearInterval(interVal);
            showAlert("Times up, Exam is end now, Your result appear soon!");
        }, timeInSec + 1000);
    }
    questionTimerStart(number = 0) {
        clearInterval(interVal);
        let time = this.shared.solveList[number][3] != undefined ? this.shared.solveList[number][3] : this.shared.currentPaper.section[this.shared.currentCategory-1][1];
        if (time != 0) {
            interVal = setInterval(() => {
                document.getElementById("tmk").textContent = `00:${time < 10 ? '0' + time : time}`;
                time--;
                this.shared.solveList[number][3] = time;
            }, 1000);
            setTimeout(() => {
                if (time < 1) {
                    clearInterval(interVal);
                    showAlert("Times up for this Question");
                }
            }, (time * 1000));
        } else {
            document.getElementById("tmk").textContent = `00:00`;
        }
    }
}

class ExamEngine {
    constructor(currentPaper, currentCategory, root) {
        this.root = root;
        this.modequestion = 0;
        this.shared = {
            currentQuestionNumber: 1,
            solveList: [],
            currentPaper: currentPaper,
            currentCategory: currentCategory
        };
        this.questions1 = [];
        this.questions2 = [];
        this.questions3 = [];
        this.setPaperData();
        this.attachButtonListeners();
    }
    attachButtonListeners() {
        const prevBtn = document.getElementById("btn-prev");
        const nextBtn = document.getElementById("btn-next");
        if (prevBtn) {
            prevBtn.addEventListener("click", () => this.prevQuestion());
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", () => this.nextQuestion());
        }
    }
    setPaperData() {
        this.questions1 = this.shared.currentPaper.question.set1;
        this.questions2 = this.shared.currentPaper.question.set2;
        this.questions3 = this.shared.currentPaper.question.set3;
        this.root.innerHTML = this.root.innerHTML.replaceAll("{paper.name}", this.shared.currentPaper.name);
        this.root.innerHTML = this.root.innerHTML.replaceAll("{question.fullmarks}", this.shared.currentPaper.fullmarks);
        this.root.innerHTML = this.root.innerHTML.replaceAll("{student.name}", this.shared.currentPaper.id);
        this.randomPaperChoose();
    }
    populate(number) {
        exam.getNewQuestion(number - 1);
    }
    randomPaperChoose() {
        let k = Math.floor((Math.random() * (4 - (1)) + (1)));
        if (k == 1) {
            exam = new Exam(this.questions3, this.questionList.bind(this), this.shared);
            this.modequestion = 1;
        } else if (k == 2) {
            exam = new Exam(this.questions3, this.questionList.bind(this), this.shared);
            this.modequestion = 2;
        } else {
            exam = new Exam(this.questions3, this.questionList.bind(this), this.shared);
            this.modequestion = 3;
        }
        for (let i = 0; i < exam.questions.length; i++) {
            this.shared.solveList[i] = [i + 1, null, null]; //index, Q, A, time
        }
    }
    reorderSection() {
        if (this.shared.currentPaper.section[0][0] != 0) {
            for (let i = 0; i < this.shared.currentPaper.section.length - 1; i++) {
                if (this.shared.currentPaper.section[i][0] > this.shared.currentPaper.section[i + 1][0]) {
                    temp = this.shared.currentPaper.section[i];
                    this.shared.currentPaper.section[i] = this.shared.currentPaper.section[i + 1];
                    this.shared.currentPaper.section[i + 1] = temp;
                }
            }
            if (this.shared.currentPaper.section[this.shared.currentPaper.section.length - 1][0] < exam.questions.length) {
                this.shared.currentPaper.section.length += 1;
                let prevBoundary = this.shared.currentPaper.section[this.shared.currentPaper.section.length - 2][0];
                let remainQ = exam.questions.length - prevBoundary;
                let remainTime = exam.examTimeRemainInSecond(exam.examTimeRange()) - exam.exameTimeOccupied(true);
                let remainMarks = exam.examMarksRemain();
                let perQTime = remainQ > 0 ? Math.floor(remainTime / remainQ) : 0;
                let perQMarks = remainQ > 0 ? Math.max(0, Number.isInteger(remainMarks/remainQ) ? remainMarks/remainQ : +(remainMarks/remainQ).toFixed(2)) : 0;
                this.shared.currentPaper.section[this.shared.currentPaper.section.length - 1] = [prevBoundary + remainQ, perQTime, perQMarks, 0];
            }
        } else {
            this.shared.currentPaper.section[0][0] = exam.questions.length;
        }
        if (exam.examMarksRemain() < 0 || (this.shared.currentPaper.section[0][2] > this.shared.currentPaper.fullmarks)) {
            showAlert("Check the marks distribution, it should be over marks given..");
        }
        this.displayCategores();
    }
    questionList() {
        this.temp = '';
        let start, end;
        if (this.shared.currentPaper.section[0][0] === exam.questions.length - 1) {
            start = 0;
            end = exam.questions.length;
        } else {
            start = this.shared.currentCategory === 1 ? 0 : this.shared.currentPaper.section[this.shared.currentCategory - 2][0];
            end = this.shared.currentPaper.section[this.shared.currentCategory - 1][0];
        }
        for (let i = start; i < end; i++) {
            let cssClass;
            if (this.shared.solveList[i][2] != null) {
                cssClass = "bg-green";
            } else {
                if (this.shared.solveList[i][1] != null) {
                    cssClass = "bg-red";
                } else {
                    cssClass = "bg-white";
                }
            }
            this.temp += `<div class="question-item btn ${cssClass}" id="question-item${i + 1}">${i + 1}</div>`;
        }
        document.querySelector(".question-list").innerHTML = this.temp;
        for (let i = start; i < end; i++) {
            const btn = document.getElementById(`question-item${i + 1}`);
            btn.addEventListener("click", () => {
                this.populate(i + 1);
            });
        }
    }
    displayCategores() {
        this.temp = '';
        for (let i = 0; i < ExamInterface.get_currentPaper().section.length; i++) {
            this.temp += `<span class="btn" id="category${i + 1}">category-${i + 1}</span>`;
        }
        document.getElementById('category-list').innerHTML = this.temp;
        for (let i = 0; i < ExamInterface.get_currentPaper().section.length; i++) {
            const btn = document.getElementById(`category${i + 1}`);
            btn.addEventListener("click", () => {
                this.swapSection(i + 1);
            });
        }
        this.swapSection(1);
    }
    swapSection(id) {
        for (let i = 0; i < this.shared.currentPaper.section.length; i++) {
            document.getElementById('category' + (i + 1)).classList.remove("active");
        }
        document.getElementById('category' + id).classList.add("active");
        this.shared.currentCategory = id;
        let priviusLisit = (this.shared.currentCategory <= 1 ? 0 : this.shared.currentPaper.section[this.shared.currentCategory - 2][0]);
        document.getElementById('side-cateno').textContent = `Category ${id}, (${this.shared.currentPaper.section[this.shared.currentCategory - 1][0] - priviusLisit}/${exam.questions.length})`;
        document.getElementById('positive-marks').textContent = this.shared.currentPaper.section[this.shared.currentCategory - 1][2];
        document.getElementById('negative-marks').textContent = this.shared.currentPaper.section[this.shared.currentCategory - 1][3] > 0 ? '-' + this.shared.currentPaper.section[this.shared.currentCategory - 1][3] : this.shared.currentPaper.section[this.shared.currentCategory - 1][3];
        this.questionList();
    }
    prevQuestion() {
        if (this.shared.currentQuestionNumber <= 1) {
            this.populate(1);
            showAlert("You are stand in the first question of this paper!");
        } else {
            this.populate(this.shared.currentQuestionNumber - 1);
            if (this.shared.currentCategory - 1 >= 1 && !(this.shared.currentQuestionNumber > this.shared.currentPaper.section[this.shared.currentCategory - 2][0])) {
                this.swapSection(this.shared.currentCategory - 1);
            }
        }
    }
    nextQuestion() {
        if (this.shared.currentQuestionNumber >= exam.questions.length) {
            this.populate(exam.questions.length);
            showAlert("You are stand in the last question of this paper!");
        } else {
            this.populate(this.shared.currentQuestionNumber + 1);
            if (this.shared.currentQuestionNumber > this.shared.currentPaper.section[this.shared.currentCategory - 1][0] && this.shared.currentCategory != this.shared.currentPaper.section.length) {
                this.swapSection(this.shared.currentCategory + 1);
            }
        }
    }
}


