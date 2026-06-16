document.addEventListener("DOMContentLoaded", function () {
    const header = document.getElementById("header");
    const container = header ? header.querySelector(".container") : null;
    const role = document.getElementById("home-role");
    const motionAllowed = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (header && container && motionAllowed) {
        header.addEventListener("pointermove", function (event) {
            const rect = header.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            const tiltX = (y - 50) * -0.05;
            const tiltY = (x - 50) * 0.05;

            header.style.setProperty("--home-x", `${x}%`);
            header.style.setProperty("--home-y", `${y}%`);
            container.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        });

        header.addEventListener("pointerleave", function () {
            header.style.setProperty("--home-x", "78%");
            header.style.setProperty("--home-y", "34%");
            container.style.transform = "";
        });
    }

    if (role && motionAllowed) {
        const roles = (role.dataset.roles || role.textContent).split("|").filter(Boolean);
        let roleIndex = 0;
        let letterIndex = 0;
        let deleting = false;

        function tick() {
            const current = roles[roleIndex];
            role.textContent = current.slice(0, letterIndex);

            if (!deleting && letterIndex < current.length) {
                letterIndex += 1;
                window.setTimeout(tick, 62);
                return;
            }

            if (!deleting) {
                deleting = true;
                window.setTimeout(tick, 1250);
                return;
            }

            if (letterIndex > 0) {
                letterIndex -= 1;
                window.setTimeout(tick, 34);
                return;
            }

            deleting = false;
            roleIndex = (roleIndex + 1) % roles.length;
            window.setTimeout(tick, 260);
        }

        tick();
    }

    document.querySelectorAll("#header .social-links a").forEach(function (link) {
        link.addEventListener("pointerdown", function (event) {
            const ripple = document.createElement("span");
            const rect = link.getBoundingClientRect();
            ripple.className = "home-ripple";
            ripple.style.left = `${event.clientX - rect.left}px`;
            ripple.style.top = `${event.clientY - rect.top}px`;
            link.appendChild(ripple);
            window.setTimeout(() => ripple.remove(), 620);
        });
    });
});
