import { Building2, Shield, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Building2 className="h-12 w-12" />
            </div>
          </div>
          <h1 className="mb-4 text-4xl font-bold text-foreground md:text-5xl">
            Q-Sight Regulatory System
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Comprehensive deposit insurance management platform for the Deposit Protection Corporation Zimbabwe
          </p>
        </div>

        {/* Features */}
        <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-elevate">
            <CardContent className="p-6">
              <FileText className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Returns Management</h3>
              <p className="text-sm text-muted-foreground">
                Upload, validate, and manage deposit returns with automated penalty enforcement
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <BarChart3 className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Bank Surveillance</h3>
              <p className="text-sm text-muted-foreground">
                Monitor deposits, CAMELS ratings, and financial health indicators
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <Shield className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Risk Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive stress testing and risk scoring with early warning systems
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <FileText className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Premium Management</h3>
              <p className="text-sm text-muted-foreground">
                Automated premium calculations, invoicing, and payment reconciliation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <h2 className="mb-4 text-2xl font-semibold">Access the System</h2>
              <p className="mb-6 text-muted-foreground">
                Sign in with your authorized account to access the Q-Sight Regulatory System
              </p>
              <Button
                asChild
                size="lg"
                className="w-full"
                data-testid="button-login"
              >
                <a href="/api/login">
                  Sign In
                </a>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">
                Authorized personnel only • Secure access via institutional credentials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
