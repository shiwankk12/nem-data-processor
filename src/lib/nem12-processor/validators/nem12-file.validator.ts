import { CSVFileValidator } from "@/lib/nem-processor";

export class NEM12FileValidator extends CSVFileValidator {
  constructor() {
    super();
  }

  validate(file: File): void {
    // First, run all base CSV validations
    super.validate(file);

    // Then add NEM12-specific validations
  }
}
