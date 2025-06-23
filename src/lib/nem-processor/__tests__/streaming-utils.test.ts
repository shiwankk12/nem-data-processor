import { StreamingUtils } from "../utils/streaming-utils";
import { INEMParser, ParseResult } from "../types";

describe("StreamingUtils", () => {
  // Mock parser for testing
  class MockParser implements INEMParser {
    parseCSVContent(content: string): ParseResult {
      if (content.includes("error")) {
        throw new Error("Parse error");
      }

      if (content.includes("valid")) {
        return {
          readings: [
            {
              nmi: "NEM1200001",
              timestamp: new Date("2005-03-01T00:00:00"),
              consumption: 1.5,
            },
          ],
          errors: [],
        };
      }

      return { readings: [], errors: [] };
    }
  }

  // Mock file for testing
  class MockFile extends File {
    constructor(content: string, filename: string) {
      const blob = new Blob([content], { type: "text/csv" });
      super([blob], filename, { type: "text/csv" });
      this._content = content;
    }

    private _content: string;

    stream(): ReadableStream<Uint8Array> {
      const encoder = new TextEncoder();
      const lines = this._content.split("\n");
      let index = 0;

      return new ReadableStream({
        pull(controller) {
          if (index < lines.length) {
            controller.enqueue(encoder.encode(lines[index] + "\n"));
            index++;
          } else {
            controller.close();
          }
        },
      });
    }
  }

  describe("processFileStream", () => {
    it("should process valid file content", async () => {
      const content = "valid line 1\nvalid line 2\n";
      const file = new MockFile(content, "test.csv");
      const parser = new MockParser();

      const result = await StreamingUtils.processFileStream(file, parser);

      expect(result.readings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle parsing errors gracefully", async () => {
      const content = "error line\nvalid line\n";
      const file = new MockFile(content, "test.csv");
      const parser = new MockParser();

      const result = await StreamingUtils.processFileStream(file, parser);

      expect(result.readings).toHaveLength(1); // Only valid line processed
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Parse error");
    });

    it("should skip empty lines", async () => {
      const content = "valid line\n\n  \nvalid line 2\n";
      const file = new MockFile(content, "test.csv");
      const parser = new MockParser();

      const result = await StreamingUtils.processFileStream(file, parser);

      expect(result.readings).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle large files efficiently", async () => {
      const lines = Array.from({ length: 1000 }, (_, i) => `valid line ${i}`);
      const content = lines.join("\n");
      const file = new MockFile(content, "large.csv");
      const parser = new MockParser();

      const startTime = Date.now();
      const result = await StreamingUtils.processFileStream(file, parser);
      const endTime = Date.now();

      expect(result.readings).toHaveLength(1000);
      expect(result.errors).toHaveLength(0);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it("should handle empty files", async () => {
      const file = new MockFile("", "empty.csv");
      const parser = new MockParser();

      const result = await StreamingUtils.processFileStream(file, parser);

      expect(result.readings).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should provide correct line numbers in error messages", async () => {
      const content = "valid line\nerror line\nvalid line\n";
      const file = new MockFile(content, "test.csv");
      const parser = new MockParser();

      const result = await StreamingUtils.processFileStream(file, parser);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Line 2:");
    });
  });
});
