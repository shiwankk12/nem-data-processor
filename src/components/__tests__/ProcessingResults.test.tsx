import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProcessingResults } from "../ProcessingResults";
import { ProcessingResult } from "../types";

const mockResult: ProcessingResult = {
  sqlStatements: ["INSERT INTO meter_readings VALUES ('123', 'E1');"],
  summary: {
    totalRecords: 5,
    uniqueRecords: 5,
    duplicatesFound: 0,
    registerStats: { original: 5 },
    nmis: ["123456"],
    dateRange: { start: "2024-01-01", end: "2024-01-05" },
    processingTime: 150,
  },
  errors: [],
};

describe("ProcessingResults", () => {
  const mockOnDownload = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows placeholder when no results", () => {
    render(<ProcessingResults result={null} onDownloadSQL={mockOnDownload} />);

    expect(
      screen.getByText(/Upload and process a file to see results/)
    ).toBeInTheDocument();
  });

  it("displays processing results", () => {
    render(
      <ProcessingResults result={mockResult} onDownloadSQL={mockOnDownload} />
    );

    expect(
      screen.getByText(/Successfully processed 5 records/)
    ).toBeInTheDocument();
    expect(screen.getByText("150ms")).toBeInTheDocument();
  });

  it("handles download button click", async () => {
    render(
      <ProcessingResults result={mockResult} onDownloadSQL={mockOnDownload} />
    );

    const downloadButton = screen.getByRole("button", {
      name: /download sql file/i,
    });
    await userEvent.click(downloadButton);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });
});
