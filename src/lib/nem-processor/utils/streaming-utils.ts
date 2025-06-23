import { INEMParser, MeterReading, ParseResult } from "../types";

/**
 * Core streaming utilities for file processing
 */
export class StreamingUtils {
  /**
   * Process a file using streaming approach
   */
  static async processFileStream(
    file: File,
    parser: INEMParser
  ): Promise<ParseResult> {
    const allReadings: MeterReading[] = [];
    const errors: string[] = [];
    let buffer = ""; // Holds incomplete lines between chunks
    let lineNumber = 0;

    // Set up file streaming
    const stream = file.stream();
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        // Read next chunk from file
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Convert bytes to text and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Split buffer into complete lines
        const { lines, remainder } = this.splitBuffer(buffer);
        buffer = remainder;

        // Process each complete line
        for (const line of lines) {
          if (line.trim()) {
            lineNumber++;
            const result = this.processLine(line.trim(), lineNumber, parser);

            if (result.error) {
              errors.push(result.error);
            } else {
              allReadings.push(...result.readings);
            }
          }
        }
      }
    } finally {
      // Clean up reader
      reader.releaseLock();
    }

    return { readings: allReadings, errors };
  }

  /**
   * Split buffer into complete lines and save incomplete line
   */
  private static splitBuffer(buffer: string): {
    lines: string[];
    remainder: string;
  } {
    const lines = buffer.split("\n");
    const remainder = lines.pop() || ""; // Last line might be incomplete
    return { lines, remainder };
  }

  /**
   * Process a single line using the parser
   */
  private static processLine(
    line: string,
    lineNumber: number,
    parser: INEMParser
  ): { readings: MeterReading[]; error?: string } {
    try {
      // Parse the line
      const parseResult = parser.parseCSVContent(line);
      return {
        readings: parseResult.readings,
        error:
          parseResult.errors.length > 0
            ? `Line ${lineNumber}: ${parseResult.errors.join(", ")}`
            : undefined,
      };
    } catch (error) {
      // Return error but continue processing other lines
      return {
        readings: [],
        error: `Line ${lineNumber}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }
}
