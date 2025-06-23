import { CSVFileValidator } from "@/lib/nem-processor";

export class NEM12FileValidator extends CSVFileValidator {
  constructor(
    private readonly maxFileSize: number = 10 * 1024 * 1024 // 10MB
  ) {
    super();
  }

  validate(file: File): void {
    // First, run all base CSV validations
    super.validate(file);

    // Then add NEM12-specific validations
    if (file.size > this.maxFileSize) {
      throw new Error(
        `File size must be less than ${this.maxFileSize / (1024 * 1024)}MB`
      );
    }
  }
}
