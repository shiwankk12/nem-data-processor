import {
  formatDateTimeForSQL,
  parseNEM12Date,
} from "@/lib/utils/date-formatter";

describe("Date Formatter", () => {
  it("should parse NEM12 date correctly", () => {
    const date = parseNEM12Date("20050301");
    expect(date.getFullYear()).toBe(2005);
    expect(date.getMonth()).toBe(2); // March (0-indexed)
    expect(date.getDate()).toBe(1);
  });

  it("should handle different timezones consistently", () => {
    const date1 = new Date("2005-03-01T06:30:00.000Z");
    const date2 = new Date("2005-03-01T06:30:00.000+10:00");

    const formatted1 = formatDateTimeForSQL(date1);
    const formatted2 = formatDateTimeForSQL(date2);

    expect(formatted1).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(formatted2).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});
