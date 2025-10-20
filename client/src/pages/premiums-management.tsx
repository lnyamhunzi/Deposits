import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, FileText, CheckCircle, Clock, AlertCircle, Plus, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
// import type { Invoice, Payment } from "@shared/schema"; // Remove this line

interface PremiumCalculationResponse {
  id: string;
  institution_id: string;
  period_id: string;
  calculation_method: "FLAT_RATE" | "RISK_BASED";
  total_eligible_deposits: number;
  average_eligible_deposits: number;
  base_premium_rate: number;
  risk_adjustment_factor: number;
  risk_premium_rate: number;
  calculated_premium: number;
  final_premium: number;
  status: "CALCULATED" | "INVOICED" | "PAID" | "CANCELLED";
  calculated_at: string;
}

interface Invoice {
  id: string;
  institution_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  status: "CALCULATED" | "INVOICED" | "PAID" | "CANCELLED";
}

interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_reference: string;
  status: "PENDING" | "RECEIVED" | "VERIFIED" | "REJECTED";
  proof_verified: boolean;
}

const statusConfig = {
  CALCULATED: { icon: Clock, label: "Calculated", variant: "secondary" as const, color: "text-blue-600" },
  INVOICED: { icon: FileText, label: "Invoiced", variant: "secondary" as const, color: "text-yellow-600" },
  PAID: { icon: CheckCircle, label: "Paid", variant: "default" as const, color: "text-green-600" },
  CANCELLED: { icon: AlertCircle, label: "Cancelled", variant: "destructive" as const, color: "text-gray-600" },
};

