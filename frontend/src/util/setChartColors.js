import { DEMOGRAPHICS_COLORS } from "Components/Charts/chartUtils";

export const pieColors = [
  DEMOGRAPHICS_COLORS.white,
  DEMOGRAPHICS_COLORS.black,
  DEMOGRAPHICS_COLORS.hispanic,
  DEMOGRAPHICS_COLORS.asian,
  DEMOGRAPHICS_COLORS.nativeAmerican,
  DEMOGRAPHICS_COLORS.other,
];
export const pieChartLabels = ['White', 'Black', 'Hispanic', 'Asian', 'Native American', 'Other'];
export const pieChartConfig = {
  backgroundColor: pieColors,
  borderColor: pieColors,
  hoverBackgroundColor: pieColors,
  borderWidth: 1,
};

export default ({ id, data }) => data[`${id}Color`];
