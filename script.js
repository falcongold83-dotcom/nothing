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
        if (!target) return;
        
        let count = 0;
        const speed = target / 100;
        
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
 * MODAL LOGIC
 */
const modal = document.getElementById("modalOverlay");

function openModal() {
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target == modal) {
        closeModal();
    }
}

/**
 * FORM SUBMISSION (Simulated)
 */
document.getElementById("paymentForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const btn = this.querySelector(".btn-submit");
    const originalText = btn.innerText;
    
    btn.innerText = "VERIFYING...";
    btn.disabled = true;

    // Simulate blockchain verification lag
    setTimeout(() => {
        alert("Transaction recorded. You will receive Nothing shortly.");
        this.reset();
        btn.innerText = originalText;
        btn.disabled = false;
        closeModal();
    }, 2000);
});

/**
 * GENERATE CONTRIBUTORS LIST
 */
const contributorList = document.getElementById("contributorList");
const contributors = [
    { id: "0001", name: "Satoshi's Ghost", amount: "0.5 BTC" },
    { id: "0002", name: "Void Walker", amount: "10 ETH" },
    { id: "0003", name: "Nihilist_99", amount: "5,000 USDT" }
];

function initContributors() {
    let html = "";
    
    // Add real simulated contributors
    contributors.forEach(c => {
        html += `
            <div class="contributor-card reveal">
                <span class="contributor-id">#${c.id}</span>
                <span class="contributor-name">${c.name}</span>
                <span class="contributor-val">${c.amount}</span>
            </div>
        `;
    });

    // Fill the rest of the 100 with "Waiting"
    for (let i = 4; i <= 100; i++) {
        const id = i.toString().padStart(4, '0');
        html += `
            <div class="contributor-card reveal">
                <span class="contributor-id">#${id}</span>
                <span class="contributor-status">Waiting for Nothing...</span>
            </div>
        `;
    }
    
    contributorList.innerHTML = html;
}

// Initialize the list
initContributors();

// Initial check for elements in view
revealOnScroll();
