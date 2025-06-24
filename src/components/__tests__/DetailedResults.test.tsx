import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DetailedResults } from "../DetailedResults";
import { ProcessingResult } from "../types";

// Mock result with various scenarios
const mockResult: ProcessingResult = {
  sqlStatements: [
    "INSERT INTO meter_readings (nmi, register_id) VALUES ('1234567890', 'E1');",
    "INSERT INTO meter_readings (nmi, register_id) VALUES ('1234567890', 'E1_2');",
    "INSERT INTO meter_readings (nmi, register_id) VALUES ('9876543210', 'E1');",
    "INSERT INTO meter_readings (nmi, register_id) VALUES ('1111111111', 'E2');",
    "INSERT INTO meter_readings (nmi, register_id) VALUES ('2222222222', 'E1_3');",
  ],
  summary: {
    totalRecords: 5,
    uniqueRecords: 5,
    duplicatesFound: 2,
    registerStats: {
      original: 3,
      "2": 1,
      "3": 1,
    },
    nmis: ["1234567890", "9876543210", "1111111111", "2222222222"],
    dateRange: {
      start: "2024-01-01",
      end: "2024-01-03",
    },
    processingTime: 200,
  },
  errors: ["Invalid date format in row 15", "Missing NMI value in row 23"],
};

const mockResultNoErrors: ProcessingResult = {
  ...mockResult,
  errors: [],
};

