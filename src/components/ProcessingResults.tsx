"use client";

import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Alert,
  Grid,
} from "@mui/material";
import { Storage, CheckCircle, Download } from "@mui/icons-material";
import { ProcessingResult } from "@/lib/nem-processor/types";

type ProcessingResultsProps = {
  result: ProcessingResult | null;
  onDownloadSQL: () => void;
};

export const ProcessingResults = ({
  result,
  onDownloadSQL,
}: ProcessingResultsProps) => {
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Storage />
            <Typography variant="h6">Processing Results</Typography>
          </Box>
        }
        subheader="Generated SQL statements with register suffixes"
      />

      <CardContent>
        {result ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Success Alert with Summary */}
            <Alert severity="success" icon={<CheckCircle />}>
              Successfully processed {result.summary.totalRecords} records,
              generated {result.summary.uniqueRecords} unique INSERT statements
              {/* Show duplicate info if any duplicates were found */}
              {result.summary.duplicatesFound > 0 &&
                ` (${result.summary.duplicatesFound} duplicates handled with register suffixes)`}
            </Alert>

            {/* Processing Statistics Grid */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Total Records Processed
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.summary.totalRecords}
                </Typography>
              </Grid>

              {/* Final Records Generated */}
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Final Records Generated
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.summary.uniqueRecords}
                </Typography>
              </Grid>

              {/* Duplicates Found */}
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Duplicates Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.summary.duplicatesFound}
                </Typography>
              </Grid>

              {/* Processing Time */}
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Processing Time
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.summary.processingTime}ms
                </Typography>
              </Grid>

              {/* Original NMIs Count */}
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Original NMIs
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.summary.nmis.length}
                </Typography>
              </Grid>

              {/* Date Range */}
              <Grid item xs={6}>
                <Typography variant="body2" fontWeight="medium">
                  Date Range
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {result.summary.dateRange.start} -{" "}
                  {result.summary.dateRange.end}
                </Typography>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={onDownloadSQL}
              startIcon={<Download />}
              fullWidth
            >
              Download SQL File
            </Button>
          </Box>
        ) : (
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ py: 4 }}
          >
            Upload and process a file to see results
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
