import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FeedstockDetail from "@/pages/FeedstockDetail";
import FeedstockEdit from "@/pages/FeedstockEdit";
import Browse from "./pages/Browse";
import Dashboard from "./pages/Dashboard";
import SupplierRegistration from "./pages/SupplierRegistration";
import BuyerRegistration from "./pages/BuyerRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import FeedstockCreate from "./pages/FeedstockCreate";
import SendInquiry from "./pages/SendInquiry";
import MapView from "./pages/MapView";
import CertificateUpload from "./pages/CertificateUpload";
import SupplierInquiries from "./pages/SupplierInquiries";
import BuyerInquiries from "./pages/BuyerInquiries";
import SupplierFeedstocks from "./pages/SupplierFeedstocks";
import BankabilityDashboard from "./pages/BankabilityDashboard";
import SavedSearches from "./pages/SavedSearches";
import SupplierProfile from "@/pages/SupplierProfile";
import BuyerProfile from "@/pages/BuyerProfile";
import Notifications from "./pages/Notifications";
import QualityTestUpload from "./pages/QualityTestUpload";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/feedstock/:id" component={FeedstockDetail} />
      <Route path="/feedstock/edit/:id" component={FeedstockEdit} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/supplier/register" component={SupplierRegistration} />
      <Route path="/buyer/register" component={BuyerRegistration} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/feedstock/create" component={FeedstockCreate} />
      <Route path="/inquiry/send" component={SendInquiry} />
      <Route path="/inquiries/supplier" component={SupplierInquiries} />
      <Route path="/inquiries/buyer" component={BuyerInquiries} />
      <Route path="/supplier/feedstocks" component={SupplierFeedstocks} />
      <Route path="/bankability" component={BankabilityDashboard} />
      <Route path="/saved-searches" component={SavedSearches} />
      <Route path="/supplier/profile" component={SupplierProfile} />
      <Route path="/buyer/profile" component={BuyerProfile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/quality-test/upload" component={QualityTestUpload} />
      <Route path="/map" component={MapView} />
      <Route path="/certificate/upload" component={CertificateUpload} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
