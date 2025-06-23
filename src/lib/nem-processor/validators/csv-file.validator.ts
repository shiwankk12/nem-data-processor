import type { IFileValidator } from "../types";

export class CSVFileValidator implements IFileValidator {
  validate(file: File): void {
    if (!file) {
      throw new Error("No file provided");
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      throw new Error("File must be a CSV file");
    }
  }
}
