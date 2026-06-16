document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("radar-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const palette = [
        "#ff6384", "#36a2eb", "#4bc0c0", "#9966ff", "#ff9f40",
        "#ffcd56", "#ffc8c8", "#1af07d", "#ffa500", "#ffffff"
    ];

    function scaleData(rawData, maxValues) {
        return Object.keys(rawData).map(label => {
            const max = maxValues[label] || rawData[label] || 1;
            return Math.max(0, Math.min(1, rawData[label] / max));
        });
    }

    function fitCanvas() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(320, Math.floor(rect.width));
        const height = Math.max(320, Math.floor(rect.height));
        const ratio = window.devicePixelRatio || 1;

        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        return { width, height };
    }

    function polarPoint(centerX, centerY, radius, angle) {
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
        };
    }

    function drawRadar(data) {
        const rawData = data.rawData || {};
        const maxValues = data.maxValues || {};
        const labels = Object.keys(rawData);
        const values = scaleData(rawData, maxValues);
        const { width, height } = fitCanvas();
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.31;
        const labelRadius = radius + 54;

        ctx.clearRect(0, 0, width, height);
        ctx.lineWidth = 1;
        ctx.font = "12px Poppins, Arial, sans-serif";
        ctx.textBaseline = "middle";

        for (let ring = 1; ring <= 5; ring++) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * ring / 5, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
            ctx.stroke();
        }

        labels.forEach((label, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / labels.length;
            const end = polarPoint(centerX, centerY, radius, angle);
            const labelPoint = polarPoint(centerX, centerY, labelRadius, angle);

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
            ctx.stroke();

            ctx.fillStyle = "#f4f4f4";
            ctx.textAlign = labelPoint.x < centerX - 5 ? "right" : labelPoint.x > centerX + 5 ? "left" : "center";
            ctx.fillText(label, labelPoint.x, labelPoint.y - 8);

            ctx.font = "700 13px Poppins, Arial, sans-serif";
            ctx.fillStyle = palette[index % palette.length];
            ctx.fillText(String(rawData[label]), labelPoint.x, labelPoint.y + 10);
            ctx.font = "12px Poppins, Arial, sans-serif";
        });

        ctx.beginPath();
        values.forEach((value, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / values.length;
            const point = polarPoint(centerX, centerY, radius * value, angle);
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fillStyle = "rgba(26, 240, 125, 0.22)";
        ctx.strokeStyle = "#1af07d";
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();

        values.forEach((value, index) => {
            const angle = -Math.PI / 2 + index * Math.PI * 2 / values.length;
            const point = polarPoint(centerX, centerY, radius * value, angle);
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = palette[index % palette.length];
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.fill();
            ctx.stroke();
        });
    }

    fetch(`assets/js/radarplotdata.json?v=20260616-scholar-citations-${Date.now()}`, { cache: "no-store" })
        .then(response => response.json())
        .then(data => {
            drawRadar(data);
            window.addEventListener("resize", () => drawRadar(data));
        })
        .catch(error => {
            console.error("Error loading radar metrics:", error);
            const { width, height } = fitCanvas();
            ctx.fillStyle = "#ffffff";
            ctx.font = "14px Poppins, Arial, sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Metrics unavailable", width / 2, height / 2);
        });
});
