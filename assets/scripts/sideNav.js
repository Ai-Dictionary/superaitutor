// // Toggle the visibility of a dropdown menu

// const toggleDropdown = (dropdown, menu, isOpen) => {
//     dropdown.classList.toggle("open", isOpen);
//     menu.style.height = isOpen ? `${menu.scrollHeight}px` : 0;
// };

// // Close all open dropdowns
// const closeAllDropdowns = () => {
//     document.querySelectorAll(".dropdown-container.open").forEach((openDropdown) => {
//         toggleDropdown(openDropdown, openDropdown.querySelector(".dropdown-menu"), false);
//     });
// };

// // Attach click event to all dropdown toggles
// document.querySelectorAll(".dropdown-switch").forEach((dropdownToggle) => {
//     dropdownToggle.addEventListener("click", (e) => {
//         e.preventDefault();

//         const dropdown = dropdownToggle.closest(".dropdown-container");
//         const menu = dropdown.querySelector(".dropdown-menu");
//         const isOpen = dropdown.classList.contains("open");

//         closeAllDropdowns(); // Close all open dropdowns
//         toggleDropdown(dropdown, menu, !isOpen); // Toggle current dropdown visibility
//     });
// });

// Attach click event to sidebar toggle buttons
document.querySelectorAll(".sidebar-toggler, .bi-layout-sidebar").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".sidebar").classList.toggle("collapsed");
        document.querySelector(".sidebar-header").classList.toggle("collapsed");
        document.querySelector(".sidebar-nav").classList.toggle("collapsed");
    });
});

// Collapse sidebar by default on small screens
if(window.innerWidth <= 1024){ 
    document.querySelector(".sidebar").classList.toggle("collapsed");
    document.querySelector(".sidebar-header").classList.toggle("collapsed");
    document.querySelector(".sidebar-nav").classList.toggle("collapsed");
}

document.addEventListener('DOMContentLoaded', function () {
    const dropdownContainers = document.querySelectorAll('.dropdown-container');

    dropdownContainers.forEach(container => {
        const switchElement = container.querySelector('.dropdown-switch');
        const dropdownMenu = container.querySelector('.dropdown-menu');

        switchElement.addEventListener('click', function (event) {
            if (event.target.closest('.dropdown-menu')) return;

            container.classList.toggle('open');
        });

        document.addEventListener('click', function (event) {
            if (!container.contains(event.target)) {
                container.classList.remove('open');
            }
        });
    });
});
