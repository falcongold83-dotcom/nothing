// Custom Cursor
const cursor = document.querySelector('.cursor');

document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
});

document.addEventListener('mousedown', () => {
    cursor.style.transform = 'scale(0.8)';
});

document.addEventListener('mouseup', () => {
    cursor.style.transform = 'scale(1)';
});

// Scroll Reveal Observer
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(el => revealObserver.observe(el));

// Stats Counter Animation
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const current = (progress * (end - start) + start);
        
      if (obj.id === 'asset-count') {
    obj.innerHTML = Math.floor(current);
} else {
    obj.innerHTML = Math.floor(current).toString().padStart(3, '0');
}
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

window.addEventListener('load', () => {
    animateValue(document.getElementById('day-count'), 0, 1, 1500);
    animateValue(document.getElementById('asset-count'), 0, 0, 1500);
    animateValue(document.getElementById('contributor-count'), 0, 0, 1500);
});

// Copy to Clipboard Function
function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerText;
        btn.innerText = 'COPIED';
        btn.style.background = 'white';
        btn.style.color = 'black';
        
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = 'transparent';
            btn.style.color = 'white';
        }, 2000);
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

// Subtle Glitch Effect on Title
const title = document.querySelector('.glitch');
setInterval(() => {
    title.style.textShadow = Math.random() > 0.95 ? '2px 0 #ff00c1, -2px 0 #00fff9' : 'none';
    setTimeout(() => {
        title.style.textShadow = 'none';
    }, 50);
}, 1000);

// Hover effect for interactive elements to expand cursor
const interactables = document.querySelectorAll('button, .wallet-card, .qr-placeholder');
interactables.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursor.style.transform = 'scale(3)';
        cursor.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    });
    el.addEventListener('mouseleave', () => {
        cursor.style.transform = 'scale(1)';
        cursor.style.backgroundColor = 'transparent';
    });
});
