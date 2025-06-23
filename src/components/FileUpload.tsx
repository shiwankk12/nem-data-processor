"use client";

import type React from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  TextField,
  Alert,
  LinearProgress,
  Paper,
} from "@mui/material";
import { Upload, Description, Error } from "@mui/icons-material";

type FileUploadProps = {
  file: File | null;
  isProcessing: boolean;
  error: string | null;
  onFileChange: (file: File | null) => void;
  onProcess: () => void;
};

export function FileUpload({
  file,
  isProcessing,
  error,
  onFileChange,
  onProcess,
}: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onFileChange(selectedFile);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";

    const bytesPerUnit = 1024;
    const sizeUnits = ["Bytes", "KB", "MB", "GB"];
    const unitIndex = Math.floor(Math.log(bytes) / Math.log(bytesPerUnit));

    return `${parseFloat(
      (bytes / Math.pow(bytesPerUnit, unitIndex)).toFixed(2)
    )} ${sizeUnits[unitIndex]}`;
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Upload />
            <Typography variant="h6">File Upload</Typography>
          </Box>
        }
        subheader="Select a NEM12 format CSV file to process"
      />

      <CardContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            type="file"
            inputProps={{ accept: ".csv" }} // Restrict to CSV files
            onChange={handleFileChange}
            disabled={isProcessing} // Disable during processing
            fullWidth
            label="CSV File"
            InputLabelProps={{ shrink: true }} // Keep label visible
          />

          {file && (
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Description />
                <Typography variant="body2" fontWeight="medium">
                  {file.name}
                </Typography>
              </Box>
              {/* Display file size in MB */}
              <Typography variant="caption" color="text.secondary">
                Size: {formatFileSize(file.size)}
              </Typography>
            </Paper>
          )}

          {isProcessing && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Processing file...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" icon={<Error />}>
              {error}
            </Alert>
          )}

          <Button
            variant="contained"
            onClick={onProcess}
            disabled={!file || isProcessing} // Disable if no file or processing
            fullWidth
            size="large"
          >
            {isProcessing ? "Processing..." : "Process File"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
