class Exam{
    static id = '';
    static category = '';
    static stream = '';

    constructor(){
        this.ai_exam_list = [
            {
                id: 'EXID@12g9',
                subject: 'Geography',
                topic: 'Formation of river',
                class: '11',
                department: 'Arts',
                marks: 50,
                time: '1:30:00',
                mode: 'easy'
            },
            {
                id: 'EXID@13h2',
                subject: 'History',
                topic: 'French Revolution',
                class: '10',
                department: 'Arts',
                marks: 70,
                time: '2:30:00',
                mode: 'medium'
            },
            {
                id: 'EXID@14k7',
                subject: 'Mathematics',
                topic: 'Quadratic Equations',
                class: '11',
                department: 'Science',
                marks: 60,
                time: '2:00:00',
                mode: 'hard'
            },
            {
                id: 'EXID@15m3',
                subject: 'Biology',
                topic: 'Photosynthesis',
                class: '12',
                department: 'Science',
                marks: 25,
                time: '0:30:00',
                mode: 'easy'
            },
            {
                id: 'EXID@16n8',
                subject: 'Economics',
                topic: 'Supply and Demand',
                class: '12',
                department: 'Commerce',
                marks: 50,
                time: '1:30:00',
                mode: 'medium'
            }
        ];
        this.custom_exam_list = this.ai_exam_list;
    }

    initSetupExam(){
        this.ai_exam_generator();
        this.custom_exam_generator();
        Exam.id = String(document.querySelector('.exam-page .bottom .flx .left').innerText.split(',')[0]);
        Exam.category = String(document.querySelector('.exam-page .bottom .flx .left').innerText.split(',')[1]);
        Exam.stream = String(document.querySelector('.exam-page .bottom .flx .left').innerText.split(',')[2]);
        document.querySelector('.exam-page .bottom .flx .left').innerText = '';
    }

    ai_exam_generator(){
        try{
            const exam_box = document.getElementById('ai_exam');
            if(this.ai_exam_list.length <= 0){
                exam_box.innerHTML = "<h6>>> No Exam found on this ID!</h6>";
                exam_box.style.display = "block";
                return;
            }
            exam_box.innerHTML = this.ai_exam_list.map(e => exam_box.innerHTML.replaceAll('{subject}', e.subject)).join('');
            exam_box.style.display = "grid";
        }catch(e){
            system.alert({"error": 500, "message": "Fail to get your Ai exam list from our server due to following error: <br>"+e});
            new PopUp('danger', 4000).create('Fail to get your Ai exam list from our server');
        }
    }

    custom_exam_generator(){
        try{
            const exam_box = document.getElementById('custom_exam');
            if(this.custom_exam_list.length <= 0){
                exam_box.innerHTML = "<h6>>> No Exam found for this ID!</h6>";
                exam_box.style.display = "block";
                return;
            }
            const template = exam_box.innerHTML;
            exam_box.innerHTML = this.custom_exam_list.map(e =>
            template
                .replaceAll('{subject}', e.subject)
                .replaceAll('{topic}', e.topic)
                .replaceAll('{class}', e.class)
                .replaceAll('{department}', e.department)
                .replaceAll('{marks}', e.marks)
                .replaceAll('{mode}', e.mode)
            ).join('');
            exam_box.style.display = "grid";
        }catch(e){
            system.alert({"error": 500, "message": "Fail to get your Faculty exam list from our server due to following error: <br>"+e});
            new PopUp('danger', 4000).create('Fail to get your Faculty exam list from our server');
        }
    }

    loadExamSetUpWindow(subject, type='Ai'){
        if(type=='Ai'){
            document.querySelector('.blbg').style.display = "block";
            document.querySelector('.blbg .examSetUp .name').textContent = 'Subject: '+subject+' by AI';
        }else{
            new PopUp('warning', 4000).create('This type of exam is not listed in SAIT under ExamCall');
        }
    }

    closeExamSetUpWindow(){
        document.querySelector('.blbg').style.display = "none";
    }

    setMyExam(){
        try{
            const subject = document.querySelector('.blbg .examSetUp .name').textContent.split('Subject: ')[1].split(' by ')[0];
            const type = document.querySelector('.blbg .examSetUp .name').textContent.split('Subject: ')[1].split(' by ')[1];
            if(type == "AI"){
                const marks  = Number(document.querySelector('.examSetUp #marks').value);
                const mode = document.querySelector('.examSetUp #mode').value;
                let info = Exam.id+'-'+subject+'-'+'Full syllabus'+'-'+type+'-'+mode+'-'+marks+'-'+Exam.category+'-'+Exam.stream;
                route('/examcall?encode='+(system.encoder(info.replaceAll(' ', '%20'), '1441')));
            }else if(type == "Faculty"){

            }
        }catch(e){
            console.log(e);
            new PopUp('warning', 5000).create('Exam setup is not possible due to unwanted customization!');
        }
    }
}

new Exam().initSetupExam();
window.loadExamSetUpWindow = (subject, type) => new Exam().loadExamSetUpWindow(subject, type);
window.setMyExam = () => new Exam().setMyExam();
window.closeExamSetUpWindow = () => new Exam().closeExamSetUpWindow();