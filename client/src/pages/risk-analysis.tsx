import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, Play, TrendingDown, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Institution } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const scenarioTypes = [
  { value: "EXCHANGE_RATE_SHOCK", label: "Exchange Rate Shock" },
  { value: "LIQUIDITY_SHOCK", label: "Liquidity Shock" },
  { value: "INTEREST_RATE_SHOCK", label: "Interest Rate Shock" },
  { value: "MACROECONOMIC_DOWNTURN", label: "Macroeconomic Downturn" },
  { value: "SECTORAL_SHOCK", label: "Sectoral Shock" },
];

const severityLevels = [
  { value: "MILD", label: "Mild", color: "bg-yellow-500" },
  { value: "MODERATE", label: "Moderate", color: "bg-orange-500" },
  { value: "SEVERE", label: "Severe", color: "bg-red-500" },
];

export default function RiskAnalysis() {
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [scenarioType, setScenarioType] = useState("");
  const [severity, setSeverity] = useState("MODERATE");
  const { toast } = useToast();

  const { data: institutions } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
  });

  const runStressTest = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/stress-tests", {
        institutionId: parseInt(selectedInstitution),
        scenarioType,
        severity,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stress-tests"] });
      toast({
        title: "Stress Test Complete",
        description: "Results are now available",
      });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Risk Analysis</h1>
        <p className="mt-2 text-muted-foreground">
          Comprehensive risk assessment and stress testing
        </p>
      </div>

      <Tabs defaultValue="stress-testing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="stress-testing">Stress Testing</TabsTrigger>
          <TabsTrigger value="risk-scoring">Risk Scoring</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="stress-testing" className="space-y-6">
          {/* Stress Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Run Stress Test</CardTitle>
              <CardDescription>
                Simulate macro-financial scenarios and assess impact on institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
                    <SelectTrigger data-testid="select-institution-stress">
                      <SelectValue placeholder="Select institution" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutions?.map((inst) => (
                        <SelectItem key={inst.id} value={inst.id.toString()}>
                          {inst.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Scenario Type</Label>
                  <Select value={scenarioType} onValueChange={setScenarioType}>
                    <SelectTrigger data-testid="select-scenario">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarioTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Severity Level</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger data-testid="select-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${level.color}`} />
                            {level.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="mt-6"
                onClick={() => runStressTest.mutate()}
                disabled={!selectedInstitution || !scenarioType || runStressTest.isPending}
                data-testid="button-run-stress-test"
              >
                <Play className="mr-2 h-4 w-4" />
                {runStressTest.isPending ? "Running Test..." : "Run Stress Test"}
              </Button>
            </CardContent>
          </Card>

          {/* Scenario Parameters */}
          {scenarioType && (
            <Card>
              <CardHeader>
                <CardTitle>Scenario Parameters</CardTitle>
                <CardDescription>
                  {scenarioTypes.find((s) => s.value === scenarioType)?.label} - {severity} severity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {scenarioType === "EXCHANGE_RATE_SHOCK" && (
                    <>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Local Currency Depreciation</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "15%" : severity === "MODERATE" ? "30%" : "50%"}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Import Cost Increase</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "10%" : severity === "MODERATE" ? "20%" : "35%"}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Export Income Decrease</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "8%" : severity === "MODERATE" ? "15%" : "25%"}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Inflation Impact</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "5%" : severity === "MODERATE" ? "10%" : "20%"}
                        </span>
                      </div>
                    </>
                  )}
                  {scenarioType === "LIQUIDITY_SHOCK" && (
                    <>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Deposit Withdrawal</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "10%" : severity === "MODERATE" ? "20%" : "35%"}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Funding Cost Increase</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "2%" : severity === "MODERATE" ? "5%" : "10%"}
                        </span>
                      </div>
                      <div className="flex justify-between rounded-lg border p-3">
                        <span className="text-sm">Liquid Assets Decrease</span>
                        <span className="font-mono font-medium">
                          {severity === "MILD" ? "15%" : severity === "MODERATE" ? "25%" : "40%"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risk-scoring" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Probability of Default</p>
                    <p className="mt-2 text-3xl font-semibold font-mono">2.5%</p>
                  </div>
                  <Activity className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Loss Given Default</p>
                    <p className="mt-2 text-3xl font-semibold font-mono">45%</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Exposure at Default</p>
                    <p className="mt-2 text-3xl font-semibold font-mono">$12M</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Anomaly Detection</CardTitle>
              <CardDescription>Outliers in returns and financial ratios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Unusual spike in NPL ratio detected</span>
                  </div>
                  <Badge variant="secondary">High Priority</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-sm">Liquidity coverage below regulatory minimum</span>
                  </div>
                  <Badge variant="secondary">Medium Priority</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Regulatory compliance tracker</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Institution</TableHead>
                    <TableHead>Compliance Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Last Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">CBZ Bank</TableCell>
                    <TableCell>Capital Adequacy</TableCell>
                    <TableCell>
                      <Badge variant="default" className="bg-green-600">Compliant</Badge>
                    </TableCell>
                    <TableCell className="font-mono">98%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">2024-01-15</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">FBC Bank</TableCell>
                    <TableCell>Returns Submission</TableCell>
                    <TableCell>
                      <Badge variant="secondary">Under Review</Badge>
                    </TableCell>
                    <TableCell className="font-mono">85%</TableCell>
                    <TableCell className="text-sm text-muted-foreground">2024-01-10</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
