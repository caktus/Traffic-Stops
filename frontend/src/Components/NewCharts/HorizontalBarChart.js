import { Bar } from 'react-chartjs-2';

export default function HorizontalBarChart({
  data,
  title,
  displayLegend = true,
  tooltipLabelCallback,
}) {
  const options = {
    responsive: true,
    indexAxis: 'y',
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
            console.log(context);
            return tooltipLabelCallback(context);
          },
        },
      },
    },
  };

  console.log(data);

  return <Bar options={options} data={data} />;
}
