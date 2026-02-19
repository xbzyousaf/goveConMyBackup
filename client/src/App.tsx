import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/Dashboard";
import Assessment from "@/pages/Assessment";
import ProcessGuidance from "@/pages/ProcessGuidance";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorSignup from "@/pages/VendorSignup";
import Vendors from "@/pages/Vendors";
import VendorDetail from "@/pages/VendorDetail";
import Marketplace from "@/pages/Marketplace";
import Services from "@/pages/Services";
import Search from "@/pages/Search";
import Landing from "@/pages/Landing";
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import VerifyEmail from "@/pages/VerifyEmail";
import NotFound from "@/pages/not-found";
import SkipAssessment from "@/pages/SkipAssessment";
import AdminDashboard from "./pages/admin/AdminDashboard";
import VendorProfileEditPage from "./pages/vendor/VendorProfileEditPage";
import Onboarding from "./pages/Onboarding";
import VendorOnboarding from "./pages/VendorOnboarding";
import CreateService from "./pages/services/create";
import RequestService from "./pages/RequestService";
import AdminVendors from "./pages/admin/AdminVendors";
import { MessageProvider, useMessages } from "./components/ui/MessageContext";
import ServiceMessages from "./pages/ServiceMessages";
import ServiceDetails from "./pages/ServiceDetails";
import ContractorDetail from "./pages/ContractorDetail";
import RequestDetails from "./pages/vendor/RequestDetails";
import AdminRequestLogs from "./pages/admin/AdminRequestLogs";
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
function GlobalMessages() {
  const { isOpen, closeMessages, selectedConversationId } = useMessages();

  if (!isOpen) return null;

  return (
    <ServiceMessages
      open={true}
      onClose={closeMessages}
      serviceRequestId={selectedConversationId ?? undefined}
      fullScreen
    />
  );
}



function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Switch>
      {/* Public routes (always accessible) */}
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/verify-email" component={VerifyEmail} />

      {isAuthenticated ? (
        <>
          {/* Protected routes - only when authenticated */}
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/assessment" component={Assessment} />
          <Route path="/process/:processId" component={ProcessGuidance} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/services" component={Services} />
          <Route path="/search" component={Search} />
          <Route path="/vendor-dashboard" component={VendorDashboard} />
          <Route path="/vendor-signup" component={VendorSignup} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/vendor/:id" component={VendorDetail} />
          <Route path="/contractor/:id" component={ContractorDetail} />
          <Route path="/skip-assessment" component={SkipAssessment} />
          <Route path="/admin-dashboard" component={AdminDashboard} />
          <Route path="/service/create" component={CreateService} />
          <Route path="/admin/vendors" component={AdminVendors} />
          <Route path="/admin/escrow" component={AdminVendors} />
          <Route path="/vendor-profile/edit" component={VendorProfileEditPage} />
          <Route path="/onboarding" component={Onboarding} />
          <Route path="/vendor-onboarding" component={VendorOnboarding} />
          <Route path="/request" component={RequestService} />
          <Route path="/services/:serviceId" component={ServiceDetails} />
          <Route path="/vendor/requests/:id" component={RequestDetails} />
          <Route path="/admin/request-logs" component={AdminRequestLogs} />
          <Route component={NotFound} />
        </>
      ) : (
        <>
          {/* Unauthenticated routes - redirect all to Landing */}
          <Route path="/" component={Landing} />
          <Route path="/:rest*" component={Landing} />
        </>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />

        <MessageProvider> 
          <Router />
          <GlobalMessages />
        </MessageProvider>

      </TooltipProvider>
    </QueryClientProvider>
  );
}


export default App;
