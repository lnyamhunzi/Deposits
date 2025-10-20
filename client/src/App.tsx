import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import ReturnsManagement from "@/pages/returns-management";
import BankSurveillance from "@/pages/bank-surveillance";
import RiskAnalysis from "@/pages/risk-analysis";
import PremiumsManagement from "@/pages/premiums-management";
import SingleCustomerView from "@/pages/single-customer-view";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show landing page for unauthenticated users
  if (isLoading || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated routes with sidebar layout
  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-8 py-6">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/returns" component={ReturnsManagement} />
              <Route path="/surveillance" component={BankSurveillance} />
              <Route path="/risk-analysis" component={RiskAnalysis} />
              <Route path="/premiums" component={PremiumsManagement} />
              <Route path="/customer-view" component={SingleCustomerView} />
              <Route path="/reports" component={Reports} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

export default function App() {
  // Custom sidebar width for regulatory application
  const style = {
    "--sidebar-width": "280px",
    "--sidebar-width-icon": "72px",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <Router />
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
