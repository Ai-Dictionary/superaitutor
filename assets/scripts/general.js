class General{
    constructor(){
        this.performanceChart = null;
        this.statusChart = null;
    }

    getMonthYearList(signup, examStr) {
        const [signupYear, signupMonth] = signup.split('-').map(Number);
        const months = examStr.split(',').map(pair => {
            const [m, score] = pair.split(':').map(s => s.trim());
            return { month: parseInt(m), score: parseInt(score) };
        });

        return months.map(({ month, score }, i) => {
            let year = signupYear;
            if (month < signupMonth) year += 1;
            return { month, year, score };
        });
    }
    performanceGraph(){
        const xValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
        const yValues1 = [30, 56, 78, 82, 98, 68, 83, 91, 88, 92, 94, 89];
        const yValues2 = [84, 92, 81, 98, 96, 95, 86, 90, 92, 99, 93, 94];

        const ctx = document.getElementById('performance');

        if(this.performanceChart){
            this.performanceChart.destroy();
        }

        this.performanceChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: xValues,
                datasets: [
                    {
                        data: yValues1,
                        backgroundColor: "rgba(65, 105, 225, 0.4)",
                        borderColor: "rgba(0,0,255,0.1)",
                        lineTension: 0,
                        fill: true
                    }, 
                    {
                        data: yValues2,
                        backgroundColor: "rgba(65, 225, 84, 0.3)",
                        borderColor: "rgba(200, 255, 0, 0.1)",
                        lineTension: 0,
                        fill: true
                    }
                ]
            },
            options: {
                plugins: {
                    legend: { display: false },
                    title: {
                        display: false,
                        text: "Marks vs. Time",
                        font: { size: 16 }
                    }
                }
            }
        });
    }
    parseStudyData(dataString) {
        const dataMap = {};
        dataString.split(',').forEach(entry => {
            const [month, hours] = entry.split(':');
            dataMap[month] = parseFloat(hours);
        });

        const xValues = [];
        const yValues = [];

        for (let i = 1; i <= 12; i++) {
            const monthStr = i.toString();
            xValues.push(monthStr);
            yValues.push(dataMap[monthStr] || 0);
        }

        return { xValues, yValues };
    }
    statusGraph(){
        const studyData = "12:2.5,1:3.4,2:2.3,3:2.6,4:4.3,5:17.2,6:28.1,7:49.5,8:61.2,9:92.4,10:102.4";

        const startYear = 2024;

        const dataMap = {};
        studyData.split(',').forEach(entry => {
            const [month, hours] = entry.split(':');
            dataMap[month] = parseFloat(hours);
        });

        const monthNames = {
            "1": "Jan", "2": "Feb", "3": "Mar", "4": "Apr", "5": "May", "6": "Jun",
            "7": "Jul", "8": "Aug", "9": "Sep", "10": "Oct", "11": "Nov", "12": "Dec"
        };

        const xValues = [];
        const yRaw = [];

        let yearFlipped = false;

        studyData.split(',').forEach(entry => {
            const [month, hours] = entry.split(':');
            const numericMonth = parseInt(month);

            if(numericMonth === 1 && !yearFlipped){
                yearFlipped = true;
            }

            const year = yearFlipped ? startYear + 1 : startYear;
            const label = `${monthNames[month]} ${year.toString().slice(-2)}`;
            xValues.push(label);
            yRaw.push(parseFloat(hours));
        });

        const total = yRaw.reduce((sum, val) => sum + val, 0);
        const yValues = yRaw.map(val => (val / total) * 100);

        document.getElementById('totalStdTime').textContent = `${String(total).split('.')[0]*1+((String(total).split('.')[1].padEnd(2, 0))*1>=60?Math.floor((String(total).split('.')[1].padEnd(2, 0))*1/60):0)}h ${(String(total).split('.')[1].padEnd(2, 0))*1>=60?Math.floor((String(total).split('.')[1].padEnd(2, 0))*1-60):String(total).split('.')[1]}m`;
        if(document.getElementById('totalStdTime').textContent.split('h ')[0]>=90*yValues.length && document.getElementById('totalStdTime').textContent.split('h ')[0]<=150*yValues.length){
            document.getElementById('totalStdTime').innerHTML = "<i class='fa fa-check' style='color: green;'></i>"+document.getElementById('totalStdTime').textContent;
        }else{
            document.getElementById('totalStdTime').innerHTML = "<i class='fa fa-times' style='color: red;'></i>"+document.getElementById('totalStdTime').textContent;
        }

        const col1 = new Set();
        const colorArray = [ "#f589b8", "#899df5", "#89f0f5", "#b6f589", "#f4709cff", "#f5f589", "#9ff589", "#c3e079ff", "#f5bd89", "#0c8ff0", "#4169e1", "#2e57d1", "#9ab1f8", "#4360b5", "#03045e", "#0077b6", "#012a4a", "#324ab2", "#58cced"];
        for (let i = 0; i < xValues.length; i++) {
            let color = colorArray[Math.floor(Math.random() * colorArray.length)];
            while (col1.has(color)) {
                const randHex_1 = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
                const randHex_2 = Math.floor(Math.random() * 256).toString(16).padStart(4, '0');
                color = `${color.slice(0, 3)}${randHex_1}${randHex_2}`;
            }
            col1.add(color);
        }

        const ctx = document.getElementById('studyTime');
        const ul = document.querySelector('.pie-ul');
        this.pieGrpah(ul, ctx, { xValues, yValues, col1: [...col1] });
    }
    pieGrpah(ul, chart, values){
        const xValues = values.xValues;
        const yValues = values.yValues;
        const col1 = values.col1;
        ul.innerHTML = '';
        let temp, name, loc, styling="background-image: conic-gradient(", left=0, right;
        for(let j=0; j<xValues.length; j++){
            name = xValues[j];
            temp = yValues[j];
            loc = j;
            if(j<1){
                right = Math.round((yValues[j] / 100)*360)-1;
            }else{
                right = left + Math.round((yValues[j] / 100)*360)-1;
            }
            styling += `${col1[loc]} ${left}deg ${right-1}deg`;
            if(j<xValues.length-1){
                styling+=',';
            }
            left = right;
            if((xValues[loc] != '' ) && ((left + right) != 0)){
                ul.innerHTML += `<li><div class="pie-box"style="background: ${col1[loc]}"></div>${name} [≈ ${Math.round(yValues[j])}%]</li>`;
            }
            xValues[loc] = '';
        }
        styling += ");";
        chart.style.cssText = styling;
    }
}

// const result = getMonthYearList("2025-10", "10:78,11:82,12:90,1:88");
// console.log(result);
// [
//   { month: 10, year: 2025, score: 78 },
//   { month: 11, year: 2025, score: 82 },
//   { month: 12, year: 2025, score: 90 },
//   { month: 1, year: 2026, score: 88 }
// ]

/*
progress: {
    id: AID....,
    signup: '2025-10',
    exam: "10:78,11:82,12:90,1:88",
    mock: "10:63,11:85,12:30,1:39",
    study: "10:2.5,11:3.4,12:2.3,1:2.6"
}

*/

const general = new General();

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0';
script.onload = () => {
    general.performanceGraph();
    general.statusGraph();
};
document.head.appendChild(script);