import { Bar } from 'react-chartjs-2';

export default function HorizontalBarChart({
  data,
  title,
  displayLegend = true,
  tooltipLabelCallback,
  xStacked = false,
  yStacked = false
}) {
  const options = {
    responsive: true,
    maintainAspectRatio: true,
    indexAxis: 'y',
    scales: {
      x: {
          stacked: xStacked,
      },
      y: {
        max: 200,
        stacked: yStacked,
      },
    },
    plugins: {
      legend: {
        display: displayLegend,
        position: 'right',
      },
      title: {
        display: true,
        text: title,
      },
      tooltip: {
        callbacks: {
          label(context) {
            return tooltipLabelCallback(context);
          },
        },
      },
    },
  };

  return <Bar options={options} data={data} />;
}
