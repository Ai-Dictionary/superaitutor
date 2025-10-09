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