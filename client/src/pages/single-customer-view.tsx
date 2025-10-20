import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, DollarSign, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CustomerAccount {
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface UniqueCustomer {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  accounts: CustomerAccount[];
  total_balance: number;
  account_count: number;
}

interface UniqueCustomersResponse {
  institution_id: string;
  period_id: string;
  total_unique_customers: number;
  customers: UniqueCustomer[];
  consolidation_date: string;
}

export default function SingleCustomerView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [institutionId, setInstitutionId] = useState("");

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

  const { data: uniqueCustomersData, isLoading } = useQuery<UniqueCustomersResponse>({
    queryKey: ["uniqueCustomers", institutionId],
    queryFn: async () => {
      if (!institutionId) return { customers: [] }; // Return empty if no institution selected
      // Fetch the latest period with SCV data for the institution
      const response = await fetch(`/ml-service/scv/customers/latest/${institutionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unique customer data");
      }
      return response.json();
    },
    enabled: !!institutionId,
  });

  const filteredCustomers = uniqueCustomersData?.customers?.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalances = filteredCustomers?.reduce((sum, c) => sum + c.total_balance, 0) || 0;
  // Insured amount is not directly available in UniqueCustomer, so we'll mock it for now
  const totalInsuredAmount = totalBalances * 0.8; // Placeholder

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Single Customer View</h1>
        <p className="mt-2 text-muted-foreground">
          Consolidated view of customer deposits across institutions
        </p>
      </div>

      {/* Institution Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select Institution</CardTitle>
          <CardDescription>Choose an institution to view its customer data</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
          <CardDescription>Find customer by name or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter customer name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-customer"
              disabled={!institutionId}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Unique Customers</p>
                <p className="mt-2 text-3xl font-semibold font-mono">{filteredCustomers?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Balances</p>
                <p className="mt-2 text-3xl font-semibold font-mono">
                  ${totalBalances.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Insured Amount</p>
                <p className="mt-2 text-3xl font-semibold font-mono">
                  ${totalInsuredAmount.toLocaleString()}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Search, DollarSign, Shield, Plus, Upload, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CustomerAccount {
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface UniqueCustomer {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  accounts: CustomerAccount[];
  total_balance: number;
  account_count: number;
}

interface UniqueCustomersResponse {
  institution_id: string;
  period_id: string;
  total_unique_customers: number;
  customers: UniqueCustomer[];
  consolidation_date: string;
}

interface SimulationResponse {
  id: string;
  simulation_type: string;
  total_payout_amount: number;
  affected_customers: number;
  affected_accounts: number;
  payout_breakdown: any; // Adjust type as needed
  created_at: string;
}

export default function SingleCustomerView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [accountsDetailsOpen, setAccountsDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UniqueCustomer | null>(null);
  const [coverLevel, setCoverLevel] = useState<number>(100000); // Default cover level
  const { toast } = useToast();

  // Fetch institutions
  const { data: institutions } = useQuery<{
    id: string;
    name: string;
    code: string;
  }[]> incessantly({
    queryKey: ["institutions"],
    queryFn: async () => {
      const response = await fetch("/ml-service/institutions");
      if (!response.ok) {
        throw new Error("Failed to fetch institutions");
      }
      return response.json();
    },
  });

  const { data: uniqueCustomersData, isLoading } = useQuery<UniqueCustomersResponse>({
    queryKey: ["uniqueCustomers", institutionId],
    queryFn: async () => {
      if (!institutionId) return { customers: [] }; // Return empty if no institution selected
      const response = await fetch(`/ml-service/scv/customers/latest/${institutionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unique customer data");
      }
      return response.json();
    },
    enabled: !!institutionId,
  });

  const payoutSimulationMutation = useMutation({
    mutationFn: async (data: { institution_id: string; cover_level: number; parameters?: any }) => {
      const response = await fetch(`/ml-service/scv/simulate/payout/${data.institution_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cover_level: data.cover_level, parameters: data.parameters }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to run payout simulation");
      }
      return response.json();
    },
    onSuccess: (data: { simulation: SimulationResponse; simulation_details: any }) => {
      toast({
        title: "Payout Simulation Complete",
        description: `Total Payout: ${data.simulation.total_payout_amount.toLocaleString()}`,
      });
      // Optionally, store and display the simulation results in state
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunPayoutSimulation = () => {
    if (!institutionId) {
      toast({
        title: "Validation Error",
        description: "Please select an institution first.",
        variant: "destructive",
      });
      return;
    }
    payoutSimulationMutation.mutate({
      institution_id: institutionId,
      cover_level: coverLevel,
      parameters: {}, // Add actual parameters if needed
    });
  };

  const filteredCustomers = uniqueCustomersData?.customers?.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalances = filteredCustomers?.reduce((sum, c) => sum + c.total_balance, 0) || 0;
  const totalInsuredAmount = totalBalances * 0.8; // Placeholder for now

  const handleViewAccounts = (customer: UniqueCustomer) => {
    setSelectedCustomer(customer);
    setAccountsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Single Customer View</h1>
          <p className="mt-2 text-muted-foreground">
            Consolidated view of customer deposits across institutions
          </p>
        </div>
        <Dialog open={uploadFormOpen} onOpenChange={setUploadFormOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-scv">
              <Plus className="mr-2 h-4 w-4" />
              Upload SCV Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New SCV Data</DialogTitle>
              <DialogDescription>
                Upload a Single Customer View data file for processing.
              </DialogDescription>
            </DialogHeader>
            <UploadSCVForm onSuccess={() => setUploadFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Institution Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select Institution</CardTitle>
          <CardDescription>Choose an institution to view its customer data</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
          <CardDescription>Find customer by name or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter customer name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-customer"
              disabled={!institutionId}
            />
          </div>
        </CardContent>
      </Card>

  const dailySnapshotSimulationMutation = useMutation({
    mutationFn: async (institution_id: string) => {
      const response = await fetch(`/ml-service/scv/simulate/snapshot/${institution_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to run daily snapshot simulation");
      }
      return response.json();
    },
    onSuccess: (data: { simulation: SimulationResponse; readiness_assessment: any; processing_metrics: any }) => {
      toast({
        title: "Daily Snapshot Simulation Complete",
        description: `Readiness Status: ${data.readiness_assessment.status}`,
      });
      // Optionally, store and display the simulation results in state
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRunDailySnapshotSimulation = () => {
    if (!institutionId) {
      toast({
        title: "Validation Error",
        description: "Please select an institution first.",
        variant: "destructive",
      });
      return;
    }
    dailySnapshotSimulationMutation.mutate(institutionId);
  };

  const filteredCustomers = uniqueCustomersData?.customers?.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalances = filteredCustomers?.reduce((sum, c) => sum + c.total_balance, 0) || 0;
  const totalInsuredAmount = totalBalances * 0.8; // Placeholder for now

  const handleViewAccounts = (customer: UniqueCustomer) => {
    setSelectedCustomer(customer);
    setAccountsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Single Customer View</h1>
          <p className="mt-2 text-muted-foreground">
            Consolidated view of customer deposits across institutions
          </p>
        </div>
        <Dialog open={uploadFormOpen} onOpenChange={setUploadFormOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-scv">
              <Plus className="mr-2 h-4 w-4" />
              Upload SCV Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New SCV Data</DialogTitle>
              <DialogDescription>
                Upload a Single Customer View data file for processing.
              </DialogDescription>
            </DialogHeader>
            <UploadSCVForm onSuccess={() => setUploadFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Institution Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select Institution</CardTitle>
          <CardDescription>Choose an institution to view its customer data</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
          <CardDescription>Find customer by name or ID</CardDescription>
          </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter customer name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-customer"
              disabled={!institutionId}
            />
          </div>
        </CardContent>
      </Card>

      {/* SCV Simulations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payout Simulation</CardTitle>
            <CardDescription>Simulate potential payouts based on current SCV data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cover-level">Cover Level</Label>
              <Input id="cover-level" type="number" placeholder="e.g., 100000" value={coverLevel} onChange={(e) => setCoverLevel(parseFloat(e.target.value))}/>
            </div>
            <Button onClick={handleRunPayoutSimulation} disabled={!institutionId || payoutSimulationMutation.isPending}>
              {payoutSimulationMutation.isPending ? "Running..." : <><Play className="mr-2 h-4 w-4" /> Run Payout Simulation</>}
            </Button>
            {payoutSimulationMutation.isSuccess && payoutSimulationMutation.data && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-semibold">Simulation Results:</h4>
                <p><strong>Total Payout:</strong> ${payoutSimulationMutation.data.simulation.total_payout_amount.toLocaleString()}</p>
                <p><strong>Affected Customers:</strong> {payoutSimulationMutation.data.simulation.affected_customers}</p>
                <p><strong>Affected Accounts:</strong> {payoutSimulationMutation.data.simulation.affected_accounts}</p>
                {/* Add more details as needed */}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Snapshot Simulation</CardTitle>
            <CardDescription>Assess payout readiness based on a daily SCV snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRunDailySnapshotSimulation} disabled={!institutionId || dailySnapshotSimulationMutation.isPending}>
              {dailySnapshotSimulationMutation.isPending ? "Running..." : <><Play className="mr-2 h-4 w-4" /> Run Daily Snapshot Simulation</>}
            </Button>
            {dailySnapshotSimulationMutation.isSuccess && dailySnapshotSimulationMutation.data && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-semibold">Simulation Results:</h4>
                <p><strong>Readiness Status:</strong> {dailySnapshotSimulationMutation.data.readiness_assessment.status}</p>
                <p><strong>Readiness Score:</strong> {dailySnapshotSimulationMutation.data.readiness_assessment.readiness_score.toFixed(2)}</p>
                <p><strong>Estimated Processing Time:</strong> {dailySnapshotSimulationMutation.data.processing_metrics.estimated_processing_time.toFixed(2)} seconds</p>
                {/* Add more details as needed */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Deposit Register</CardTitle>
          <CardDescription>Consolidated customer balances and coverage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading customers...</div>
          ) : !filteredCustomers || filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm ? "No customers found matching your search" : "No customer data available"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-right">Account Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-mono font-medium">{customer.customer_id}</TableCell>
                    <TableCell>{customer.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {customer.customer_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${customer.total_balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {customer.account_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewAccounts(customer)}>
                        View Accounts
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Accounts Details Dialog */}
      <Dialog open={accountsDetailsOpen} onOpenChange={setAccountsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Accounts for {selectedCustomer?.customer_name}</DialogTitle>
            <DialogDescription>
              Detailed list of accounts for this customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedCustomer && selectedCustomer.accounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Currency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCustomer.accounts.map((account) => (
                    <TableRow key={account.account_number}>
                      <TableCell className="font-mono">{account.account_number}</TableCell>
                      <TableCell className="capitalize">{account.account_type}</TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground">No accounts found for this customer.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Search, DollarSign, Shield, Plus, Upload, Play } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CustomerAccount {
  account_number: string;
  account_type: string;
  balance: number;
  currency: string;
}

interface UniqueCustomer {
  customer_id: string;
  customer_name: string;
  customer_type: string;
  accounts: CustomerAccount[];
  total_balance: number;
  account_count: number;
}

interface UniqueCustomersResponse {
  institution_id: string;
  period_id: string;
  total_unique_customers: number;
  customers: UniqueCustomer[];
  consolidation_date: string;
}

interface SimulationResponse {
  id: string;
  simulation_type: string;
  total_payout_amount: number;
  affected_customers: number;
  affected_accounts: number;
  payout_breakdown: any; // Adjust type as needed
  created_at: string;
}

export default function SingleCustomerView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [institutionId, setInstitutionId] = useState("");
  const [uploadFormOpen, setUploadFormOpen] = useState(false);
  const [accountsDetailsOpen, setAccountsDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UniqueCustomer | null>(null);
  const [coverLevel, setCoverLevel] = useState<number>(100000); // Default cover level
  const { toast } = useToast();

  // Fetch institutions
  const { data: institutions } = useQuery<{
    id: string;
    name: string;
    code: string;
  }[]> incessantly({
    queryKey: ["institutions"],
    queryFn: async () => {
      const response = await fetch("/ml-service/institutions");
      if (!response.ok) {
        throw new Error("Failed to fetch institutions");
      }
      return response.json();
    },
  });

  const { data: uniqueCustomersData, isLoading } = useQuery<UniqueCustomersResponse>({
    queryKey: ["uniqueCustomers", institutionId],
    queryFn: async () => {
      if (!institutionId) return { customers: [] }; // Return empty if no institution selected
      const response = await fetch(`/ml-service/scv/customers/latest/${institutionId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch unique customer data");
      }
      return response.json();
    },
    enabled: !!institutionId,
  });

  const payoutSimulationMutation = useMutation({
    mutationFn: async (data: { institution_id: string; cover_level: number; parameters?: any }) => {
      const response = await fetch(`/ml-service/scv/simulate/payout/${data.institution_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cover_level: data.cover_level, parameters: data.parameters }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to run payout simulation");
      }
      return response.json();
    },
    onSuccess: (data: { simulation: SimulationResponse; simulation_details: any }) => {
      toast({
        title: "Payout Simulation Complete",
        description: `Total Payout: ${data.simulation.total_payout_amount.toLocaleString()}`,
      });
      queryClient.setQueryData(["payoutSimulationResults"], data); // Store results in cache
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payoutSimulationResults = queryClient.getQueryData(["payoutSimulationResults"]);

  const handleRunPayoutSimulation = () => {
    if (!institutionId) {
      toast({
        title: "Validation Error",
        description: "Please select an institution first.",
        variant: "destructive",
      });
      return;
    }
    payoutSimulationMutation.mutate({
      institution_id: institutionId,
      cover_level: coverLevel,
      parameters: {}, // Add actual parameters if needed
    });
  };

  const dailySnapshotSimulationMutation = useMutation({
    mutationFn: async (institution_id: string) => {
      const response = await fetch(`/ml-service/scv/simulate/snapshot/${institution_id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to run daily snapshot simulation");
      }
      return response.json();
    },
    onSuccess: (data: { simulation: SimulationResponse; readiness_assessment: any; processing_metrics: any }) => {
      toast({
        title: "Daily Snapshot Simulation Complete",
        description: `Readiness Status: ${data.readiness_assessment.status}`,
      });
      queryClient.setQueryData(["dailySnapshotSimulationResults"], data); // Store results in cache
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const dailySnapshotSimulationResults = queryClient.getQueryData(["dailySnapshotSimulationResults"]);

  const handleRunDailySnapshotSimulation = () => {
    if (!institutionId) {
      toast({
        title: "Validation Error",
        description: "Please select an institution first.",
        variant: "destructive",
      });
      return;
    }
    dailySnapshotSimulationMutation.mutate(institutionId);
  };

  const filteredCustomers = uniqueCustomersData?.customers?.filter((customer) =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBalances = filteredCustomers?.reduce((sum, c) => sum + c.total_balance, 0) || 0;
  const totalInsuredAmount = totalBalances * 0.8; // Placeholder for now

  const handleViewAccounts = (customer: UniqueCustomer) => {
    setSelectedCustomer(customer);
    setAccountsDetailsOpen(true);
  };

  // Prepare data for Payout Breakdown Chart
  const payoutBreakdownData = payoutSimulationResults?.simulation?.payout_breakdown?.by_customer_type
    ? Object.entries(payoutSimulationResults.simulation.payout_breakdown.by_customer_type).map(([type, amount]) => ({
        name: type,
        amount: amount,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Single Customer View</h1>
          <p className="mt-2 text-muted-foreground">
            Consolidated view of customer deposits across institutions
          </p>
        </div>
        <Dialog open={uploadFormOpen} onOpenChange={setUploadFormOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-scv">
              <Plus className="mr-2 h-4 w-4" />
              Upload SCV Data
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload New SCV Data</DialogTitle>
              <DialogDescription>
                Upload a Single Customer View data file for processing.
              </DialogDescription>
            </DialogHeader>
            <UploadSCVForm onSuccess={() => setUploadFormOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Institution Select */}
      <Card>
        <CardHeader>
          <CardTitle>Select Institution</CardTitle>
          <CardDescription>Choose an institution to view its customer data</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Customer</CardTitle>
          <CardDescription>Find customer by name or ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Enter customer name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-customer"
              disabled={!institutionId}
            />
          </div>
        </CardContent>
      </Card>

      {/* SCV Simulations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payout Simulation</CardTitle>
            <CardDescription>Simulate potential payouts based on current SCV data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cover-level">Cover Level</Label>
              <Input id="cover-level" type="number" placeholder="e.g., 100000" value={coverLevel} onChange={(e) => setCoverLevel(parseFloat(e.target.value))}/>
            </div>
            <Button onClick={handleRunPayoutSimulation} disabled={!institutionId || payoutSimulationMutation.isPending}>
              {payoutSimulationMutation.isPending ? "Running..." : <><Play className="mr-2 h-4 w-4" /> Run Payout Simulation</>}
            </Button>
            {payoutSimulationResults && payoutSimulationResults.simulation && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-semibold">Simulation Results:</h4>
                <p><strong>Total Payout:</strong> ${payoutSimulationResults.simulation.total_payout_amount.toLocaleString()}</p>
                <p><strong>Affected Customers:</strong> {payoutSimulationResults.simulation.affected_customers}</p>
                <p><strong>Affected Accounts:</strong> {payoutSimulationResults.simulation.affected_accounts}</p>
                
                {payoutBreakdownData.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-semibold">Payout Breakdown by Customer Type:</h5>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={payoutBreakdownData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey="amount" fill="#8884d8" name="Payout Amount" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Daily Snapshot Simulation</CardTitle>
            <CardDescription>Assess payout readiness based on a daily SCV snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRunDailySnapshotSimulation} disabled={!institutionId || dailySnapshotSimulationMutation.isPending}>
              {dailySnapshotSimulationMutation.isPending ? "Running..." : <><Play className="mr-2 h-4 w-4" /> Run Daily Snapshot Simulation</>}
            </Button>
            {dailySnapshotSimulationResults && dailySnapshotSimulationResults.readiness_assessment && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-semibold">Simulation Results:</h4>
                <p><strong>Readiness Status:</strong> {dailySnapshotSimulationResults.readiness_assessment.status}</p>
                <p><strong>Readiness Score:</strong> {dailySnapshotSimulationResults.readiness_assessment.readiness_score.toFixed(2)}</p>
                <p><strong>Estimated Processing Time:</strong> {dailySnapshotSimulationResults.processing_metrics.estimated_processing_time.toFixed(2)} seconds</p>
                {/* Add more details as needed */}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Deposit Register</CardTitle>
          <CardDescription>Consolidated customer balances and coverage</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-muted-foreground">Loading customers...</div>
          ) : !filteredCustomers || filteredCustomers.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm ? "No customers found matching your search" : "No customer data available"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Balance</TableHead>
                  <TableHead className="text-right">Account Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.customer_id}>
                    <TableCell className="font-mono font-medium">{customer.customer_id}</TableCell>
                    <TableCell>{customer.customer_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {customer.customer_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${customer.total_balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {customer.account_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewAccounts(customer)}>
                        View Accounts
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Accounts Details Dialog */}
      <Dialog open={accountsDetailsOpen} onOpenChange={setAccountsDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Accounts for {selectedCustomer?.customer_name}</DialogTitle>
            <DialogDescription>
              Detailed list of accounts for this customer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {selectedCustomer && selectedCustomer.accounts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Number</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Currency</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedCustomer.accounts.map((account) => (
                    <TableRow key={account.account_number}>
                      <TableCell className="font-mono">{account.account_number}</TableCell>
                      <TableCell className="capitalize">{account.account_type}</TableCell>
                      <TableCell className="text-right font-mono">${account.balance.toLocaleString()}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground">No accounts found for this customer.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

