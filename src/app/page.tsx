"use client";

import type React from "react";
import { useState } from "react";
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
  Tabs,
  Tab,
  Grid,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Upload,
  Description,
  Storage,
  Error,
  CheckCircle,
  Download,
} from "@mui/icons-material";

interface ProcessingResult {
  sqlStatements: string[];
  summary: {
    totalRecords: number;
    uniqueRecords: number;
    duplicatesFound: number;
    registerStats: Record<string, number>;
    nmis: string[];
    dateRange: { start: string; end: string };
    processingTime: number;
  };
  errors: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function NEM12Processor() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        setError("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/process-nem12", {
        method: "POST",
        body: formData,
      });

      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }

      const data = await response.json();

      // if (data.error) {
      //   throw new Error(data.error);
      // }

      setResult(data);
    } catch (err) {
      console.error("Error processing file:", err);
      // setError(
      //   err instanceof Error
      //     ? err.message
      //     : "An error occurred while processing the file"
      // );
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSQL = () => {
    if (!result) return;

    const sqlContent = result.sqlStatements.join("\n");
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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
        {/* Upload Section */}
        <Grid item xs={12} lg={6}>
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
                  inputProps={{ accept: ".csv" }}
                  onChange={handleFileChange}
                  disabled={isProcessing}
                  fullWidth
                  label="CSV File"
                  InputLabelProps={{ shrink: true }}
                />

                {file && (
                  <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Description />
                      <Typography variant="body2" fontWeight="medium">
                        {file.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Size: {(file.size / 1024 / 1024).toFixed(2)} MB
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
                  onClick={processFile}
                  disabled={!file || isProcessing}
                  fullWidth
                  size="large"
                >
                  {isProcessing ? "Processing..." : "Process File"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Results Section */}
        <Grid item xs={12} lg={6}>
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
                  <Alert severity="success" icon={<CheckCircle />}>
                    Successfully processed {result.summary.totalRecords}{" "}
                    records, generated {result.summary.uniqueRecords} unique
                    INSERT statements
                    {result.summary.duplicatesFound > 0 &&
                      ` (${result.summary.duplicatesFound} duplicates handled with register suffixes)`}
                  </Alert>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        Total Records Processed
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.summary.totalRecords}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        Final Records Generated
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.summary.uniqueRecords}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        Duplicates Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.summary.duplicatesFound}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        Processing Time
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.summary.processingTime}ms
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" fontWeight="medium">
                        Original NMIs
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {result.summary.nmis.length}
                      </Typography>
                    </Grid>
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
                    onClick={downloadSQL}
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
        </Grid>
      </Grid>

      {/* Detailed Results */}
      {result && (
        <Card sx={{ mt: 3 }}>
          <CardHeader
            title={<Typography variant="h6">Detailed Results</Typography>}
          />
          <CardContent>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="SQL Statements" />
                <Tab label="Register Statistics" />
                <Tab label="NMI Summary" />
                <Tab label="Errors" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <TextField
                multiline
                rows={12}
                value={
                  result.sqlStatements.slice(0, 10).join("\n") +
                  (result.sqlStatements.length > 10
                    ? "\n... and " +
                      (result.sqlStatements.length - 10) +
                      " more statements"
                    : "")
                }
                InputProps={{
                  readOnly: true,
                  sx: { fontFamily: "monospace", fontSize: "0.75rem" },
                }}
                fullWidth
                variant="outlined"
              />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Register Distribution:
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Register Type</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong>Count</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Description</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(result.summary.registerStats).map(
                        ([register, count]) => (
                          <TableRow key={register}>
                            <TableCell>
                              <Chip
                                label={
                                  register === "original"
                                    ? "Original"
                                    : register
                                }
                                size="small"
                                color={
                                  register === "original"
                                    ? "primary"
                                    : "secondary"
                                }
                              />
                            </TableCell>
                            <TableCell align="right">{count}</TableCell>
                            <TableCell>
                              {register === "original"
                                ? "Records with no duplicates"
                                : `Duplicate records with ${register} suffix`}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Original NMIs Processed:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {result.summary.nmis.map((nmi, index) => (
                    <Chip key={index} label={nmi} variant="outlined" />
                  ))}
                </Box>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              {result.errors.length > 0 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {result.errors.map((error, index) => (
                    <Alert key={index} severity="error" icon={<Error />}>
                      {error}
                    </Alert>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No errors encountered during processing
                </Typography>
              )}
            </TabPanel>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
