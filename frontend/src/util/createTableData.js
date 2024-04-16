export default function createTableData(responseData) {
  const tableData = [];
  const data = responseData.table_data.length ? JSON.parse(responseData.table_data).data : [];
  data.forEach((e) => {
    const dataCounts = { ...e };
    delete dataCounts.year;
    // Need to assign explicitly otherwise the download data orders columns by alphabet.
    tableData.unshift({
      year: e.year,
      white: e.white,
      black: e.black,
      native_american: e.native_american,
      asian: e.asian,
      other: e.other,
      hispanic: e.hispanic,
      total: Object.values(dataCounts).reduce((a, b) => a + b, 0),
    });
  });

  return tableData;
}
