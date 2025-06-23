import {
  IFileValidator,
  INEMParser,
  INEMProcessor,
  ProcessingResult,
} from "../types";
import { ReadingProcessor } from "../utils/reading-processor";
import { SQLGenerator } from "../utils/sql-generator";
import { SummaryGenerator } from "../utils/summary-generator";
import { CSVFileValidator } from "../validators/csv-file.validator";

/**
 * MAIN NEM PROCESSOR SERVICE WITH DEPENDENCY INJECTION
 */
export class NEMProcessorService implements INEMProcessor {
  private readonly sqlGenerator: SQLGenerator;

  constructor(
    private parser: INEMParser,
    private fileValidator: IFileValidator = new CSVFileValidator()
  ) {
    this.sqlGenerator = new SQLGenerator();
  }

  validateFile(file: File): void {
    this.fileValidator.validate(file);
  }

  async processFile(file: File): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // Validate file first
      this.validateFile(file);

      // Read file content
      const content = await file.text();

      // Parse using injected parser
      const { readings, errors } = this.parser.parseCSVContent(content);

      // Process readings (business logic remains the same)
      const { processedReadings, duplicatesFound, registerStats } =
        ReadingProcessor.addRegisterSuffixes(readings);

      const sortedReadings = ReadingProcessor.sortByNMI(processedReadings);
      const sqlStatements = this.sqlGenerator.generateInserts(sortedReadings);

      // Generate summary
      const summary = SummaryGenerator.generateSummary(
        readings,
        sortedReadings,
        duplicatesFound,
        registerStats,
        startTime
      );

      return {
        sqlStatements,
        summary,
        errors,
      };
    } catch (error) {
      throw new Error(
        `Failed to process NEM file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
