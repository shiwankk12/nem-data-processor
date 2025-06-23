import { ProcessingResult } from "@/lib/nem-processor";
import { NEM12ProcessorService } from "@/lib/nem12-processor";

// Mock file helper for integration tests
class IntegrationMockFile extends File {
  constructor(content: string, filename: string, type = "text/csv") {
    const blob = new Blob([content], { type });
    super([blob], filename, { type });
    this._content = content;
  }

  private _content: string;

  stream(): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const chunks = this._content
      .split("\n")
      .map((line) => encoder.encode(line + "\n"));
    let index = 0;

    return new ReadableStream({
      pull(controller) {
        if (index < chunks.length) {
          controller.enqueue(chunks[index++]);
        } else {
          controller.close();
        }
      },
    });
  }
}

describe("NEM12 Full Processing Integration Tests", () => {
  let processorService: NEM12ProcessorService;

  beforeEach(() => {
    processorService = new NEM12ProcessorService();
  });

  describe("End-to-End Processing", () => {
    it("should process a complete valid NEM12 file", async () => {
      const nem12Content = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,2.0,0,1.2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
300,20050302,2.5,1.0,3.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050302094500,20050302104500
500,
200,NEM1200002,E1,E1,E1,N,,,kWh,30,
300,20050301,3.0,4.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new IntegrationMockFile(nem12Content, "test.csv");
      const result: ProcessingResult = await processorService.processFile(file);

      // Verify processing results
      expect(result).toBeDefined();
      expect(result.errors).toHaveLength(0);

      // Check summary
      expect(result.summary.totalRecords).toBe(138);
      expect(result.summary.uniqueRecords).toBe(138);
      expect(result.summary.duplicatesFound).toBe(0);
      expect(result.summary.nmis).toEqual(["NEM1200001", "NEM1200002"]);
      expect(result.summary.dateRange.start).toBe("2005-03-01");
      expect(result.summary.dateRange.end).toBe("2005-03-02");

      // Check SQL generation
      expect(result.sqlStatements).toHaveLength(138);
      expect(result.sqlStatements[0]).toContain("NEM1200001");
      expect(result.sqlStatements[0]).toContain("2005-03-01 00:00:00");
      expect(result.sqlStatements[0]).toContain("1.5");

      // Verify sorting (NEM1200001 should come before NEM1200002)
      const neb1Statements = result.sqlStatements.filter((sql) =>
        sql.includes("NEM1200001")
      );
      const neb2Statements = result.sqlStatements.filter((sql) =>
        sql.includes("NEM1200002")
      );

      expect(neb1Statements).toHaveLength(92);
      expect(neb2Statements).toHaveLength(46);

      // First few statements should be NEM1200001
      expect(result.sqlStatements[0]).toContain("NEM1200001");
      expect(result.sqlStatements[1]).toContain("NEM1200001");
    });

    it("should handle file with duplicate readings", async () => {
      const duplicateContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
300,20050301,2.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new IntegrationMockFile(duplicateContent, "duplicates.csv");
      const result = await processorService.processFile(file);

      expect(result.summary.totalRecords).toBe(92);
      expect(result.summary.uniqueRecords).toBe(92);
      expect(result.summary.duplicatesFound).toBe(46);

      // Check register suffixes were added
      expect(result.summary.registerStats.R1).toBe(46);
      expect(result.summary.registerStats.R2).toBe(46);

      // Check SQL contains register suffixes
      const nmiWithSuffixes = result.sqlStatements.filter(
        (sql) => sql.includes("NEM1200001_R1") || sql.includes("NEM1200001_R2")
      );
      expect(nmiWithSuffixes).toHaveLength(92);
    });

    it("should handle multiple NMIs with different interval lengths", async () => {
      const multiIntervalContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,15,
300,20050301,1.0,2.0,3.0,4.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
200,NEM1200002,E1,E1,E1,N,,,kWh,30,
300,20050301,5.0,6.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new IntegrationMockFile(
        multiIntervalContent,
        "multi-interval.csv"
      );
      const result = await processorService.processFile(file);

      expect(result.summary.totalRecords).toBe(92);

      // Check that timestamps reflect different interval lengths
      const neb1SQL = result.sqlStatements.filter((sql) =>
        sql.includes("NEM1200001")
      );
      const neb2SQL = result.sqlStatements.filter((sql) =>
        sql.includes("NEM1200002")
      );

      expect(neb1SQL).toHaveLength(46);
      expect(neb2SQL).toHaveLength(46);

      expect(neb1SQL[0]).toContain("2005-03-01 00:00:00"); // First reading
      expect(neb1SQL[1]).toContain("2005-03-01 00:30:00");
      expect(neb1SQL[2]).toContain("2005-03-01 01:00:00");

      // For NEM1200002 (30-minute intervals)
      expect(neb2SQL[0]).toContain("2005-03-01 00:00:00"); // First reading
      expect(neb2SQL[1]).toContain("2005-03-01 00:30:00"); // +30 minutes
    });

    it("should handle errors gracefully while processing valid parts", async () => {
      const mixedContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
300,invalid_date,2.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
300,20050302,3.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050302094500,20050302104500
500,
900`;

      const file = new IntegrationMockFile(mixedContent, "mixed-content.csv");
      const result = await processorService.processFile(file);

      // Should process valid parts and report errors
      expect(result.summary.totalRecords).toBe(92);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Invalid NEM12 date format");

      // Valid SQL should still be generated
      expect(result.sqlStatements).toHaveLength(92);
      expect(result.sqlStatements[0]).toContain("1.5");
      expect(result.sqlStatements[1]).toContain("0");
    });

    it("should handle large files efficiently", async () => {
      // Generate a large NEM12 file content
      const header = "100,NEM12,200501081149,UNITEDDP,NEMMCO";
      const nmiHeader = "200,NEM1200001,E1,E1,E1,N,,,kWh,30,";

      // Generate 100 days of data
      const intervalData: string[] = [];
      for (let day = 1; day <= 100; day++) {
        const dateStr = `200503${String(day).padStart(2, "0")}`;
        if (day <= 31) {
          // Valid days for March
          const consumptionValues = Array(48).fill("1.5").join(",");
          intervalData.push(
            `300,${dateStr},${consumptionValues},A,,,${dateStr}094500,${dateStr}104500`
          );
        }
      }

      const footer = "500,\n900";
      const largeContent = [
        header,
        nmiHeader,
        ...intervalData.slice(0, 31),
        footer,
      ].join("\n");

      const file = new IntegrationMockFile(largeContent, "large-file.csv");

      const startTime = Date.now();
      const result = await processorService.processFile(file);
      const processingTime = Date.now() - startTime;

      // Should process efficiently
      expect(processingTime).toBeLessThan(10000); // Less than 10 seconds
      expect(result.summary.totalRecords).toBe(31 * 48); // 31 days * 48 intervals
      expect(result.sqlStatements).toHaveLength(31 * 48);
      expect(result.errors).toHaveLength(0);
    });

    it("should maintain data integrity throughout processing", async () => {
      const preciseContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.234567,2.345678,3.456789,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new IntegrationMockFile(preciseContent, "precise-data.csv");
      const result = await processorService.processFile(file);

      // Check precision is maintained
      expect(result.sqlStatements[0]).toContain("1.234567");
      expect(result.sqlStatements[1]).toContain("2.345678");
      expect(result.sqlStatements[2]).toContain("3.456789");

      // Check timestamps are accurate
      expect(result.sqlStatements[0]).toContain("2005-03-01 00:00:00");
      expect(result.sqlStatements[1]).toContain("2005-03-01 00:30:00");
      expect(result.sqlStatements[2]).toContain("2005-03-01 01:00:00");

      // Check NMI is preserved
      expect(
        result.sqlStatements.every((sql) => sql.includes("NEM1200001"))
      ).toBe(true);
    });

    it("should reset context between multiple file processing", async () => {
      const file1Content = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,15,
300,20050301,1.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file2Content = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200002,E1,E1,E1,N,,,kWh,30,
300,20050302,2.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050302094500,20050302104500
500,
900`;

      const file1 = new IntegrationMockFile(file1Content, "file1.csv");
      const file2 = new IntegrationMockFile(file2Content, "file2.csv");

      // Process first file
      const result1 = await processorService.processFile(file1);
      expect(result1.summary.nmis).toEqual(["NEM1200001"]);

      // Process second file - should not be affected by first file's context
      const result2 = await processorService.processFile(file2);
      expect(result2.summary.nmis).toEqual(["NEM1200002"]);

      // Verify interval lengths were correctly applied
      // File1 uses 15-minute intervals, File2 uses 30-minute intervals
      expect(result1.sqlStatements[0]).toContain("2005-03-01 00:00:00");
      expect(result2.sqlStatements[0]).toContain("2005-03-02 00:00:00");
    });
  });

  describe("File Validation Integration", () => {
    it("should reject invalid file types", async () => {
      const file = new IntegrationMockFile("valid content", "test.txt");

      await expect(processorService.processFile(file)).rejects.toThrow(
        "File must be a CSV file"
      );
    });

    it("should reject null files", async () => {
      await expect(
        processorService.processFile(null as unknown as File)
      ).rejects.toThrow("No file provided");
    });
  });

  describe("Performance Integration", () => {
    it("should generate summary statistics correctly under load", async () => {
      const multiNMIContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.0,2.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
200,NEM1200002,E1,E1,E1,N,,,kWh,30,
300,20050301,3.0,4.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
200,NEM1200003,E1,E1,E1,N,,,kWh,30,
300,20050301,5.0,6.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new IntegrationMockFile(multiNMIContent, "multi-nmi.csv");
      const result = await processorService.processFile(file);

      expect(result.summary.totalRecords).toBe(138);
      expect(result.summary.uniqueRecords).toBe(138);
      expect(result.summary.nmis).toEqual([
        "NEM1200001",
        "NEM1200002",
        "NEM1200003",
      ]);
      expect(result.sqlStatements).toHaveLength(138);
    });
  });
});
