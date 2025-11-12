class Exam{
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
}

new Exam().initSetupExam();