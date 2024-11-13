export const pieColors = [
  '#027979', //new color: Teal, old color:'#02bcbb',
  '#8352F4', //new color: Purple, old color:'#8879fc',
  '#E60032', //new color: Red, old color:'#9c0f2e',
  '#4153F6', //new color: Blue, old color: #0c3a66',
  '#E37C1C', //new color: Orange, old color: '#ffe066',
  '#B40895', //new color: Fuschia, old color: '#9e7b9b'
];
export const pieChartLabels = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'];
export const pieChartConfig = {
  backgroundColor: pieColors,
  borderColor: pieColors,
  hoverBackgroundColor: pieColors,
  borderWidth: 1,
};

export default ({ id, data }) => data[`${id}Color`];
