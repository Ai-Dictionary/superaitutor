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

    function offercolor_assigner() {
        let colorbin = ['greenyellow', 'orange', 'aqua', 'cornflowerblue', 'blueviolet', 'yellow', 'darkorange', 'mediumvioletred'];
        let j = 0;
        for (let i = 0; i < document.querySelectorAll('.offer .image svg').length; i++) {
            if (document.querySelectorAll('.offer .image svg')[i].classList.value == 'bi bi-star-half') {
                document.querySelectorAll('.offer .image svg')[i].style.color = 'gold';
            } else {
                document.querySelectorAll('.offer .image svg')[i].style.color = colorbin[j];
            }
            j++;
            if (j == 8) {
                j = 0;
            }
        }
    }

    function swap_feature() {
        const bodies = document.querySelectorAll('.offer .body');
        bodies.forEach(body => {
            const features = Array.from(body.querySelectorAll('.feature'));
            for (let i = features.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [features[i], features[j]] = [features[j], features[i]];
            }
            features.forEach(feature => body.appendChild(feature));
        });
    }

    showBody(0);
    updateButtonStyles(0);
    offercolor_assigner();
    swap_feature();

    buttons.forEach((btn, index) => {
        btn.addEventListener("click", () => {
            showBody(index);
            updateButtonStyles(index);
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const steps = document.querySelectorAll(".step");

    toggle_assistent_img = (index) => {
        document.querySelector(".middle").style.backgroundImage = `url('https://ai-dictionary.github.io/superaitutor/assets/images/landing_i${index + 4}.png')`;
    };

    steps.forEach(step => {
        const noDiv = step.querySelector(".no");
        const originalNoBg = noDiv.style.background;
        const originalStepBg = step.style.background;

        step.style.setProperty("--hover-bg", originalNoBg);

        step.addEventListener("click", e => {
            steps.forEach(s => {
                const n = s.querySelector(".no");
                s.style.background = "";
                n.style.background = n.getAttribute("data-original-bg");
            });

            step.style.background = originalNoBg;
            noDiv.style.background = "#fff";
            toggle_assistent_img(noDiv.textContent.trim() * 1);
            e.stopPropagation();
        });

        noDiv.setAttribute("data-original-bg", originalNoBg);
    });

    document.addEventListener("click", () => {
        steps.forEach(s => {
            const n = s.querySelector(".no");
            s.style.background = "";
            n.style.background = n.getAttribute("data-original-bg");
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const columns = document.querySelectorAll(".column");

    columns.forEach(col => {
        const scroller = document.createElement("div");
        scroller.className = "scroller";

        const posts = Array.from(col.children);
        posts.forEach(p => scroller.appendChild(p));

        posts.forEach(p => scroller.appendChild(p.cloneNode(true)));

        col.appendChild(scroller);

        const direction = col.classList.contains("middle") ? 1 : -1;

        let pos = 0;
        const speed = 0.5;

        function animate() {
            pos += direction * speed;
            scroller.style.transform = `translateY(${pos}px)`;

            const resetPoint = scroller.scrollHeight / 2;
            if (direction === -1 && pos <= -resetPoint) pos = 0;
            if (direction === 1 && pos >= resetPoint) pos = 0;

            requestAnimationFrame(animate);
        }
        animate();
    });
});