export default (group, total) => parseFloat(Math.round((group / total) * 100).toFixed(2));
