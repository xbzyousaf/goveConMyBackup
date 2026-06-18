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
import AddPortfolio from "./pages/vendor/AddPortfolio";
import AddCertificate from "./pages/vendor/AddCertificate";
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
import AdminDisputes from "./pages/admin/AdminDisputes";

import VendorPayments from "./pages/vendor/payments";
import Transactions from "./pages/admin/Transactions";
import AdminServices from "./pages/admin/AdminServices";
import CreateMilestone from "./pages/admin/Checklist";
import Checkout from "./pages/checkout";
import AdminMilestones from "./pages/admin/AdminMilestones";
import BillingPage from "./pages/Billing";
import StripePayoutTab from "./pages/vendor/WalletPage";
import AdminVendorImports from "./pages/admin/AdminVendorImports";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import AdminCategories from "./pages/admin/AdminCategories";
import CategoryForm from "./pages/admin/CategoryForm";
import ServiceVendors from "./pages/admin/ServiceVendors";
import CategoryVendors from "./pages/admin/CategoryVendors";
import AdminPlatformFees from "./pages/admin/AdminPlatformFees";
import PlatformFeeForm from "./pages/admin/PlatformFeeForm";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateSupportTicket from "./pages/CreateSupportTicket";
import SupportTicketsPage from "./pages/SupportTicketsPage";
import { VendorProfileForm } from "./components/VendorProfileForm";
import Profile from "./pages/Profile";
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
      {/* <Route path="/login" component={Login} /> */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/forgot-password" component={ForgotPassword}/>
      <Route path="/reset-password" component={ResetPassword}/>

      {isAuthenticated ? (
        <>
          {/* Protected routes - only when authenticated */}
          <Route path="/">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/profile">
            <ProtectedRoute allowedRoles={["contractor", "vendor"]}>
              <Profile />
            </ProtectedRoute>
          </Route>
          <Route path="/support/create" component={CreateSupportTicket} />
          <Route path="/support" component={SupportTicketsPage} />

          <Route path="/dashboard">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/assessment">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Assessment />
            </ProtectedRoute>
          </Route>
          <Route path="/process/:processId">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <ProcessGuidance />
            </ProtectedRoute>
          </Route>
          <Route path="/marketplace">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Marketplace />
            </ProtectedRoute>
          </Route>
          <Route path="/onboarding">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Onboarding />
            </ProtectedRoute>
          </Route>

          <Route path="/vendors">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Vendors />
            </ProtectedRoute>
          </Route>
          <Route path="/billing">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <BillingPage />
            </ProtectedRoute>
          </Route>
          <Route path="/vendor/:id">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <VendorDetail />
            </ProtectedRoute>
          </Route>
          <Route path="/services/:serviceId">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <ServiceDetails />
            </ProtectedRoute>
          </Route>
          <Route path="/services/:serviceId/vendors">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <ServiceVendors />
            </ProtectedRoute>
          </Route>
          <Route path="/categories/all/vendors">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <CategoryVendors />
            </ProtectedRoute>
          </Route>
          <Route path="/categories/:categoryId/vendors">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <CategoryVendors />
            </ProtectedRoute>
          </Route>
          
          <Route path="/skip-assessment">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <SkipAssessment />
            </ProtectedRoute>
          </Route>
          <Route path="/request">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <RequestService />
            </ProtectedRoute>
          </Route>
          <Route path="/checkout">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <Checkout />
            </ProtectedRoute>
          </Route>


          {/* admin routes */}
           <Route path="/admin-dashboard">
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          </Route>
           <Route path="/admin/edit-categories/:id">
            <ProtectedRoute allowedRoles={["admin"]}>
              <CategoryForm />
            </ProtectedRoute>
          </Route>
           <Route path="/admin/edit-milestones/:id">
            <ProtectedRoute allowedRoles={["admin"]}>
              <CreateMilestone />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/edit-platform-fee/:id">
            <ProtectedRoute allowedRoles={["admin"]}>
              <PlatformFeeForm />
            </ProtectedRoute>
          </Route>
          <Route path="/admin/:rest*">
            <ProtectedRoute allowedRoles={["admin"]}>
              <Switch>
                <Route path="/admin/vendors" component={AdminVendors} />
                <Route path="/admin/services" component={AdminServices} />
                <Route path="/admin/disputes" component={AdminDisputes} />
                <Route path="/admin/transactions" component={Transactions} />
                <Route path="/admin/checklist" component={AdminMilestones} />
                <Route path="/admin/create-milestones" component={CreateMilestone} />
                <Route path="/admin/vendor-imports" component={AdminVendorImports} />
                <Route path="/admin/request-logs" component={AdminRequestLogs} />
                
                <Route path="/admin/create-categories" component={CategoryForm} />
                <Route path="/admin/categories" component={AdminCategories} />
                <Route path="/admin/platform-fees" component={AdminPlatformFees} />
              </Switch>
            </ProtectedRoute>
          </Route>

          {/* vendor only routes */}
          <Route path="/services">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <Services />
            </ProtectedRoute>
          </Route>
          <Route path="/user/:userId/change-password">
            <ProtectedRoute allowedRoles={["vendor", "contractor"]}>
              <ChangePassword />
            </ProtectedRoute>
          </Route>
          <Route path="/contractor/profile/create">
            <ProtectedRoute allowedRoles={["vendor", "contractor"]}>
              <VendorProfileForm />
            </ProtectedRoute>
          </Route>
          <Route path="/vendor-dashboard">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorDashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/vendor/profile/edit">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorProfileEditPage />
            </ProtectedRoute>
          </Route>
          <Route path="/contractor/profile/edit">
            <ProtectedRoute allowedRoles={["contractor"]}>
              <VendorProfileEditPage />
            </ProtectedRoute>
          </Route>
          <Route path="/vendor/:id/add-portfolio">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <AddPortfolio />
            </ProtectedRoute>
          </Route>

          <Route path="/vendor/:id/add-certificate">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <AddCertificate />
            </ProtectedRoute>
          </Route>

          <Route path="/vendor-onboarding">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <VendorOnboarding />
            </ProtectedRoute>
          </Route>
          <Route path="/contractor/:id">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <ContractorDetail />
            </ProtectedRoute>
          </Route>
         
          <Route path="/service/create">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <CreateService />
            </ProtectedRoute>
          </Route>
          <Route path="/service/create/:id">
            <ProtectedRoute allowedRoles={["vendor"]}>
              <CreateService />
            </ProtectedRoute>
          </Route>

          
          {/* mix routes */}
          <Route path="/vendor/requests/:id" component={RequestDetails} />
          <Route path="/vendors/payment" component={VendorPayments} />
          <Route path="/vendor/payouts" component={StripePayoutTab} />
          <Route path="/search" component={Search} />
          <Route path="/vendor-signup" component={VendorSignup} />
          
          
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
