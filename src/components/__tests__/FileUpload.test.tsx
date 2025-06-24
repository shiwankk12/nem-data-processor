import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileUpload } from "../FileUpload";

const defaultProps = {
  file: null,
  isProcessing: false,
  error: null,
  onFileChange: jest.fn(),
  onProcess: jest.fn(),
};

describe("FileUpload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<FileUpload {...defaultProps} />);

    expect(screen.getByText("File Upload")).toBeInTheDocument();
    expect(screen.getByLabelText(/CSV File/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /process file/i })
    ).toBeDisabled();
  });

  it("handles file selection", async () => {
    const mockOnFileChange = jest.fn();
    render(<FileUpload {...defaultProps} onFileChange={mockOnFileChange} />);

    const fileInput = screen.getByLabelText(/CSV File/i);
    const mockFile = new File(["test"], "test.csv", { type: "text/csv" });

    await userEvent.upload(fileInput, mockFile);

    expect(mockOnFileChange).toHaveBeenCalledWith(mockFile);
  });

  it("shows loading state during processing", () => {
    render(<FileUpload {...defaultProps} isProcessing={true} />);

    expect(screen.getByText("Processing file...")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays error messages", () => {
    render(<FileUpload {...defaultProps} error="Test error" />);

    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("enables process button when file is selected", () => {
    const mockFile = new File(["test"], "test.csv", { type: "text/csv" });
    render(<FileUpload {...defaultProps} file={mockFile} />);

    const processButton = screen.getByRole("button", { name: "Process File" });
    expect(processButton).toBeEnabled();
  });
});
