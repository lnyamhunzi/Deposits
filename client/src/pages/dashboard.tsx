import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalInstitutions: number;
  activeInstitutions: number;
  lockedInstitutions: number;
  totalDeposits: string;
  totalExposure: string;
  pendingReturns: number;
  overduePayments: number;
  criticalRiskInstitutions: number;
}

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  trend?: "up" | "down";
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-2 text-3xl font-semibold font-mono" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
              {value}
            </h3>
            {change && (
              <div className="mt-2 flex items-center gap-1 text-sm">
                {trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={trend === "up" ? "text-green-600" : "text-red-600"}>{change}</span>
              </div>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of the deposit protection system performance and key metrics
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Institutions"
          value={stats?.totalInstitutions || 0}
          icon={Building2}
        />
        <StatCard
          title="Total Deposits"
          value={`$${Number(stats?.totalDeposits || 0).toLocaleString()}`}
          change="+12.5% vs last month"
          trend="up"
          icon={DollarSign}
        />
        <StatCard
          title="Total Exposure"
          value={`$${Number(stats?.totalExposure || 0).toLocaleString()}`}
          icon={AlertTriangle}
        />
        <StatCard
          title="Critical Risk"
          value={stats?.criticalRiskInstitutions || 0}
          icon={AlertTriangle}
        />
      </div>

      {/* Alerts */}
      {(stats?.pendingReturns || stats?.overduePayments || stats?.lockedInstitutions) ? (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Attention Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.pendingReturns > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm">{stats.pendingReturns} pending returns awaiting validation</span>
                <Badge variant="secondary">{stats.pendingReturns}</Badge>
              </div>
            )}
            {stats?.overduePayments > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm">{stats.overduePayments} overdue premium payments</span>
                <Badge variant="destructive">{stats.overduePayments}</Badge>
              </div>
            )}
            {stats?.lockedInstitutions > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <span className="text-sm">{stats.lockedInstitutions} institutions locked due to non-compliance</span>
                <Badge variant="destructive">{stats.lockedInstitutions}</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Deposit Trends</CardTitle>
            <CardDescription>Monthly deposit values over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="deposits" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>Institutions by CAMELS composite rating</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rating: 1, label: "Strong", count: 0, color: "bg-camels-1" },
                { rating: 2, label: "Satisfactory", count: 0, color: "bg-camels-2" },
                { rating: 3, label: "Fair", count: 0, color: "bg-camels-3" },
                { rating: 4, label: "Marginal", count: 0, color: "bg-camels-4" },
                { rating: 5, label: "Unsatisfactory", count: 0, color: "bg-camels-5" },
              ].map((item) => (
                <div key={item.rating} className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm">{item.label}</span>
                  <span className="text-sm font-medium font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
