"use client";

import { Box, Typography, Grid } from "@mui/material";
import { ProcessingResults } from "@/components/ProcessingResults";
import { FileUpload } from "@/components/FileUpload";
import { useNEM12Processor } from "@/hooks/useNem12Processor";
import { DetailedResults } from "@/components/DetailedResults";

export default function NEM12Processor() {
  const {
    file,
    isProcessing,
    result,
    error,
    handleFileChange,
    processFile,
    downloadSQL,
  } = useNEM12Processor();

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
          NEM12 CSV Processor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload NEM12 format CSV files to generate SQL INSERT statements for
          meter readings with register suffixes for uniqueness
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <FileUpload
            file={file}
            isProcessing={isProcessing}
            error={error}
            onFileChange={handleFileChange}
            onProcess={processFile}
          />
        </Grid>

        <Grid item xs={12} lg={6}>
          <ProcessingResults result={result} onDownloadSQL={downloadSQL} />
        </Grid>
      </Grid>

      {result && <DetailedResults result={result} />}
    </Box>
  );
}
