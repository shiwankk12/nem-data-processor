import { CSVFileValidator } from "@/lib/nem-processor/validators/csv-file.validator";

// Mock file for testing
class MockFile extends File {
  constructor(filename: string, type = "text/csv", size = 1024) {
    const blob = new Blob(["mock content"], { type });
    super([blob], filename, { type });
    Object.defineProperty(this, "size", { value: size, writable: false });
  }
}

describe("CSVFileValidator", () => {
  let validator: CSVFileValidator;

  beforeEach(() => {
    validator = new CSVFileValidator();
  });

  describe("validate", () => {
    describe("valid files", () => {
      it("should accept valid CSV files with .csv extension", () => {
        const validFiles = [
          new MockFile("data.csv"),
          new MockFile("report.csv"),
          new MockFile("nem12-data.csv"),
          new MockFile("file_with_underscores.csv"),
          new MockFile("file-with-dashes.csv"),
          new MockFile("file with spaces.csv"),
        ];

        validFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should accept CSV files with uppercase extension", () => {
        const uppercaseFiles = [
          new MockFile("data.CSV"),
          new MockFile("report.Csv"),
          new MockFile("file.cSv"),
          new MockFile("document.cSV"),
        ];

        uppercaseFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should accept files with multiple dots before .csv", () => {
        const multiDotFiles = [
          new MockFile("data.backup.csv"),
          new MockFile("report.2024.01.15.csv"),
          new MockFile("file.v1.2.3.csv"),
          new MockFile("a.b.c.d.e.csv"),
        ];

        multiDotFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should accept files with proper CSV MIME types", () => {
        const csvMimeTypes = [
          new MockFile("data.csv", "text/csv"),
          new MockFile("data.csv", "application/csv"),
          new MockFile("data.csv", "text/comma-separated-values"),
        ];

        csvMimeTypes.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should accept CSV files even with incorrect MIME type", () => {
        // Browsers sometimes don't set correct MIME type
        const incorrectMimeFiles = [
          new MockFile("data.csv", "application/octet-stream"),
          new MockFile("data.csv", "text/plain"),
          new MockFile("data.csv", "application/vnd.ms-excel"),
        ];

        incorrectMimeFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should accept files of various sizes", () => {
        const sizedFiles = [
          new MockFile("small.csv", "text/csv", 100),
          new MockFile("medium.csv", "text/csv", 1024 * 1024), // 1MB
          new MockFile("large.csv", "text/csv", 100 * 1024 * 1024), // 100MB
          new MockFile("empty.csv", "text/csv", 0),
        ];

        sizedFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });
    });

    describe("invalid files", () => {
      it("should reject files without .csv extension", () => {
        const invalidFiles = [
          new MockFile("data.txt", "text/plain"),
          new MockFile(
            "data.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          ),
          new MockFile("data.xls", "application/vnd.ms-excel"),
          new MockFile("data.json", "application/json"),
          new MockFile("data.xml", "application/xml"),
          new MockFile("data.pdf", "application/pdf"),
          new MockFile("data.doc", "application/msword"),
          new MockFile("data.zip", "application/zip"),
        ];

        invalidFiles.forEach((file) => {
          expect(() => validator.validate(file)).toThrow(
            "File must be a CSV file"
          );
        });
      });

      it("should reject files with no extension", () => {
        const noExtensionFiles = [
          new MockFile("filename"),
          new MockFile("data"),
          new MockFile("report"),
          new MockFile("document"),
        ];

        noExtensionFiles.forEach((file) => {
          expect(() => validator.validate(file)).toThrow(
            "File must be a CSV file"
          );
        });
      });

      it("should reject files with CSV not as the final extension", () => {
        const wrongOrderFiles = [
          new MockFile("data.csv.txt"),
          new MockFile("report.csv.backup"),
          new MockFile("file.csv.old"),
          new MockFile("document.csv.bak"),
          new MockFile("data.csv.xlsx"),
        ];

        wrongOrderFiles.forEach((file) => {
          expect(() => validator.validate(file)).toThrow(
            "File must be a CSV file"
          );
        });
      });

      it("should reject files with empty names", () => {
        const emptyNameFile = new MockFile("");
        expect(() => validator.validate(emptyNameFile)).toThrow(
          "File must be a CSV file"
        );
      });

      it("should reject files with only dots", () => {
        const dotOnlyFiles = [
          new MockFile("."),
          new MockFile(".."),
          new MockFile("..."),
          new MockFile(".hidden"), // Hidden file without extension
        ];

        dotOnlyFiles.forEach((file) => {
          expect(() => validator.validate(file)).toThrow(
            "File must be a CSV file"
          );
        });
      });

      it("should reject files with similar but incorrect extensions", () => {
        const similarExtensions = [
          new MockFile("data.csv2"),
          new MockFile("data.csvx"),
          new MockFile("data.tsv"), // Tab-separated values
          new MockFile("data.dsv"), // Delimiter-separated values
          new MockFile("data.psv"), // Pipe-separated values
          new MockFile("data.ssv"), // Semicolon-separated values
        ];

        similarExtensions.forEach((file) => {
          expect(() => validator.validate(file)).toThrow(
            "File must be a CSV file"
          );
        });
      });
    });

    describe("edge cases", () => {
      it("should handle files with very long names", () => {
        const longBaseName = "a".repeat(200);
        const longNameFile = new MockFile(`${longBaseName}.csv`);

        expect(() => validator.validate(longNameFile)).not.toThrow();
      });

      it("should handle files with special characters in names", () => {
        const specialCharFiles = [
          new MockFile("data@file.csv"),
          new MockFile("data#file.csv"),
          new MockFile("data$file.csv"),
          new MockFile("data%file.csv"),
          new MockFile("data&file.csv"),
          new MockFile("data(1).csv"),
          new MockFile("data[backup].csv"),
          new MockFile("data{temp}.csv"),
          new MockFile("data+file.csv"),
          new MockFile("data=file.csv"),
          new MockFile("data!file.csv"),
          new MockFile("data~file.csv"),
          new MockFile("data`file.csv"),
          new MockFile("data'file.csv"),
          new MockFile('data"file.csv'),
        ];

        specialCharFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should handle files with unicode characters in names", () => {
        const unicodeFiles = [
          new MockFile("données.csv"), // French
          new MockFile("数据.csv"), // Chinese
          new MockFile("データ.csv"), // Japanese
          new MockFile("데이터.csv"), // Korean
          new MockFile("данные.csv"), // Russian
          new MockFile("δεδομένα.csv"), // Greek
          new MockFile("बिस्तर.csv"), // Hindi
          new MockFile("مجموعه.csv"), // Arabic
          new MockFile("משחק.csv"), // Hebrew
          new MockFile("ข้อมูล.csv"), // Thai
        ];

        unicodeFiles.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should handle files with only extension", () => {
        const extensionOnlyFile = new MockFile(".csv");
        expect(() => validator.validate(extensionOnlyFile)).not.toThrow();
      });

      it("should handle case sensitivity correctly", () => {
        const caseVariations = [
          new MockFile("FILE.CSV"),
          new MockFile("File.Csv"),
          new MockFile("file.csv"),
          new MockFile("FILE.csv"),
          new MockFile("file.CSV"),
        ];

        caseVariations.forEach((file) => {
          expect(() => validator.validate(file)).not.toThrow();
        });
      });

      it("should handle files with mixed case extensions that are not CSV", () => {
        const mixedCaseInvalid = [
          new MockFile("data.TXT"),
          new MockFile("data.Xlsx"),
          new MockFile("data.JSON"),
          new MockFile("data.Xml"),
        ];

        mixedCaseInvalid.forEach((file) => {
          expect(() => validator.validate(file)).toThrow(
            "File must be a CSV file"
          );
        });
      });
    });

    describe("error messages", () => {
      it("should provide specific error message for null file", () => {
        expect(() => validator.validate(null as unknown as File)).toThrow(
          "No file provided"
        );
      });

      it("should provide specific error message for undefined file", () => {
        expect(() => validator.validate(undefined as unknown as File)).toThrow(
          "No file provided"
        );
      });

      it("should provide specific error message for non-CSV files", () => {
        const txtFile = new MockFile("data.txt");
        expect(() => validator.validate(txtFile)).toThrow(
          "File must be a CSV file"
        );
      });
    });

    describe("performance", () => {
      it("should validate files quickly", () => {
        const file = new MockFile("data.csv");
        const startTime = performance.now();

        validator.validate(file);

        const endTime = performance.now();
        const duration = endTime - startTime;

        // Validation should be very fast (less than 10ms)
        expect(duration).toBeLessThan(10);
      });

      it("should handle large filename validation efficiently", () => {
        const largeFileName = "a".repeat(1000) + ".csv";
        const file = new MockFile(largeFileName);

        const startTime = performance.now();
        validator.validate(file);
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(10);
      });
    });

    describe("interface compliance", () => {
      it("should implement IFileValidator interface", () => {
        expect(typeof validator.validate).toBe("function");
        expect(validator.validate.length).toBe(1); // Should accept one parameter
      });

      it("should not return anything on successful validation", () => {
        const file = new MockFile("data.csv");
        const result = validator.validate(file);

        expect(result).toBeUndefined();
      });

      it("should throw errors rather than return them", () => {
        const invalidFile = new MockFile("data.txt");

        expect(() => validator.validate(invalidFile)).toThrow();
        // Should not return an error object
        expect(() => {
          const result = validator.validate(invalidFile);
          return result;
        }).toThrow();
      });
    });
  });
});
