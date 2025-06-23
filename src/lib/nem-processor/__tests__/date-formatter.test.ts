import { DateFormatter } from "../utils/date-formatter";

describe("DateFormatter", () => {
  let formatter: DateFormatter;

  beforeEach(() => {
    formatter = new DateFormatter();
  });

  describe("formatDateTimeForSQL", () => {
    it("should format date correctly for SQL", () => {
      const date = new Date("2005-03-01T14:30:45");
      const formatted = formatter.formatDateTimeForSQL(date);

      expect(formatted).toBe("2005-03-01 14:30:45");
    });

    it("should pad single digits with zeros", () => {
      const date = new Date("2005-01-05T09:05:03");
      const formatted = formatter.formatDateTimeForSQL(date);

      expect(formatted).toBe("2005-01-05 09:05:03");
    });

    it("should handle midnight correctly", () => {
      const date = new Date("2005-03-01T00:00:00");
      const formatted = formatter.formatDateTimeForSQL(date);

      expect(formatted).toBe("2005-03-01 00:00:00");
    });

    it("should handle end of day correctly", () => {
      const date = new Date("2005-03-01T23:59:59");
      const formatted = formatter.formatDateTimeForSQL(date);

      expect(formatted).toBe("2005-03-01 23:59:59");
    });
  });

  describe("formatDateForRange", () => {
    it("should format date for range display", () => {
      const date = new Date("2005-03-01T14:30:45");
      const formatted = formatter.formatDateForRange(date);

      expect(formatted).toBe("2005-03-01");
    });

    it("should ignore time component", () => {
      const date1 = new Date("2005-03-01T00:00:00");
      const date2 = new Date("2005-03-01T23:59:59");

      expect(formatter.formatDateForRange(date1)).toBe("2005-03-01");
      expect(formatter.formatDateForRange(date2)).toBe("2005-03-01");
    });

    it("should pad single digit months and days", () => {
      const date = new Date("2005-01-05T12:00:00");
      const formatted = formatter.formatDateForRange(date);

      expect(formatted).toBe("2005-01-05");
    });
  });
});
