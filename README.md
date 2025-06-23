# NEM Data Processor

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Complete Processing Flow](#complete-processing-flow)
- [Installation & Setup](#installation--setup)
  - [Prerequisites](#prerequisites)
  - [Installation from Scratch](#installation-from-scratch)
  - [How to Run](#how-to-run)
  - [Version Support](#version-support)
- [Usage Guide](#usage-guide)
  - [How to Use This Tool](#how-to-use-this-tool)
  - [Supported NEM12 File Format](#supported-nem12-file-format)
- [Architecture](#architecture)
  - [NEM Processor Library Architecture](#nem-processor-library-architecture)
  - [Core Library Components](#core-library-components)
- [Development](#development)
  - [Using the NEM Processor Library as Standalone](#using-the-nem-processor-library-as-standalone)
  - [Publishing to NPM Registry](#publishing-to-npm-registry)
  - [Writing Test Cases](#writing-test-cases)
- [Library Benefits](#library-benefits-for-future-development)
  - [Extensibility](#extensibility)
  - [Maintainability](#maintainability)
  - [Adding New NEM Format Support](#adding-new-nem-format-support)

---

## Overview

A Next.js-based web application for processing NEM (National Electricity Market) format CSV files and generating SQL INSERT statements for meter readings. The application features a modular, extensible architecture that currently supports NEM12 format with the ability to easily add support for future formats like NEM13.

## Features

- **File Upload**: Drag-and-drop CSV file upload with validation
- **Streaming Processing**: Efficient processing of large NEM files using streaming
- **Duplicate Handling**: Automatic register suffix generation for duplicate readings
- **Detailed Results**: Comprehensive statistics and processing summaries
- **SQL Export**: Download generated SQL INSERT statements
- **Error Reporting**: Clear error messages and line-by-line validation
- **Extensible Architecture**: Modular design for supporting multiple NEM formats

## Complete Processing Flow

1. User uploads file → API route (/api/process-nem12)
2. API route → NEM12ProcessorService.processFile()
3. NEM12ProcessorService → StreamingUtils.processFileStream()
4. StreamingUtils → reads file chunk by chunk (streaming)
5. Each chunk → split into lines → NEM12Parser.parseCSVContent()
6. NEM12Parser → creates MeterReading objects
7. All readings → ReadingProcessor.addRegisterSuffixes()
8. Processed readings → SQLGenerator.generateInserts()
9. Return ProcessingResult to user

## Installation & Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **pnpm**: Version 8.0.0 or higher (recommended package manager)

### Installation from Scratch

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd nem-data-processor
```

#### 2. Install pnpm (if not already installed)

```bash
# Using npm
npm install -g pnpm

# Using Homebrew (macOS)
brew install pnpm
```

#### 3. Install Dependencies

```bash
pnpm install
```

#### 4. Verify Installation

```bash
pnpm --version
node --version
```

Expected output:

- pnpm: 8.0.0+
- node: 18.0.0+

### How to Run

#### Development Mode

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

#### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

#### Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch
```

#### Linting

```bash
pnpm lint
```

### Version Support

| Component   | Version  | Notes                           |
| ----------- | -------- | ------------------------------- |
| Node.js     | ≥18.0.0  | Required for Next.js 15         |
| Next.js     | 15.3.4   | Latest stable version           |
| React       | 19.0.0   | Latest with concurrent features |
| Material-UI | 5.14.20+ | Modern component library        |
| TypeScript  | 5.x      | Full type safety                |

## Usage Guide

### How to Use This Tool

#### Step 1: Access the Application

Navigate to `http://localhost:3000` in your web browser.

#### Step 2: Upload NEM File

1. Click on the **File Upload** section
2. Select a CSV file in supported NEM format (currently NEM12)
3. The file will be validated automatically

#### Step 3: Process the File

1. Click the **"Process File"** button
2. Wait for processing to complete
3. View the processing results

#### Step 4: Review Results

The application provides:

- **Processing Summary**: Total records, duplicates found, processing time
- **SQL Statements**: Preview of generated INSERT statements
- **Register Statistics**: Distribution of original vs. duplicate records
- **NMI Summary**: List of processed NMIs
- **Error Report**: Any validation or parsing errors

#### Step 5: Download SQL

Click **"Download SQL File"** to save the generated SQL statements.

### Supported NEM12 File Format

The application currently supports NEM12 CSV files with the following structure:

```csv
100,NEM12,200401011200,ENERGIA,ENERGIA
200,1234567890,E1,1,E1,,,kWh,30,
300,20240101,0.5,0.6,0.7,0.8,...
300,20240102,0.4,0.5,0.6,0.7,...
500,1234567890,E1,1,E1,,,kWh,30,
900,
```

**NEM12 Record Types:**

- `100`: Header record
- `200`: NMI data record
- `300`: Interval data record (consumption values)
- `500`: End NMI record
- `900`: End of file record

## Architecture

### NEM Processor Library Architecture

The core of this application is the **NEM Processor Library** - a modular, extensible system designed to handle various NEM formats. The library follows a plugin-based architecture that makes it easy to add support for new formats.

#### Current Format Support

- **NEM12**: National Electricity Market format for interval meter data

### Core Library Components

```
nem-processor/
├── services/           # Main processing services
├── parsers/           # Format-specific parsers (NEM12, future NEM13, etc.)
├── validators/        # File validation logic
├── utils/             # Common utilities (SQL generation, date formatting, etc.)
└── types/             # TypeScript interfaces and types
```

## Development

### Using the NEM Processor Library as Standalone

The **NEM Processor Library** is designed to be used independently of the Next.js web interface. This modular approach allows developers to integrate NEM processing capabilities into their own applications or create support for additional NEM formats.

### Publishing to NPM Registry

You can publish this library to NPM to make it available for other developers:

#### 1. Prepare Library for Publishing

```bash
# Create a separate package for the library
mkdir nem-processor-lib
cd nem-processor-lib

# Initialize package.json
pnpm init
```

```json
// package.json
{
  "name": "@your-org/nem-processor",
  "version": "1.0.0",
  "description": "Extensible NEM data processor library for various electricity market formats",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist/**/*"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "pnpm build"
  },
  "keywords": ["nem", "electricity", "meter", "data", "parser", "sql"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "uuid": "^11.1.0"
  }
}
```

#### 2. Build and Publish

```bash
# Build the library
pnpm build

# Publish to NPM
npm publish --access public
```

#### 3. Installation and Usage

Once published, users can install and use your library:

```bash
# Install the library
npm install @your-org/nem-processor
# or
pnpm add @your-org/nem-processor
```

#### 4. Basic Standalone Usage

```typescript
// standalone-usage.ts
import { NEMProcessorService } from "@your-org/nem-processor";
import { MyCustomParser } from "./parsers/my-custom-parser";
import { MyCustomValidator } from "./validators/my-custom-validator";
import fs from "fs";

async function processNEMFile(filePath: string) {
  try {
    // Read file
    const fileBuffer = fs.readFileSync(filePath);
    const file = new File([fileBuffer], "data.csv", { type: "text/csv" });

    // Create processor with custom parser and validator
    const parser = new MyCustomParser();
    const validator = new MyCustomValidator();
    const processor = new NEMProcessorService(parser, validator);

    // Process file
    const result = await processor.processFile(file);

    // Output results
    console.log(`Processed ${result.summary.totalRecords} records`);
    console.log(`Found ${result.summary.duplicatesFound} duplicates`);

    // Save SQL statements
    fs.writeFileSync("output.sql", result.sqlStatements.join("\n"));

    return result;
  } catch (error) {
    console.error("Processing failed:", error);
    throw error;
  }
}

// Usage
processNEMFile("./data/nem-sample.csv")
  .then((result) => {
    console.log("Processing completed successfully");
  })
  .catch((error) => {
    console.error("Processing failed:", error);
  });
```

### Writing Test Cases

#### Test Structure

The project uses Jest with TypeScript support. Test files should be placed in `__tests__` directories or named with `.test.ts` extensions.

#### Example Test Cases

##### 1. Testing NEM Format Parser

```typescript
// __tests__/nem12-parser.test.ts
import { NEM12Parser } from "@/lib/nem12-processor/parsers/nem12.parser";

describe("NEM12Parser", () => {
  let parser: NEM12Parser;

  beforeEach(() => {
    parser = new NEM12Parser();
  });

  test("should parse valid NEM12 header record", () => {
    const content = "100,NEM12,200401011200,ENERGIA,ENERGIA";
    const result = parser.parseCSVContent(content);

    expect(result.readings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  test("should parse interval data correctly", () => {
    const content = `200,1234567890,E1,1,E1,,,kWh,30,
300,20240101,0.5,0.6,0.7,0.8`;

    const result = parser.parseCSVContent(content);

    expect(result.readings).toHaveLength(4);
    expect(result.readings[0].nmi).toBe("1234567890");
    expect(result.readings[0].consumption).toBe(0.5);
  });

  test("should handle invalid date format", () => {
    const content = `200,1234567890,E1,1,E1,,,kWh,30,
300,invalid,0.5,0.6`;

    const result = parser.parseCSVContent(content);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Invalid NEM12 date format");
  });
});
```

##### 2. Testing Core Library Components

```typescript
// __tests__/reading-processor.test.ts
import { ReadingProcessor } from "@/lib/nem-processor/utils/reading-processor";
import { MeterReading } from "@/lib/nem-processor/types";

describe("ReadingProcessor", () => {
  test("should add register suffixes for duplicates", () => {
    const readings: MeterReading[] = [
      {
        nmi: "1234567890",
        timestamp: new Date("2024-01-01T00:00:00"),
        consumption: 0.5,
      },
      {
        nmi: "1234567890",
        timestamp: new Date("2024-01-01T00:00:00"),
        consumption: 0.6,
      },
    ];

    const result = ReadingProcessor.addRegisterSuffixes(readings);

    expect(result.duplicatesFound).toBe(1);
    expect(result.processedReadings).toHaveLength(2);
    expect(result.processedReadings[0].nmi).toBe("1234567890_R1");
    expect(result.processedReadings[1].nmi).toBe("1234567890_R2");
  });
});
```

#### Running Specific Tests

```bash
# Run specific test file
pnpm test nem12-parser.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="should parse"
```

## Library Benefits for Future Development

### Extensibility

- **Plugin Architecture**: Easy to add new NEM formats without changing existing code
- **Interface-Based Design**: Consistent API across different format processors
- **Modular Components**: Reuse common functionality (SQL generation, validation, etc.)

### Maintainability

- **Separation of Concerns**: Each format has its own parser and validator
- **Type Safety**: Full TypeScript support with clear interfaces
- **Testing**: Independent testing of each component

### Adding New NEM Format Support

1. Create parser implementing `INEMParser` interface
2. Create format-specific validator extending `CSVFileValidator`
3. Create processor service extending `NEMProcessorService`
4. Add comprehensive tests
5. Update documentation
