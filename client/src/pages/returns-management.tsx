import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
// import type { Return } from "@shared/schema"; // Remove this line
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define ReturnUploadResponse type based on backend schema
interface ReturnUploadResponse {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  submitted_at: string | null;
  upload_status: "UPLOADED" | "VALIDATING" | "SUBMITTED" | "ARCHIVED" | "REJECTED";
  file_size: number;
  validation_status: string;
}

interface ValidationResultResponse {
  test_name: string;
  status: "PASS" | "FAIL" | "WARNING" | "INFO";
  message: string | null;
  created_at: string;
}

const statusConfig = {
  UPLOADED: { icon: Clock, label: "Uploaded", variant: "secondary" as const, color: "text-yellow-600" },
  VALIDATING: { icon: Clock, label: "Validating", variant: "secondary" as const, color: "text-blue-600" },
  SUBMITTED: { icon: CheckCircle, label: "Submitted", variant: "default" as const, color: "text-green-600" },
  ARCHIVED: { icon: CheckCircle, label: "Archived", variant: "default" as const, color: "text-purple-660" },
  REJECTED: { icon: XCircle, label: "Rejected", variant: "destructive" as const, color: "text-red-600" },
};

export default function ReturnsManagement() {

  const [open, setOpen] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);

  const [selectedUpload, setSelectedUpload] = useState<ReturnUploadResponse | null>(null);

  const { toast } = useToast();



  const { data: returns, isLoading } = useQuery<ReturnUploadResponse[]> ({

    queryKey: ["returns"],

    queryFn: async () => {

      const response = await fetch("/ml-service/returns/uploads");

      if (!response.ok) {

        throw new Error("Failed to fetch returns");

      }

      return response.json();

    },

  });



  const { data: validationResults, isLoading: isLoadingValidationResults } = useQuery<ValidationResultResponse[]> ({

    queryKey: ["validationResults", selectedUpload?.id],

    queryFn: async () => {

      if (!selectedUpload?.id) return [];

      const response = await fetch(`/ml-service/returns/upload/${selectedUpload.id}/validation_results`);

      if (!response.ok) {

        throw new Error("Failed to fetch validation results");

      }

      return response.json();

    },

    enabled: !!selectedUpload?.id && detailsOpen,

  });



  const handleViewDetails = (upload: ReturnUploadResponse) => {

    setSelectedUpload(upload);

    setDetailsOpen(true);

  };



  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>

          <h1 className="text-3xl font-semibold">Returns Management</h1>

          <p className="mt-2 text-muted-foreground">

            Upload and manage deposit returns from financial institutions

          </p>

        </div>

        <Dialog open={open} onOpenChange={setOpen}>

          <DialogTrigger asChild>

            <Button data-testid="button-upload-return">

              <Plus className="mr-2 h-4 w-4" />

              Upload Return

            </Button>

          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">

            <DialogHeader>

              <DialogTitle>Upload New Return</DialogTitle>

              <DialogDescription>

                Upload a deposit return file for validation

              </DialogDescription>

            </DialogHeader>

            <UploadReturnForm onSuccess={() => setOpen(false)} />

          </DialogContent>

        </Dialog>

      </div>



      {/* Summary Cards */}

      <div className="grid gap-6 md:grid-cols-4">

        <Card>

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-muted-foreground">Total Returns</p>

                <p className="mt-2 text-2xl font-semibold font-mono">{returns?.length || 0}</p>

              </div>

              <FileText className="h-8 w-8 text-primary" />

            </div>

          </CardContent>

        </Card>

        <Card>

          <CardContent className="p-6">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-muted-foreground">Uploaded</p>

                <p className="mt-2 text-2xl font-semibold font-mono text-yellow-600">

                  {returns?.filter((r) => r.upload_status === "UPLOADED").length || 0}

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

                <p className="text-sm text-muted-foreground">Submitted</p>

                <p className="mt-2 text-2xl font-semibold font-mono text-green-600">

                  {returns?.filter((r) => r.upload_status === "SUBMITTED").length || 0}

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

                <p className="text-sm text-muted-foreground">Rejected</p>

                <p className="mt-2 text-2xl font-semibold font-mono text-red-600">

                  {returns?.filter((r) => r.upload_status === "REJECTED").length || 0}

                </p>

              </div>

              <XCircle className="h-8 w-8 text-red-600" />

            </div>

          </CardContent>

        </Card>

      </div>



      {/* Returns Table */}

      <Card>

        <CardHeader>

          <CardTitle>Recent Returns</CardTitle>

          <CardDescription>All submitted deposit returns</CardDescription>

        </CardHeader>

        <CardContent>

          {isLoading ? (

            <div className="py-8 text-center text-muted-foreground">Loading returns...</div>

          ) : !returns || returns.length === 0 ? (

            <div className="py-12 text-center">

              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />

              <p className="mt-4 text-muted-foreground">No returns uploaded yet</p>

              <Button className="mt-4" variant="outline" onClick={() => setOpen(true)}>

                Upload First Return

              </Button>

            </div>

          ) : (

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>File Name</TableHead>

                  <TableHead>File Type</TableHead>

                  <TableHead>Status</TableHead>

                  <TableHead>Uploaded At</TableHead>

                  <TableHead>Submitted At</TableHead>

                  <TableHead className="text-right">Actions</TableHead>

                </TableRow>

              </TableHeader>

              <TableBody>

                {returns.map((ret) => {

                  const config = statusConfig[ret.upload_status];

                  const Icon = config.icon;

                  return (

                    <TableRow key={ret.id}>

                      <TableCell className="font-medium">{ret.file_name}</TableCell>

                      <TableCell className="capitalize">{ret.file_type}</TableCell>

                      <TableCell>

                        <Badge variant={config.variant} className="gap-1">

                          <Icon className="h-3 w-3" />

                          {config.label}

                        </Badge>

                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">

                        {new Date(ret.uploaded_at).toLocaleDateString()}

                      </TableCell>

                      <TableCell className="text-sm text-muted-foreground">

                        {ret.submitted_at ? new Date(ret.submitted_at).toLocaleDateString() : "N/A"}

                      </TableCell>

                      <TableCell className="text-right">

                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(ret)}>

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



      {/* Details Dialog */}

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>

        <DialogContent className="sm:max-w-2xl">

          <DialogHeader>

            <DialogTitle>Return Details: {selectedUpload?.file_name}</DialogTitle>

            <DialogDescription>

              Detailed information and validation results for the uploaded return.

            </DialogDescription>

          </DialogHeader>

          <div className="grid gap-4 py-4">

            {selectedUpload && (

              <div className="space-y-2">

                <p><strong>File Name:</strong> {selectedUpload.file_name}</p>

                <p><strong>File Type:</strong> {selectedUpload.file_type}</p>

                <p><strong>Status:</strong> {selectedUpload.upload_status}</p>

                <p><strong>Uploaded At:</strong> {new Date(selectedUpload.uploaded_at).toLocaleString()}</p>

                <p><strong>Submitted At:</strong> {selectedUpload.submitted_at ? new Date(selectedUpload.submitted_at).toLocaleString() : "N/A"}</p>

                <p><strong>File Size:</strong> {(selectedUpload.file_size / 1024).toFixed(2)} KB</p>

              </div>

            )}



            <h3 className="text-lg font-semibold mt-4">Validation Results</h3>

            {isLoadingValidationResults ? (

              <div className="text-center text-muted-foreground">Loading validation results...</div>

            ) : !validationResults || validationResults.length === 0 ? (

              <div className="text-center text-muted-foreground">No validation results found.</div>

            ) : (

              <Table>

                <TableHeader>

                  <TableRow>

                    <TableHead>Test Name</TableHead>

                    <TableHead>Status</TableHead>

                    <TableHead>Message</TableHead>

                    <TableHead>Created At</TableHead>

                  </TableRow>

                </TableHeader>

                <TableBody>

                  {validationResults.map((result) => (

                    <TableRow key={result.test_name + result.created_at}>

                      <TableCell>{result.test_name}</TableCell>

                      <TableCell>{result.status}</TableCell>

                      <TableCell>{result.message}</TableCell>

                      <TableCell>{new Date(result.created_at).toLocaleString()}</TableCell>

                    </TableRow>

                  ))}

                </TableBody>

              </Table>

            )}

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}

function UploadReturnForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [institutionId, setInstitutionId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [file, setFile] = useState<File | null>(null);

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

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch("/ml-service/returns/upload", {
        method: "POST",
        body: data,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to upload return");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] }); // Invalidate the main returns list
      toast({
        title: "Success",
        description: "Return uploaded successfully",
      });
      onSuccess();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionId || !periodId || !file) {
      toast({
        title: "Validation Error",
        description: "Please select an institution, return period, and a file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("period_id", periodId);
    formData.append("file_type", file.name.split(".").pop()?.toUpperCase() || "UNKNOWN");
    formData.append("uploaded_by", "admin"); // Placeholder for now
    formData.append("file", file);

    uploadMutation.mutate(formData);
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
        <Label htmlFor="file">Upload File</Label>
        <div
          className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-muted-foreground/50"
          onDrop={(e) => {
            e.preventDefault();
            const uploadedFile = e.dataTransfer.files[0];
            if (uploadedFile) setFile(uploadedFile);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <label htmlFor="file-upload" className="cursor-pointer text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {file ? file.name : "Drag and drop or click to browse"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Accepts .xlsx,.xls,.csv files
            </p>
            <Input
              id="file-upload"
              type="file"
              className="sr-only"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              accept=".xlsx,.xls,.csv"
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploadMutation.isPending || !file || !institutionId || !periodId}>
          {uploadMutation.isPending ? "Uploading..." : "Upload Return"}
        </Button>
      </div>
    </form>
  );
}
