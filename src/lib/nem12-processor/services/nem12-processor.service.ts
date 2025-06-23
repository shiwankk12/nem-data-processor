import { NEMProcessorService, ProcessingResult } from "@/lib/nem-processor";
import { NEM12Parser } from "../parsers/nem12.parser";
import { NEM12FileValidator } from "../validators/nem12-file.validator";

export class NEM12ProcessorService extends NEMProcessorService {
  private nem12Parser: NEM12Parser;

  constructor() {
    const parser = new NEM12Parser();
    super(parser, new NEM12FileValidator());
    this.nem12Parser = parser;
  }

  async processFile(file: File): Promise<ProcessingResult> {
    // Reset parser context for each new file
    this.nem12Parser.resetContext();

    // Call parent's streaming processFile method
    return super.processFile(file);
  }
}
