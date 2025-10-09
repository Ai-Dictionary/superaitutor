function getMonthYearList(signup, examStr) {
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

let performanceChart = null;
function performanceGraph(){
    const xValues = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    const yValues1 = [30, 56, 78, 82, 98, 68, 83, 91, 88, 92, 94, 89];
    const yValues2 = [84, 92, 81, 98, 96, 95, 86, 90, 92, 99, 93, 94];

    const ctx = document.getElementById('performance');

    if(performanceChart){
        performanceChart.destroy();
    }

    performanceChart = new Chart(ctx, {
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

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.0';
script.onload = () => {
    performanceGraph();
};
document.head.appendChild(script);