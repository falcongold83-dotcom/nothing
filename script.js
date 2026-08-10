// Initialize Lucide Icons
lucide.createIcons();

/**
 * SCROLL PROGRESS BAR
 */
window.onscroll = function() {
    updateProgressBar();
    revealOnScroll();
};

function updateProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    document.getElementById("progressBar").style.width = scrolled + "%";
}

/**
 * REVEAL ANIMATIONS ON SCROLL
 */
function revealOnScroll() {
    const reveals = document.querySelectorAll(".reveal");
    reveals.forEach(reveal => {
        const windowHeight = window.innerHeight;
        const revealTop = reveal.getBoundingClientRect().top;
        const revealPoint = 150;

        if (revealTop < windowHeight - revealPoint) {
            reveal.classList.add("active");
        }
    });
}

/**
 * COUNTER ANIMATION
 */
const stats = document.querySelectorAll(".stat-value");
const statsSection = document.querySelector(".stats-section");
let started = false;

function startCounters() {
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute("data-target"));
        if (!target && target !== 0) return;

        let count = 0;
        const speed = target / 100 || 1;

        const updateCount = () => {
            if (count < target) {
                count += Math.ceil(speed);
                stat.innerText = stat.innerText.includes('$') ?
                    `$${count.toLocaleString()}` : count.toLocaleString();
                setTimeout(updateCount, 20);
            } else {
                stat.innerText = stat.innerText.includes('$') ?
                    `$${target.toLocaleString()}` : target.toLocaleString();
            }
        };
        updateCount();
    });
}

// Observe stats section to trigger counter
const observerOptions = { threshold: 0.5 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !started) {
            startCounters();
            started = true;
        }
    });
}, observerOptions);

observer.observe(statsSection);

/**
 * WALLET COPY FUNCTIONALITY
 */
function copyAddress(id) {
    const text = document.getElementById(id).innerText;
    navigator.clipboard.writeText(text).then(() => {
        showToast();
    });
}

function showToast() {
    const toast = document.getElementById("toast");
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

/**
 * GENERATE CONTRIBUTORS LIST
 */

   
 
// Initialize the list


// Initial check for elements in view
revealOnScroll();

const cursor = document.getElementById("cursor");
console.log("Cursor found:", cursor);

let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;

document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateCursor() {
cursorX = mouseX;
cursorY = mouseY;

    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";

    requestAnimationFrame(animateCursor);
}

animateCursor();

document.querySelectorAll("a, button, .wallet-card").forEach((el) => {

    el.addEventListener("mouseenter", () => {
        cursor.style.width = "36px";
        cursor.style.height = "36px";
        cursor.style.background = "rgba(255,255,255,.08)";
    });

    el.addEventListener("mouseleave", () => {
        cursor.style.width = "18px";
        cursor.style.height = "18px";
        cursor.style.background = "rgba(255,255,255,.15)";
    });

});
// ===== Automatic Day Counter =====
const projectStart = new Date("2026-07-26");

function updateDayCounter() {
    const today = new Date();

    // حذف ساعت برای جلوگیری از اختلاف زمانی
    projectStart.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today - projectStart;
    const day = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const counter = document.getElementById("dayCounter");
    if (counter) {
        counter.textContent = String(day).padStart(3, "0");
    }
}

updateDayCounter();

/**
 * FAQ ACCORDION
 */
function toggleFaq(buttonEl) {
    const item = buttonEl.closest(".faq-item");
    const wasActive = item.classList.contains("active");

    document.querySelectorAll(".faq-item.active").forEach((openItem) => {
        openItem.classList.remove("active");
    });

    if (!wasActive) {
        item.classList.add("active");
    }
}
