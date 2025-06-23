import { NEM12Context } from "../types";
import { parseNEM12Line } from "../utils";
import { DEFAULT_INTERVAL_LENGTH } from "../constants";
import { INEMParser, ParseResult, MeterReading } from "@/lib/nem-processor";

export class NEM12Parser implements INEMParser {
  /**
   * Parses NEM12 CSV content and returns readings and errors
   */
  parseCSVContent(content: string): ParseResult {
    const context: NEM12Context = {
      currentNMI: "",
      intervalLength: DEFAULT_INTERVAL_LENGTH,
    };
    const allReadings: MeterReading[] = [];
    const errors: string[] = [];

    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    lines.forEach((line, index) => {
      const result = parseNEM12Line(line, context);

      if (result.error) {
        errors.push(`Line ${index + 1}: ${result.error}`);
      } else {
        allReadings.push(...result.newReadings);
      }
    });

    return { readings: allReadings, errors };
  }
}
