import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Institution, CamelsRating } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const camelsRatingConfig = {
  "1": { label: "Strong", color: "bg-camels-1", textColor: "text-white" },
  "2": { label: "Satisfactory", color: "bg-camels-2", textColor: "text-white" },
  "3": { label: "Fair", color: "bg-camels-3", textColor: "text-gray-900" },
  "4": { label: "Marginal", color: "bg-camels-4", textColor: "text-white" },
  "5": { label: "Unsatisfactory", color: "bg-camels-5", textColor: "text-white" },
};

function CAMELSCard({
  title,
  rating,
  score,
  components,
}: {
  title: string;
  rating: number;
  score: number;
  components: Record<string, number>;
}) {
  const config = camelsRatingConfig[rating.toString() as keyof typeof camelsRatingConfig];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Badge className={`${config.color} ${config.textColor} border-0`}>
            Rating {rating}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="text-3xl font-bold font-mono">{score.toFixed(1)}%</div>
          <p className="text-sm text-muted-foreground mt-1">{config.label}</p>
        </div>
        <div className="space-y-2">
          {Object.entries(components).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm">
              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
              <span className="font-mono font-medium">{value.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function BankSurveillance() {
  const [selectedInstitution, setSelectedInstitution] = useState<string>("");

  const { data: institutions } = useQuery<Institution[]>({
    queryKey: ["/api/institutions"],
  });

  const { data: camelsRating } = useQuery<CamelsRating>({
    queryKey: ["/api/camels", selectedInstitution],
    enabled: !!selectedInstitution,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Bank Surveillance</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor financial health and CAMELS ratings
          </p>
        </div>
        <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
          <SelectTrigger className="w-[280px]" data-testid="select-institution">
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

      {!selectedInstitution ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-center text-muted-foreground">
              Select an institution to view surveillance data
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="camels" className="space-y-6">
          <TabsList>
            <TabsTrigger value="camels">CAMELS Ratings</TabsTrigger>
            <TabsTrigger value="deposits">Deposit Analysis</TabsTrigger>
            <TabsTrigger value="exposure">Exposure Calculations</TabsTrigger>
          </TabsList>

          <TabsContent value="camels" className="space-y-6">
            {/* Composite Rating */}
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Composite CAMELS Rating</span>
                  {camelsRating && (
                    <Badge
                      className={`${camelsRatingConfig[Math.round(camelsRating.compositeRating || 3).toString() as keyof typeof camelsRatingConfig].color} ${camelsRatingConfig[Math.round(camelsRating.compositeRating || 3).toString() as keyof typeof camelsRatingConfig].textColor} border-0 text-lg px-4 py-2`}
                    >
                      {camelsRating.compositeRating?.toFixed(2) || "N/A"}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Overall financial health assessment - {camelsRating?.riskGrade || "Not Available"}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Individual Components */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CAMELSCard
                title="Capital Adequacy"
                rating={camelsRating?.capitalRating || 3}
                score={Number(camelsRating?.capitalScore) || 75}
                components={camelsRating?.capitalComponents as any || {
                  car: 15.5,
                  tier1_ratio: 12.3,
                  capital_to_assets: 10.2,
                }}
              />
              <CAMELSCard
                title="Asset Quality"
                rating={camelsRating?.assetRating || 3}
                score={Number(camelsRating?.assetScore) || 72}
                components={camelsRating?.assetComponents as any || {
                  gross_npa_ratio: 4.2,
                  net_npa_ratio: 2.1,
                  provision_coverage: 85.3,
                }}
              />
              <CAMELSCard
                title="Management Quality"
                rating={camelsRating?.managementRating || 3}
                score={Number(camelsRating?.managementScore) || 78}
                components={camelsRating?.managementComponents as any || {
                  cost_to_income: 52.5,
                  asset_utilization: 3.2,
                  return_on_equity: 12.5,
                }}
              />
              <CAMELSCard
                title="Earnings"
                rating={camelsRating?.earningsRating || 3}
                score={Number(camelsRating?.earningsScore) || 70}
                components={camelsRating?.earningsComponents as any || {
                  return_on_assets: 1.2,
                  return_on_equity: 13.5,
                  net_interest_margin: 3.8,
                }}
              />
              <CAMELSCard
                title="Liquidity"
                rating={camelsRating?.liquidityRating || 3}
                score={Number(camelsRating?.liquidityScore) || 68}
                components={camelsRating?.liquidityComponents as any || {
                  liquidity_ratio: 25.5,
                  loan_to_deposit: 78.2,
                  quick_ratio: 115.3,
                }}
              />
              <CAMELSCard
                title="Sensitivity"
                rating={camelsRating?.sensitivityRating || 3}
                score={Number(camelsRating?.sensitivityScore) || 74}
                components={camelsRating?.sensitivityComponents as any || {
                  interest_rate_risk: 8.5,
                  fx_exposure: 12.3,
                  market_risk: 6.8,
                }}
              />
            </div>

            {/* Early Warning Indicators */}
            <Card className="border-amber-500/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  Early Warning Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  <span className="text-sm">NPL ratio trending upward (4.2% → 4.5%)</span>
                  <Badge variant="secondary">Monitoring</Badge>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3">
                  <span className="text-sm">Liquidity coverage below threshold</span>
                  <Badge variant="secondary">Action Required</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Individual Deposits</p>
                    <p className="mt-2 text-3xl font-semibold font-mono">$45.2M</p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+8.5% vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Corporate Deposits</p>
                    <p className="mt-2 text-3xl font-semibold font-mono">$32.8M</p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+5.2% vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Deposits</p>
                    <p className="mt-2 text-3xl font-semibold font-mono">$78.0M</p>
                    <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>+7.1% vs last month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Deposit Classification</CardTitle>
                <CardDescription>Breakdown by account type and currency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-3 text-sm font-medium">By Account Type</h4>
                    <div className="space-y-2">
                      {[
                        { type: "Savings", amount: 35500000, percentage: 45.5 },
                        { type: "Current", amount: 28600000, percentage: 36.7 },
                        { type: "Fixed Deposit", amount: 13900000, percentage: 17.8 },
                      ].map((item) => (
                        <div key={item.type} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                            <span className="text-sm">{item.type}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-mono">${(item.amount / 1000000).toFixed(1)}M</span>
                            <span className="text-sm text-muted-foreground w-12 text-right">{item.percentage}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exposure" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Coverage Calculations</CardTitle>
                <CardDescription>Insured deposit exposure based on current cover level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                    <span className="font-medium">Cover Level</span>
                    <span className="text-2xl font-bold font-mono">$5,000</span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Individual Exposure</p>
                      <p className="mt-2 text-2xl font-semibold font-mono">$12.3M</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Corporate Exposure</p>
                      <p className="mt-2 text-2xl font-semibold font-mono">$8.7M</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Total Exposure</p>
                      <p className="mt-2 text-2xl font-semibold font-mono">$21.0M</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
