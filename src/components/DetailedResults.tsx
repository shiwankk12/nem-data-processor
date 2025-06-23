"use client";

import type React from "react";

import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Alert,
  Tabs,
  Tab,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Error } from "@mui/icons-material";
import { ProcessingResult } from "./types";

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index} // Hide when not active
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export function DetailedResults({ result }: { result: ProcessingResult }) {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
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

        {/* Tab 1: SQL Statements Preview */}
        <TabPanel value={tabValue} index={0}>
          <TextField
            multiline
            rows={12}
            value={
              // Show first 10 SQL statements with truncation message if more exist
              result.sqlStatements.slice(0, 10).join("\n") +
              (result.sqlStatements.length > 10
                ? "\n... and " +
                  (result.sqlStatements.length - 10) +
                  " more statements"
                : "")
            }
            InputProps={{
              readOnly: true,
              sx: { fontFamily: "monospace", fontSize: "0.75rem" }, // Monospace for SQL
            }}
            fullWidth
            variant="outlined"
          />
        </TabPanel>

        {/* Tab 2: Register Statistics Table */}
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
                              register === "original" ? "Original" : register
                            }
                            size="small"
                            color={
                              register === "original" ? "primary" : "secondary"
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

        {/* Tab 3: NMI Summary */}
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

        {/* Tab 4: Errors Display */}
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
  );
}
