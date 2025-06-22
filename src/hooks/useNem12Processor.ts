"use client";

import { ProcessingResult } from "@/lib/types";
import { useState } from "react";

/**
 * Custom hook for managing NEM12 file processing state and operations
 *
 * This hook encapsulates all the business logic for:
 * - File selection and validation
 * - Processing NEM12 files via API
 * - Managing loading states and errors
 * - Downloading generated SQL files
 *
 * @returns Object containing state and handler functions
 */
export function useNEM12Processor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      // Validate file extension
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }

      // Set the file and clear any previous errors/results
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  // Processes the selected file by sending it to the API endpoint
  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-nem12", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Set successful result
      setResult(data);
    } catch (err) {
      // Handle and set error message
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while processing the file"
      );
    } finally {
      // Always clear loading state
      setIsProcessing(false);
    }
  };

  // Creates a downloadable blob from the SQL statements and triggers download
  const downloadSQL = () => {
    if (!result) return;

    // Join all SQL statements with newlines
    const sqlContent = result.sqlStatements.join("\n");

    // Create blob and download link
    const blob = new Blob([sqlContent], { type: "text/sql" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "meter_readings_insert.sql";

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Resets all processor state to initial values
  const resetProcessor = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
  };

  return {
    file,
    isProcessing,
    result,
    error,
    handleFileChange,
    processFile,
    downloadSQL,
    resetProcessor,
  };
}
