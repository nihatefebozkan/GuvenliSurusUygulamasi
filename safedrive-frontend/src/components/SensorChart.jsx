import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

// timestamp -> "ss:dd:ss"
const fmtTime = (t) =>
  new Date(t).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

export default function SensorChart({ data = [] }) {
  // Backend azalan sırada döner; grafikte eskiden yeniye soldan sağa olsun
  const ordered = [...data].reverse();

  const labels = ordered.map((d) => fmtTime(d.timestamp));
  const values = ordered.map((d) => d.accelerometer?.x ?? null);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'İvme (m/s²)',
        data: values,
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.12)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false },
      annotation: {
        annotations: {
          hardBrakeLine: {
            type: 'line',
            yMin: -8,
            yMax: -8,
            borderColor: '#dc2626',
            borderWidth: 2,
            borderDash: [6, 6],
            label: {
              display: true,
              content: 'Ani Fren Eşiği (-8)',
              position: 'start',
              backgroundColor: 'rgba(220, 38, 38, 0.85)',
              color: '#fff',
              font: { size: 11 }
            }
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Zaman' },
        ticks: { maxTicksLimit: 12, autoSkip: true }
      },
      y: {
        title: { display: true, text: 'İvme (m/s²)' }
      }
    }
  };

  if (!data.length) {
    return <div className="empty-msg">Bu cihaz için sensör verisi bulunamadı.</div>;
  }

  return (
    <div style={{ height: 360 }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
