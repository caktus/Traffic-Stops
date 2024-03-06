export const pieColors = ['#02bcbb', '#8879fc', '#9c0f2e', '#ffe066', '#0c3a66', '#9e7b9b'];
export const pieChartLabels = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'];
export const pieChartConfig = {
  backgroundColor: pieColors,
  borderColor: pieColors,
  hoverBackgroundColor: pieColors,
  borderWidth: 1,
};

export default ({ id, data }) => data[`${id}Color`];