describe("DetailedResults Component", () => {
  describe("Component Structure", () => {
    it("renders with correct title", () => {
      render(<DetailedResults result={mockResult} />);

      expect(screen.getByText("Detailed Results")).toBeInTheDocument();
    });

    it("renders all tab headers", () => {
      render(<DetailedResults result={mockResult} />);

      expect(
        screen.getByRole("tab", { name: "SQL Statements" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "Register Statistics" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: "NMI Summary" })
      ).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Errors" })).toBeInTheDocument();
    });

    it("starts with SQL Statements tab selected", () => {
      render(<DetailedResults result={mockResult} />);

      const sqlTab = screen.getByRole("tab", { name: "SQL Statements" });
      expect(sqlTab).toHaveAttribute("aria-selected", "true");
    });
  });

  describe("Tab Navigation", () => {
    it("changes tabs when clicked", async () => {
      render(<DetailedResults result={mockResult} />);

      const registerTab = screen.getByRole("tab", {
        name: "Register Statistics",
      });
      await userEvent.click(registerTab);

      expect(registerTab).toHaveAttribute("aria-selected", "true");
      expect(
        screen.getByRole("tab", { name: "SQL Statements" })
      ).toHaveAttribute("aria-selected", "false");
    });

    it("shows correct content for each tab", async () => {
      render(<DetailedResults result={mockResult} />);

      // SQL Statements tab (default)
      expect(
        screen.getByDisplayValue(/INSERT INTO meter_readings/)
      ).toBeInTheDocument();

      // Register Statistics tab
      const registerTab = screen.getByRole("tab", {
        name: "Register Statistics",
      });
      await userEvent.click(registerTab);
      expect(screen.getByText("Register Distribution:")).toBeInTheDocument();

      // NMI Summary tab
      const nmiTab = screen.getByRole("tab", { name: "NMI Summary" });
      await userEvent.click(nmiTab);
      expect(screen.getByText("Original NMIs Processed:")).toBeInTheDocument();

      // Errors tab
      const errorsTab = screen.getByRole("tab", { name: "Errors" });
      await userEvent.click(errorsTab);
      expect(
        screen.getByText("Invalid date format in row 15")
      ).toBeInTheDocument();
    });
  });

  describe("SQL Statements Tab", () => {
    it("displays SQL statements in textarea", () => {
      render(<DetailedResults result={mockResult} />);

      const textarea = screen.getByDisplayValue(/INSERT INTO meter_readings/);
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("readonly");
    });
  });

  describe("Register Statistics Tab", () => {
    it("displays register distribution table", async () => {
      render(<DetailedResults result={mockResult} />);

      const registerTab = screen.getByRole("tab", {
        name: "Register Statistics",
      });
      await userEvent.click(registerTab);

      expect(screen.getByText("Register Distribution:")).toBeInTheDocument();
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("shows correct register statistics", async () => {
      render(<DetailedResults result={mockResult} />);

      const registerTab = screen.getByRole("tab", {
        name: "Register Statistics",
      });
      await userEvent.click(registerTab);

      // Check table headers
      expect(screen.getByText("Register Type")).toBeInTheDocument();
      expect(screen.getByText("Count")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText("Original")).toBeInTheDocument();
      expect(
        screen.getByText("Records with no duplicates")
      ).toBeInTheDocument();

      expect(screen.getByText("2")).toBeInTheDocument();
      expect(
        screen.getByText("Duplicate records with 2 suffix")
      ).toBeInTheDocument();
    });

    it("displays chips for register types", async () => {
      render(<DetailedResults result={mockResult} />);

      const registerTab = screen.getByRole("tab", {
        name: "Register Statistics",
      });
      await userEvent.click(registerTab);

      // Original should have primary color, others secondary
      const originalChip = screen.getByText("Original");
      expect(originalChip.closest(".MuiChip-root")).toHaveClass(
        "MuiChip-colorPrimary"
      );
    });
  });

  describe("NMI Summary Tab", () => {
    it("displays all NMIs as chips", async () => {
      render(<DetailedResults result={mockResult} />);

      const nmiTab = screen.getByRole("tab", { name: "NMI Summary" });
      await userEvent.click(nmiTab);

      expect(screen.getByText("Original NMIs Processed:")).toBeInTheDocument();
      expect(screen.getByText("1234567890")).toBeInTheDocument();
      expect(screen.getByText("9876543210")).toBeInTheDocument();
      expect(screen.getByText("1111111111")).toBeInTheDocument();
      expect(screen.getByText("2222222222")).toBeInTheDocument();
    });

    it("handles empty NMI list", async () => {
      const emptyNmiResult = {
        ...mockResult,
        summary: { ...mockResult.summary, nmis: [] },
      };
      render(<DetailedResults result={emptyNmiResult} />);

      const nmiTab = screen.getByRole("tab", { name: "NMI Summary" });
      await userEvent.click(nmiTab);

      expect(screen.getByText("Original NMIs Processed:")).toBeInTheDocument();
      // Should not have any NMI chips
      expect(screen.queryByText("1234567890")).not.toBeInTheDocument();
    });
  });

  describe("Errors Tab", () => {
    it("displays error messages when errors exist", async () => {
      render(<DetailedResults result={mockResult} />);

      const errorsTab = screen.getByRole("tab", { name: "Errors" });
      await userEvent.click(errorsTab);

      expect(
        screen.getByText("Invalid date format in row 15")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Missing NMI value in row 23")
      ).toBeInTheDocument();

      // Should have error alerts
      const errorAlerts = screen.getAllByRole("alert");
      expect(errorAlerts).toHaveLength(2);
    });

    it("shows no errors message when no errors exist", async () => {
      render(<DetailedResults result={mockResultNoErrors} />);

      const errorsTab = screen.getByRole("tab", { name: "Errors" });
      await userEvent.click(errorsTab);

      expect(
        screen.getByText("No errors encountered during processing")
      ).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("displays multiple errors correctly", async () => {
      const multiErrorResult = {
        ...mockResult,
        errors: ["Error 1", "Error 2", "Error 3", "Error 4"],
      };

      render(<DetailedResults result={multiErrorResult} />);

      const errorsTab = screen.getByRole("tab", { name: "Errors" });
      await userEvent.click(errorsTab);

      const errorAlerts = screen.getAllByRole("alert");
      expect(errorAlerts).toHaveLength(4);
    });
  });
});
