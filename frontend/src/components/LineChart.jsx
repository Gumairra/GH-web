import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
import "./LineChart.css";

Chart.register(...registerables);

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

                plugins: {
                    legend: {
                        display: false,
                    },
                },

                scales: {
                    x: {
                        grid: {
                            display: false,
                        },
                    },

                    y: {
                        beginAtZero: false,
                        grid: {
                            color: "#E3E0D5",
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