export default function PremiumsManagement() {
  const [calculatePremiumOpen, setCalculatePremiumOpen] = useState(false);
  const { toast } = useToast();

  const { data: premiumCalculations, isLoading: isLoadingCalculations } = useQuery<PremiumCalculationResponse[]>({ 
    queryKey: ["premiumCalculations"],
    queryFn: async () => {
      const response = await fetch("/ml-service/premiums/calculations");
      if (!response.ok) {
        throw new Error("Failed to fetch premium calculations");
      }
      return response.json();
    },
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({ 
    queryKey: ["payments"],
    queryFn: async () => {
      const response = await fetch("/ml-service/premiums/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments");
      }
      return response.json();
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Premiums Management</h1>
          <p className="mt-2 text-muted-foreground">
            Manage premium calculations, invoicing, and payments
          </p>
        </div>
        <Dialog open={calculatePremiumOpen} onOpenChange={setCalculatePremiumOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-calculate-premiums">
              <Plus className="mr-2 h-4 w-4" />
              Calculate Premiums
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Calculate New Premiums</DialogTitle>
              <DialogDescription>
                Calculate premiums for an institution for a specific period.
              </DialogDescription>
            </DialogHeader>
            <CalculatePremiumForm onSuccess={() => setCalculatePremiumOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Calculations</p>
                <p className="mt-2 text-2xl font-semibold font-mono">{premiumCalculations?.length || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoiced</p>
                <p className="mt-2 text-2xl font-semibold font-mono text-yellow-600">
                  {premiumCalculations?.filter((i) => i.status === "INVOICED").length || 0}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="mt-2 text-2xl font-semibold font-mono text-green-600">
                  {premiumCalculations?.filter((i) => i.status === "PAID").length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="mt-2 text-2xl font-semibold font-mono text-red-600">
                  {/* This logic needs to be implemented based on due_date and payment status */}
                  {premiumCalculations?.filter((i) => i.status === "INVOICED" && new Date(i.calculated_at) < new Date()).length || 0}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">Premium Calculations</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Premium Calculations</CardTitle>
              <CardDescription>All generated premium calculations</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCalculations ? (
                <div className="py-8 text-center text-muted-foreground">Loading calculations...</div>
              ) : !premiumCalculations || premiumCalculations.length === 0 ? (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No premium calculations generated yet</p>
                  <Button className="mt-4" variant="outline" onClick={() => setCalculatePremiumOpen(true)}>
                    Calculate First Premiums
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Institution</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Base Rate</TableHead>
                      <TableHead className="text-right">Final Premium</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Calculated At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {premiumCalculations.map((calc) => {
                      const config = statusConfig[calc.status];
                      const Icon = config.icon;
                      return (
                        <TableRow key={calc.id}>
                          <TableCell className="font-medium">Institution #{calc.institution_id}</TableCell>
                          <TableCell className="font-mono text-sm">{calc.period_id}</TableCell>
                          <TableCell className="capitalize">{calc.calculation_method}</TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {(calc.base_premium_rate * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            ${Number(calc.final_premium).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant} className="gap-1">
                              <Icon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(calc.calculated_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>Received premium payments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPayments ? (
                <div className="py-8 text-center text-muted-foreground">Loading payments...</div>
              ) : !payments || payments.length === 0 ? (
                <div className="py-12 text-center">
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No payments recorded yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-mono text-sm">{payment.invoice_id}</TableCell>
                        <TableCell className="font-medium">{payment.payment_reference}</TableCell>
                        <TableCell className="text-right font-mono">${Number(payment.amount).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "VERIFIED" ? "default" : "secondary"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell>{payment.proof_verified ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Reconciliation</CardTitle>
              <CardDescription>Match payments with invoices and generate reports</CardDescription>
            </CardHeader>
            <CardContent>
              <ReconciliationForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ReconciliationReportResponse {
  report_metadata: any;
  executive_summary: any;
  reconciliation_details: any[];
  transaction_statement: any[];
  recommendations: any[];
  next_steps: string[];
}

function ReconciliationForm() {
  const { toast } = useToast();
  const [institutionId, setInstitutionId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Fetch institutions
  const { data: institutions } = useQuery<{
    id: string;
    name: string;
    code: string;
  }[]>({
    queryKey: ["institutions"],
    queryFn: async () => {
      const response = await fetch("/ml-service/institutions");
      if (!response.ok) {
        throw new Error("Failed to fetch institutions");
      }
      return response.json();
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (data: { institution_id: string; start_date: string; end_date: string }) => {
      const response = await fetch(
        `/ml-service/reconciliation/${data.institution_id}/report?start_date=${data.start_date}&end_date=${data.end_date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate reconciliation report");
      }
      return response.json();
    },
    onSuccess: (data: ReconciliationReportResponse) => {
      toast({
        title: "Reconciliation Report Generated",
        description: `Report for ${data.report_metadata.institution.name} from ${data.report_metadata.report_period.start_date} to ${data.report_metadata.report_period.end_date}`,
      });
      queryClient.setQueryData(["reconciliationReport"], data); // Store results in cache
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reconciliationReport = queryClient.getQueryData(["reconciliationReport"]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId || !startDate || !endDate) {
      toast({
        title: "Validation Error",
        description: "Please select an institution, start date, and end date.",
        variant: "destructive",
      });
      return;
    }

    reconcileMutation.mutate({
      institution_id: institutionId,
      start_date: startDate,
      end_date: endDate,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reconciliation-institution">Institution</Label>
          <Select value={institutionId} onValueChange={setInstitutionId}>
            <SelectTrigger id="reconciliation-institution">
              <SelectValue placeholder="Select institution" />
            </SelectTrigger>
            <SelectContent>
              {institutions?.map((inst) => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <Button type="submit" disabled={reconcileMutation.isPending || !institutionId || !startDate || !endDate}>
          {reconcileMutation.isPending ? "Generating..." : <><Play className="mr-2 h-4 w-4" /> Generate Report</>}
        </Button>
      </form>

      {reconciliationReport && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reconciliation Report</CardTitle>
            <CardDescription>Summary and details of the reconciliation process.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold">Executive Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <p><strong>Total Invoiced:</strong> ${reconciliationReport.executive_summary.total_invoiced.toLocaleString()}</p>
              <p><strong>Total Received:</strong> ${reconciliationReport.executive_summary.total_received.toLocaleString()}</p>
              <p><strong>Total Outstanding:</strong> ${reconciliationReport.executive_summary.total_outstanding.toLocaleString()}</p>
              <p><strong>Collection Rate:</strong> {reconciliationReport.executive_summary.collection_rate.toFixed(2)}%</p>
              <p><strong>Total Discrepancies:</strong> {reconciliationReport.executive_summary.total_discrepancies}</p>
              <p><strong>Reconciliation Quality:</strong> {reconciliationReport.executive_summary.reconciliation_quality}</p>
            </div>

            <h3 className="text-lg font-semibold mt-4">Detailed Reconciliation</h3>
            {reconciliationReport.reconciliation_details.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Invoice Amount</TableHead>
                    <TableHead>Payments Received</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Discrepancies</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reconciliationReport.reconciliation_details.map((detail: any) => (
                    <TableRow key={detail.invoice_number}>
                      <TableCell>{detail.invoice_number}</TableCell>
                      <TableCell>${detail.invoice_amount.toLocaleString()}</TableCell>
                      <TableCell>${detail.payments_received.toLocaleString()}</TableCell>
                      <TableCell>${detail.outstanding_amount.toLocaleString()}</TableCell>
                      <TableCell>{detail.discrepancies.length}</TableCell>
                      <TableCell>{detail.reconciliation_status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No detailed reconciliation data.</p>
            )}

            <h3 className="text-lg font-semibold mt-4">Recommendations</h3>
            {reconciliationReport.recommendations.length > 0 ? (
              <ul className="list-disc pl-5">
                {reconciliationReport.recommendations.map((rec: any, index: number) => (
                  <li key={index}><strong>{rec.recommendation}:</strong> {rec.action}</li>
                ))}
              </ul>
            ) : (
              <p>No specific recommendations.</p>
            )}

            <h3 className="text-lg font-semibold mt-4">Next Steps</h3>
            {reconciliationReport.next_steps.length > 0 ? (
              <ul className="list-disc pl-5">
                {reconciliationReport.next_steps.map((step: string, index: number) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            ) : (
              <p>No specific next steps.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CalculatePremiumForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [institutionId, setInstitutionId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("FLAT_RATE");
  const [basePremiumRate, setBasePremiumRate] = useState<number>(0.01); // Default rate

  // Fetch institutions
  const { data: institutions } = useQuery<{
    id: string;
    name: string;
    code: string;
  }[]>({
    queryKey: ["institutions"],
    queryFn: async () => {
      const response = await fetch("/ml-service/institutions");
      if (!response.ok) {
        throw new Error("Failed to fetch institutions");
      }
      return response.json();
    },
  });

  // Fetch return periods for the selected institution
  const { data: returnPeriods } = useQuery<{
    id: string;
    period_type: string;
    period_start: string;
    period_end: string;
    due_date: string;
    status: string;
  }[]>({
    queryKey: ["returnPeriods", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const response = await fetch(`/ml-service/returns/periods/${institutionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch return periods");
      }
      return response.json();
    },
    enabled: !!institutionId,
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/ml-service/premiums/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to calculate premiums");
      }
      return response.json();
    },
    onSuccess: (data: { premium_calculation: PremiumCalculationResponse; calculation_details: any }) => {
      queryClient.invalidateQueries({ queryKey: ["premiumCalculations"] }); // Invalidate calculations to refetch
      toast({
        title: "Success",
        description: `Premiums calculated for ${data.premium_calculation.institution_id} for period ${data.premium_calculation.period_id}`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId || !periodId || !calculationMethod || !basePremiumRate) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    calculateMutation.mutate({
      institution_id: institutionId,
      period_id: periodId,
      calculation_method: calculationMethod,
      base_premium_rate: basePremiumRate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="institution">Institution</Label>
        <Select value={institutionId} onValueChange={setInstitutionId}>
          <SelectTrigger id="institution">
            <SelectValue placeholder="Select institution" />
          </SelectTrigger>
          <SelectContent>
            {institutions?.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                {inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="period">Return Period</Label>
        <Select value={periodId} onValueChange={setPeriodId} disabled={!institutionId}>
          <SelectTrigger id="period">
            <SelectValue placeholder="Select return period" />
          </SelectTrigger>
          <SelectContent>
            {returnPeriods?.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                {period.period_type} - {period.period_start} to {period.period_end}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calculation-method">Calculation Method</Label>
        <Select value={calculationMethod} onValueChange={setCalculationMethod}>
          <SelectTrigger id="calculation-method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FLAT_RATE">Flat Rate</SelectItem>
            <SelectItem value="RISK_BASED">Risk Based</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base-rate">Base Premium Rate</Label>
        <Input
          id="base-rate"
          type="number"
          step="0.0001"
          value={basePremiumRate}
          onChange={(e) => setBasePremiumRate(parseFloat(e.target.value))}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={calculateMutation.isPending || !institutionId || !periodId || !calculationMethod || !basePremiumRate}>
          {calculateMutation.isPending ? "Calculating..." : "Calculate Premiums"}
        </Button>
      </div>
    </form>
  );
}

function CalculatePremiumForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [institutionId, setInstitutionId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [calculationMethod, setCalculationMethod] = useState("FLAT_RATE");
  const [basePremiumRate, setBasePremiumRate] = useState<number>(0.01); // Default rate

  // Fetch institutions
  const { data: institutions } = useQuery<{
    id: string;
    name: string;
    code: string;
  }> ({
    queryKey: ["institutions"],
    queryFn: async () => {
      const response = await fetch("/ml-service/institutions");
      if (!response.ok) {
        throw new Error("Failed to fetch institutions");
      }
      return response.json();
    },
  });

  // Fetch return periods for the selected institution
  const { data: returnPeriods } = useQuery<{
    id: string;
    period_type: string;
    period_start: string;
    period_end: string;
    due_date: string;
    status: string;
  }> ({
    queryKey: ["returnPeriods", institutionId],
    queryFn: async () => {
      if (!institutionId) return [];
      const response = await fetch(`/ml-service/returns/periods/${institutionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch return periods");
      }
      return response.json();
    },
    enabled: !!institutionId,
  });

  const calculateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/ml-service/premiums/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to calculate premiums");
      }
      return response.json();
    },
    onSuccess: (data: { premium_calculation: PremiumCalculationResponse; calculation_details: any }) => {
      queryClient.invalidateQueries({ queryKey: ["premiumCalculations"] }); // Invalidate calculations to refetch
      toast({
        title: "Success",
        description: `Premiums calculated for ${data.premium_calculation.institution_id} for period ${data.premium_calculation.period_id}`,
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId || !periodId || !calculationMethod || !basePremiumRate) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    calculateMutation.mutate({
      institution_id: institutionId,
      period_id: periodId,
      calculation_method: calculationMethod,
      base_premium_rate: basePremiumRate,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="institution">Institution</Label>
        <Select value={institutionId} onValueChange={setInstitutionId}>
          <SelectTrigger id="institution">
            <SelectValue placeholder="Select institution" />
          </SelectTrigger>
          <SelectContent>
            {institutions?.map((inst) => (
              <SelectItem key={inst.id} value={inst.id}>
                {inst.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="period">Return Period</Label>
        <Select value={periodId} onValueChange={setPeriodId} disabled={!institutionId}>
          <SelectTrigger id="period">
            <SelectValue placeholder="Select return period" />
          </SelectTrigger>
          <SelectContent>
            {returnPeriods?.map((period) => (
              <SelectItem key={period.id} value={period.id}>
                {period.period_type} - {period.period_start} to {period.period_end}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calculation-method">Calculation Method</Label>
        <Select value={calculationMethod} onValueChange={setCalculationMethod}>
          <SelectTrigger id="calculation-method">
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FLAT_RATE">Flat Rate</SelectItem>
            <SelectItem value="RISK_BASED">Risk Based</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base-rate">Base Premium Rate</Label>
        <Input
          id="base-rate"
          type="number"
          step="0.0001"
          value={basePremiumRate}
          onChange={(e) => setBasePremiumRate(parseFloat(e.target.value))}
          required
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={calculateMutation.isPending || !institutionId || !periodId || !calculationMethod || !basePremiumRate}>
          {calculateMutation.isPending ? "Calculating..." : "Calculate Premiums"}
        </Button>
      </div>
    </form>
  );
}
