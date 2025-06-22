import { NEM12ProcessorService } from "@/lib/services/nem12-processor";

describe("NEM12 Processor - Complete Test Suite", () => {
  // Sample NEM12 CSV content for testing
  const sampleNEM12Content = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,20050301,0.461,0.810,0.568,0.944,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,1.233,A,,,20050310121004,20050310182204
200,NEM1201010,E1E2,1,E1,N1,01010,kWh,30,20050301
300,20050301,0.123,0.456,0.789,1.012,1.345,1.678,1.901,2.234,2.567,2.890,3.123,3.456,3.789,4.012,4.345,4.678,4.901,5.234,5.567,5.890,6.123,6.456,6.789,7.012,7.345,7.678,7.901,8.234,8.567,8.890,9.123,9.456,9.789,10.012,10.345,10.678,10.901,11.234,11.567,11.890,12.123,12.456,12.789,13.012,13.345,13.678,13.901,14.234,A,,,20050310121004,20050310182204
900`;

  describe("NEM12ProcessorService - End-to-End", () => {
    it("should process complete NEM12 file end-to-end", async () => {
      const file = new File([sampleNEM12Content], "test.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      expect(result).toBeDefined();
      expect(result.sqlStatements.length).toBeGreaterThan(0);
      expect(result.summary.totalRecords).toBeGreaterThan(0);
      expect(result.summary.uniqueRecords).toBeGreaterThan(0);
      expect(result.summary.nmis.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });

    it("should handle duplicate timestamps correctly in end-to-end processing", async () => {
      const contentWithDuplicates = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,20050301,0.461,0.810,0.568,0.944
300,20050301,0.461,0.810,0.568,0.944
900`;

      const file = new File([contentWithDuplicates], "test.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      expect(result).toBeDefined();
      expect(result.summary.duplicatesFound).toBeGreaterThan(0);
      expect(result.summary.registerStats.R1).toBeGreaterThan(0);
      expect(result.summary.registerStats.R2).toBeGreaterThan(0);
    });

    it("should generate correct SQL output", async () => {
      const file = new File([sampleNEM12Content], "test.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      expect(result).toBeDefined();
      expect(result.sqlStatements.length).toBeGreaterThan(0);

      // Check first SQL statement format
      const firstSQL = result.sqlStatements[0];
      expect(firstSQL).toEqual(
        `INSERT INTO meter_readings (nmi, timestamp, consumption) VALUES ('NEM1201009', '2005-03-01 00:00:00', 0.461);`
      );
    });

    it("should provide accurate summary statistics", async () => {
      const file = new File([sampleNEM12Content], "test.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      expect(result).toBeDefined();
      const summary = result.summary;

      expect(summary.totalRecords).toBeGreaterThan(0);
      expect(summary.uniqueRecords).toBeGreaterThan(0);
      expect(summary.nmis.length).toBeGreaterThan(0);
      expect(summary.dateRange.start).toBeDefined();
      expect(summary.dateRange.end).toBeDefined();
    });

    it("should handle large datasets efficiently", async () => {
      // Generate a larger dataset
      let largeContent = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301`;

      // Add multiple days of data
      for (let day = 1; day <= 5; day++) {
        const dateStr = `2005030${day}`;
        const values = Array(48)
          .fill(0)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map((_, i) => (Math.random() * 10).toFixed(3))
          .join(",");
        largeContent += `\n300,${dateStr},${values},A,,,20050310121004,20050310182204`;
      }
      largeContent += "\n900";

      const file = new File([largeContent], "large-test.csv", {
        type: "text/csv",
      });
      const startTime = Date.now();
      const result = await NEM12ProcessorService.processFile(file);
      const processingTime = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(result.summary.totalRecords).toBeGreaterThan(200); // 5 days * 48 intervals
      expect(result.sqlStatements.length).toBeGreaterThan(200);
      expect(processingTime).toBeLessThan(5000); // Should process within 5 seconds
    });
  });

  describe("Error Handling", () => {
    it("should handle empty content gracefully", async () => {
      const file = new File([""], "empty.csv", { type: "text/csv" });
      try {
        const result = await NEM12ProcessorService.processFile(file);
        expect(result.errors.length).toBeGreaterThan(0);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should handle malformed CSV gracefully", async () => {
      const malformedContent = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,20050301,0.461,0.810,MALFORMED_LINE_WITH_MISSING_COMMAS
900`;

      const file = new File([malformedContent], "malformed.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      // Should still succeed but with some readings processed
      expect(result).toBeDefined();
      expect(result.summary.totalRecords).toBeGreaterThan(0);
    });
  });

  describe("Integration Tests", () => {
    it("should maintain data integrity through complete processing pipeline", async () => {
      const file = new File([sampleNEM12Content], "test.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      expect(result).toBeDefined();

      // Verify data integrity
      const sqlStatements = result.sqlStatements;
      const summary = result.summary;

      expect(summary.totalRecords).toBe(sqlStatements.length);
      expect(summary.uniqueRecords).toBeLessThanOrEqual(summary.totalRecords);

      // Check that SQL statements are properly formatted
      sqlStatements.forEach((sql) => {
        expect(sql).toContain("INSERT INTO meter_readings");
        expect(sql).toContain("VALUES");
      });
    });

    it("should handle mixed scenarios with duplicates and multiple NMIs", async () => {
      const complexContent = `100,NEM12,200508081149,NEMMCO,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050301
300,20050301,0.461,0.810,0.568
200,NEM1201010,E1E2,1,E1,N1,01010,kWh,30,20050301
300,20050301,0.461,0.810,0.568
300,20050301,0.461,0.810,0.568
900`;

      const file = new File([complexContent], "complex.csv", {
        type: "text/csv",
      });
      const result = await NEM12ProcessorService.processFile(file);

      expect(result).toBeDefined();
      expect(result.summary.duplicatesFound).toBeGreaterThan(0);
      expect(result.summary.nmis.length).toBe(2);

      // Should have register suffixes in SQL statements for duplicates
      const sqlWithRegisterSuffixes = result.sqlStatements.filter((sql) =>
        sql.includes("_R")
      );
      expect(sqlWithRegisterSuffixes.length).toBeGreaterThan(0);
    });
  });
});
