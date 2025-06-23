import { NEMProcessorService } from "@/lib/nem-processor";
import { NEM12Parser } from "../parsers/nem12.parser";
import { NEM12FileValidator } from "../validators/nem12-file.validator";

export class NEM12ProcessorService extends NEMProcessorService {
  constructor() {
    super(new NEM12Parser(), new NEM12FileValidator());
  }
}
