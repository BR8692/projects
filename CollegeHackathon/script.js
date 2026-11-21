
function toggleMenu() {

    const nav = document.getElementById("navLinks");

    nav.classList.toggle("active");

}

// Close menu after clicking a navigation link

document.querySelectorAll(".nav-links a").forEach(link => {

    link.addEventListener("click", () => {

        document.getElementById("navLinks")
            .classList.remove("active");

    });

});
