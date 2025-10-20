import { useState } from "react";
import { FileBarChart, Download, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const reportTemplates = [
  { id: "monthly-surveillance", name: "Monthly Surveillance Report", description: "Comprehensive monthly analysis" },
  { id: "camels-summary", name: "CAMELS Summary Report", description: "All institutions CAMELS ratings" },
  { id: "stress-test", name: "Stress Test Results", description: "Latest stress testing outcomes" },
  { id: "premium-reconciliation", name: "Premium Reconciliation", description: "Premium collection status" },
  { id: "compliance", name: "Compliance Status Report", description: "Regulatory compliance overview" },
];

export default function Reports() {
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="mt-2 text-muted-foreground">
          Generate and export regulatory reports
        </p>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="history">Report History</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Builder</CardTitle>
              <CardDescription>Create custom reports with filters and date ranges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Report Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger data-testid="select-report-template">
                    <SelectValue placeholder="Select report template" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">{template.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <Button
                  disabled={!selectedTemplate}
                  data-testid="button-generate-pdf"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Generate PDF
                </Button>
                <Button
                  variant="outline"
                  disabled={!selectedTemplate}
                  data-testid="button-generate-excel"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export to Excel
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Templates Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover-elevate transition-all"
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <FileText className="h-8 w-8 text-primary" />
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template.id);
                    }}
                  >
                    Select Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduled Reports</CardTitle>
              <CardDescription>Automated report generation schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No scheduled reports configured</p>
                <Button className="mt-4" variant="outline">
                  Create Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>Previously generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <FileBarChart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No reports generated yet</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
