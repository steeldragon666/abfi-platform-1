import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import FeedstockDetail from "./pages/FeedstockDetail";
import Browse from "./pages/Browse";
import Dashboard from "./pages/Dashboard";
import SupplierRegistration from "./pages/SupplierRegistration";
import BuyerRegistration from "./pages/BuyerRegistration";
import AdminDashboard from "./pages/AdminDashboard";
import FeedstockCreate from "./pages/FeedstockCreate";
import SendInquiry from "./pages/SendInquiry";
import MapView from "./pages/MapView";
import CertificateUpload from "./pages/CertificateUpload";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/feedstock/:id" component={FeedstockDetail} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/supplier/register" component={SupplierRegistration} />
      <Route path="/buyer/register" component={BuyerRegistration} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/feedstock/create" component={FeedstockCreate} />
      <Route path="/inquiry/send" component={SendInquiry} />
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
