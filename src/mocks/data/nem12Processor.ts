export const nem12Response = {
  sqlStatements: [
    "INSERT INTO meter_readings VALUES ('1234567890', 'E1', '2024-01-01', 125.5);",
    "INSERT INTO meter_readings VALUES ('9876543210', 'E1', '2024-01-02', 98.7);",
  ],
  summary: {
    totalRecords: 2,
    uniqueRecords: 2,
    duplicatesFound: 0,
    registerStats: { original: 2 },
    nmis: ["1234567890", "9876543210"],
    dateRange: { start: "2024-01-01", end: "2024-01-02" },
    processingTime: 100,
  },
  errors: [],
};
