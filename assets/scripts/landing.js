document.addEventListener("DOMContentLoaded", () => {
    const floaters = document.querySelectorAll(".small_floater");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    floaters.forEach(floater => observer.observe(floater));
});

document.addEventListener("DOMContentLoaded", () => {
    const elements = document.querySelectorAll(".downToUp");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    elements.forEach(el => observer.observe(el));
});

document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("typing");
    const words = ["learners", "mentors", "opportunities", "recruiters", "creators"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 120;
    const pauseTime = 4000;

    function type() {
        const currentWord = words[wordIndex];
        if (!isDeleting) {
            el.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            if (charIndex === currentWord.length) {
                isDeleting = true;
                setTimeout(type, pauseTime);
                return;
            }
        } else {
            el.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            if (charIndex === 0) {
                isDeleting = false;
                wordIndex = (wordIndex + 1) % words.length;
            }
        }
        setTimeout(type, typingSpeed);
    }
    type();
});

window.onload = function () {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    document.querySelector('.workspace').scrollTop = 0;
};

document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".offer-holder .btn");
    const bodies = document.querySelectorAll(".offer .body");

    function showBody(index) {
        bodies.forEach((body, i) => {
            body.style.display = i === index ? "grid" : "none";
        });
    }

    function updateButtonStyles(activeIndex) {
        buttons.forEach((btn, i) => {
            if (i === activeIndex) {
                btn.className = "btn btn-process";
            } else {
                btn.className = "btn btn-outline-process";
            }
        });
    }

    showBody(0);
    updateButtonStyles(0);

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            showBody(index);
            updateButtonStyles(index);
        });
    });
});

function offercolor_assigner(){
    let colorbin = ['greenyellow', 'orange', 'greenyellow', 'cornflowerblue', 'blueviolet', 'yellow', 'darkorange', 'orange'];
    let j=0;
    for(let i=0; i<document.querySelectorAll('.offer .image svg').length; i++){
        document.querySelectorAll('.offer .image svg')[i].style.color = colorbin[j]; 
        j++;
        if(j==8){
            j=0;
        }
    }
}