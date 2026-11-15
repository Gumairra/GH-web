import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import "./LineChart.css";

Chart.register(...registerables);

const AXIS_COLOR = "#5f6a72";
const GRID_COLOR = "rgba(227, 224, 213, 0.8)";
const FONT_FAMILY = "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

function LineChart({ labels, datasets, type = "line" }) {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        // Hapus chart sebelumnya
        if (chartRef.current) {
            chartRef.current.destroy();
        }

        const ctx = canvasRef.current.getContext("2d");

        chartRef.current = new Chart(ctx, {
            type: type,
            data: {
                labels: labels,
                datasets: datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,

                // Tooltip mengikuti sumbu X agar mudah membaca titik data
                interaction: { mode: "index", intersect: false },
                layout: { padding: { top: 8, right: 6 } },

                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: "rgba(31, 42, 38, 0.94)",
                        titleColor: "#eaf4ee",
                        bodyColor: "#d6e4da",
                        borderColor: "rgba(127, 211, 164, 0.35)",
                        borderWidth: 1,
                        cornerRadius: 10,
                        padding: 10,
                        boxWidth: 8,
                        boxHeight: 8,
                        boxPadding: 4,
                        usePointStyle: true,
                        titleFont: { family: FONT_FAMILY, size: 11, weight: "600" },
                        bodyFont: { family: FONT_FAMILY, size: 11 },
                    },
                },

                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                        border: {
                            display: false,
                        },
                        ticks: {
                            color: AXIS_COLOR,
                            font: { family: FONT_FAMILY, size: 10 },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 8,
                        },
                    },

                    y: {
                        beginAtZero: false,
                        grid: {
                            color: GRID_COLOR,
                            drawTicks: false,
                        },
                        border: {
                            display: false,
                        },
                        ticks: {
                            color: AXIS_COLOR,
                            font: { family: FONT_FAMILY, size: 10 },
                            padding: 6,
                            maxTicksLimit: 5,
                        },
                    },
                },
            },
        });

        requestAnimationFrame(() => {
            chartRef.current?.resize();
        });

        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [labels, datasets, type]);

    return (
        <div className="linechart-shell relative w-full h-full min-h-[224px]">
            <canvas ref={canvasRef}></canvas>
        </div>
    );
}

export default LineChart;
