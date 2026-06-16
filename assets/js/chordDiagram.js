document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("chord-diagram");
    if (!container) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const palette = [
        "#1af07d", "#00bbff", "#ffcd56", "#ff6384", "#9966ff",
        "#4bc0c0", "#ffa500", "#8dd3c7", "#fb8072", "#bebada"
    ];

    function el(name, attrs = {}) {
        const node = document.createElementNS(svgNS, name);
        Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
        return node;
    }

    function drawNetwork(data) {
        const authors = data.authors || [];
        const matrix = data.matrix || [];
        const counts = data.author_counts || {};
        const size = 600;
        const center = size / 2;
        const radius = 185;
        const labelRadius = 230;
        const points = authors.map((author, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / authors.length;
            return {
                author,
                angle,
                x: center + radius * Math.cos(angle),
                y: center + radius * Math.sin(angle),
                labelX: center + labelRadius * Math.cos(angle),
                labelY: center + labelRadius * Math.sin(angle)
            };
        });

        container.replaceChildren();
        const svg = el("svg", {
            width: size,
            height: size,
            viewBox: `0 0 ${size} ${size}`,
            role: "img",
            "aria-label": "Co-author collaboration network"
        });

        const links = el("g", { opacity: "0.72" });
        matrix.forEach((row, sourceIndex) => {
            row.forEach((weight, targetIndex) => {
                if (targetIndex <= sourceIndex || weight <= 0) return;
                const source = points[sourceIndex];
                const target = points[targetIndex];
                const strokeWidth = Math.max(0.75, Math.min(5, weight / 3));
                links.appendChild(el("path", {
                    d: `M ${source.x} ${source.y} Q ${center} ${center} ${target.x} ${target.y}`,
                    fill: "none",
                    stroke: sourceIndex === 0 || targetIndex === 0 ? "#1af07d" : "#00bbff",
                    "stroke-width": strokeWidth,
                    "stroke-opacity": sourceIndex === 0 || targetIndex === 0 ? "0.45" : "0.22"
                }));
            });
        });
        svg.appendChild(links);

        points.forEach((point, index) => {
            const group = el("g");
            const count = counts[point.author] || 1;
            const nodeRadius = index === 0 ? 11 : Math.max(5, Math.min(10, 4 + count / 3));
            const color = palette[index % palette.length];

            group.appendChild(el("circle", {
                cx: point.x,
                cy: point.y,
                r: nodeRadius,
                fill: color,
                stroke: "#ffffff",
                "stroke-width": index === 0 ? "2" : "1"
            }));

            const text = el("text", {
                x: point.labelX,
                y: point.labelY,
                fill: index === 0 ? "#1af07d" : "#f4f4f4",
                "font-size": index === 0 ? "14" : "11",
                "font-weight": index === 0 ? "700" : "500",
                "font-family": "Poppins, Arial, sans-serif",
                "text-anchor": point.labelX < center - 10 ? "end" : point.labelX > center + 10 ? "start" : "middle",
                "dominant-baseline": "middle"
            });
            text.textContent = point.author.length > 24 ? `${point.author.slice(0, 22)}...` : point.author;
            group.appendChild(text);

            const title = el("title");
            title.textContent = `${point.author}: ${count} shared publication${count === 1 ? "" : "s"}`;
            group.appendChild(title);
            svg.appendChild(group);
        });

        container.appendChild(svg);
    }

    fetch(`assets/js/coauthor_data.json?v=${Date.now()}`, { cache: "no-store" })
        .then(response => response.json())
        .then(drawNetwork)
        .catch(error => {
            console.error("Error loading co-author network:", error);
            container.textContent = "Co-author network unavailable";
        });
});
