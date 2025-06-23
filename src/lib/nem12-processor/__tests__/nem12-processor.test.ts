import { NEM12ProcessorService } from "@/lib/nem12-processor/services/nem12-processor.service";
import { ProcessingResult } from "@/lib/nem-processor/types";

// Mock file for testing
class MockFile extends File {
  private _content: string;

  constructor(content: string, filename: string, type = "text/csv") {
    const blob = new Blob([content], { type });
    super([blob], filename, { type });
    this._content = content;
  }

  stream(): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    const chunks = [encoder.encode(this._content)];
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

  get content(): string {
    return this._content;
  }
}

describe("NEM12ProcessorService", () => {
  let service: NEM12ProcessorService;

  beforeEach(() => {
    service = new NEM12ProcessorService();
  });

  describe("processFile", () => {
    it("should process a valid NEM12 file successfully", async () => {
      const validNEM12Content = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,2.0,0,1.2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new MockFile(validNEM12Content, "test.csv");
      const result: ProcessingResult = await service.processFile(file);

      expect(result).toBeDefined();
      expect(result.sqlStatements).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.errors).toBeDefined();

      // Check that readings were processed
      expect(result.sqlStatements.length).toBeGreaterThan(0);
      expect(result.summary.totalRecords).toBe(46);
      expect(result.summary.uniqueRecords).toBeGreaterThanOrEqual(4);
      expect(result.summary.nmis).toContain("NEM1200001");
    });

    it("should handle multiple NMIs correctly", async () => {
      const multiNMIContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,2.0,0,1.2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
300,20050302,2.5,1.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050302094500,20050302104500
500,
200,NEM1200002,E1,E1,E1,N,,,kWh,30,
300,20050301,3.0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;
      const file = new MockFile(multiNMIContent, "multi-nmi.csv");
      const result: ProcessingResult = await service.processFile(file);

      expect(result.summary.nmis).toHaveLength(2);
      expect(result.summary.nmis).toContain("NEM1200001");
      expect(result.summary.nmis).toContain("NEM1200002");
    });

    it("should generate correct SQL statements", async () => {
      const testContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;
      const file = new MockFile(testContent, "test.csv");
      const result: ProcessingResult = await service.processFile(file);

      expect(result.sqlStatements.length).toBeGreaterThan(0);

      // Check SQL format
      const firstSQL = result.sqlStatements[0];
      expect(firstSQL).toMatch(
        /^INSERT INTO meter_readings \(id, nmi, timestamp, consumption\) VALUES/
      );
      expect(firstSQL).toContain("NEM1200001");
    });

    it("should handle duplicate readings with register suffixes", async () => {
      const duplicateContent = `100,NEM12,200506081149,UNITEDDP,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050610
300,20050301,0,0,0,0,0,0,0,0,0,0,0,0,0.461,0.810,0.568,1.234,1.353,1.507,1.344,1.773,0
500,O,S01009,20050310121004,
200,NEM1201009,E1E2,2,E2,,01009,kWh,30,20050610
300,20050301,0,0,0,0,0,0,0,0,0,0,0,0,0.154,0.460,0.770,1.003,1.059,1.750,1.423,1.200,0
500,O,S01009,20050310121004,
900`;

      const file = new MockFile(duplicateContent, "duplicates.csv");
      const result: ProcessingResult = await service.processFile(file);

      expect(result.summary.duplicatesFound).toBeGreaterThan(0);
      expect(result.summary.registerStats).toHaveProperty("R1");
      expect(result.summary.registerStats).toHaveProperty("R2");
    });

    it("should calculate correct date ranges", async () => {
      const testContent = `100,NEM12,200506081149,UNITEDDP,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050610
300,20050301,0,0,0,0,0,0,0,0,0,0,0,0,0.461,0.810,0.568,1.234,1.353,1.507,1.344,1.773,0
300,20050302,0,0,0,0,0,0,0,0,0,0,0,0,0.461,0.810,0.568,1.234,1.353,1.507,1.344,1.773,0
500,O,S01009,20050310121004,
200,NEM1201009,E1E2,2,E2,,01009,kWh,30,20050610
300,2005030,0,0,0,0,0,0,0,0,0,0,0,0,0.154,0.460,0.770,1.003,1.059,1.750,1.423,1.200,0
300,20050302,0,0,0,0,0,0,0,0,0,0,0,0,0.461,0.810,0.568,1.234,1.353,1.507,1.344,1.773,0
500,O,S01009,20050310121004,
900`;
      const file = new MockFile(testContent, "test.csv");
      const result: ProcessingResult = await service.processFile(file);

      expect(result.summary.dateRange.start).toBe("2005-03-01");
      expect(result.summary.dateRange.end).toBe("2005-03-02");
    });

    it("should handle files with errors gracefully", async () => {
      const invalidContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,200503,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;

      const file = new MockFile(invalidContent, "invalid-date.csv");
      const result: ProcessingResult = await service.processFile(file);

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Invalid NEM12 date format");
    });

    it("should sort readings by NMI and timestamp", async () => {
      const testContent = `100,NEM12,200501081149,UNITEDDP,NEMMCO
200,NEM1200001,E1,E1,E1,N,,,kWh,30,
300,20050301,1.5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,A,,,20050301094500,20050301104500
500,
900`;
      const file = new MockFile(testContent, "test.csv");
      const result: ProcessingResult = await service.processFile(file);

      // Parse the first few SQL statements to check ordering
      const firstSQL = result.sqlStatements[0];
      const secondSQL = result.sqlStatements[1];

      // Both should be from NEM1200001 (comes first alphabetically)
      expect(firstSQL).toContain("NEM1200001");

      // Extract timestamps to verify chronological order
      const timestampMatch1 = firstSQL.match(
        /'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'/
      );
      const timestampMatch2 = secondSQL.match(
        /'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'/
      );

      if (timestampMatch1 && timestampMatch2) {
        const date1 = new Date(timestampMatch1[1]);
        const date2 = new Date(timestampMatch2[1]);
        expect(date1.getTime()).toBeLessThanOrEqual(date2.getTime());
      }
    });
  });

  describe("file validation", () => {
    it("should reject non-CSV files", async () => {
      const file = new MockFile("", "test.txt");

      await expect(service.processFile(file)).rejects.toThrow(
        "File must be a CSV file"
      );
    });

    it("should reject when no file is provided", async () => {
      await expect(
        service.processFile(null as unknown as File)
      ).rejects.toThrow("No file provided");
    });
  });

  describe("error handling", () => {
    it("should handle empty files", async () => {
      const file = new MockFile("", "empty.csv");

      const result = await service.processFile(file);

      expect(result.summary.totalRecords).toBe(0);
      expect(result.summary.uniqueRecords).toBe(0);
      expect(result.sqlStatements).toHaveLength(0);
    });

    it("should handle files with only headers", async () => {
      const headerOnlyContent = "100,NEM12,200501081149,UNITEDDP,NEMMCO";
      const file = new MockFile(headerOnlyContent, "header-only.csv");

      const result = await service.processFile(file);

      expect(result.summary.totalRecords).toBe(0);
      expect(result.summary.uniqueRecords).toBe(0);
      expect(result.sqlStatements).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("summary generation", () => {
    it("should generate accurate summary statistics", async () => {
      const content = `100,NEM12,200506081149,UNITEDDP,NEMMCO
200,NEM1201009,E1E2,1,E1,N1,01009,kWh,30,20050610
300,20050301,0,0,0,0,0,0,0,0,0,0,0,0,0.461,0.810,0.568,1.234,1.353,1.507,1.344,1.773,0
500,O,S01009,20050310121004,
200,NEM1201009,E1E2,2,E2,,01009,kWh,30,20050610
300,20050301,0,0,0,0,0,0,0,0,0,0,0,0,0.154,0.460,0.770,1.003,1.059,1.750,1.423,1.200,0
0050310121004,
500,O,S01009,20050310121004,
900`;
      const file = new MockFile(content, "test.csv");
      const result = await service.processFile(file);

      expect(result.summary.totalRecords).toBeDefined();
      expect(result.summary.uniqueRecords).toBeDefined();
      expect(result.summary.duplicatesFound).toBeDefined();
      expect(result.summary.registerStats).toBeDefined();
      expect(result.summary.nmis).toBeDefined();
      expect(result.summary.dateRange).toBeDefined();
      expect(result.summary.processingTime).toBeDefined();

      expect(result.summary.totalRecords).toBeGreaterThan(0);
      expect(result.summary.uniqueRecords).toBeGreaterThan(0);
      expect(Array.isArray(result.summary.nmis)).toBe(true);
    });

    it("should handle empty result summaries", async () => {
      const file = new MockFile("", "empty.csv");
      const result = await service.processFile(file);

      expect(result.summary.totalRecords).toBe(0);
      expect(result.summary.uniqueRecords).toBe(0);
      expect(result.summary.duplicatesFound).toBe(0);
      expect(result.summary.nmis).toHaveLength(0);
      expect(result.summary.dateRange.start).toBe("");
      expect(result.summary.dateRange.end).toBe("");
    });
  });
});
