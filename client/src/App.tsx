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
import SupplyAgreements from "./pages/SupplyAgreements";
import InquiryResponse from "./pages/InquiryResponse";
import GrowerQualification from "./pages/GrowerQualification";
import BankabilityAssessment from "./pages/BankabilityAssessment";
import LenderPortal from "./pages/LenderPortal";
import ComplianceDashboard from "./pages/ComplianceDashboard";
import EvidenceManagement from "./pages/EvidenceManagement";
import FeedstockMap from "./pages/FeedstockMap";
import ProducerRegistration from "./pages/ProducerRegistration";
import ProducerAccountSetup from "./pages/ProducerAccountSetup";
import ProducerPropertyMap from "./pages/ProducerPropertyMap";
import ProducerPropertyDetails from "./pages/ProducerPropertyDetails";
import ProducerProductionProfile from "./pages/ProducerProductionProfile";
import ProducerCarbonCalculator from "./pages/ProducerCarbonCalculator";
import ProducerContracts from "./pages/ProducerContracts";
import ProducerMarketplaceListing from "./pages/ProducerMarketplaceListing";
import ProducerReview from "./pages/ProducerReview";
import FinancialOnboarding from "./pages/FinancialOnboarding";
import BankabilityExplainer from "./pages/BankabilityExplainer";
import GrowerBenefits from "./pages/GrowerBenefits";
import ProjectRegistration from "./pages/ProjectRegistration";
import ProjectRegistrationFlow from "./pages/ProjectRegistrationFlow";
import ProjectRegistrationSuccess from "./pages/ProjectRegistrationSuccess";
import CertificateVerification from "./pages/CertificateVerification";
import ProducerRegistrationSuccess from "./pages/ProducerRegistrationSuccess";
import FinancialOnboardingSuccess from "./pages/FinancialOnboardingSuccess";
import AdminAssessorWorkflow from "@/pages/AdminAssessorWorkflow";
import AdminUserManagement from "@/pages/AdminUserManagement";
import MonitoringJobsScheduler from "./pages/MonitoringJobsScheduler";
import ConcentrationAnalysis from "./pages/ConcentrationAnalysis";
import CreateDemandSignal from "./pages/CreateDemandSignal";
import BrowseDemandSignals from "./pages/BrowseDemandSignals";
import DemandSignalDetail from "./pages/DemandSignalDetail";
import SupplierFutures from "./pages/SupplierFutures";
import FuturesCreate from "./pages/FuturesCreate";
import FuturesDetailSupplier from "./pages/FuturesDetailSupplier";
import FuturesMarketplace from "./pages/FuturesMarketplace";
import FuturesDetailBuyer from "./pages/FuturesDetailBuyer";
import MyEOIs from "./pages/MyEOIs";
import ForGrowers from "./pages/ForGrowers";
import ForDevelopers from "./pages/ForDevelopers";
import ForLenders from "./pages/ForLenders";
import PlatformFeatures from "./pages/PlatformFeatures";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/financial-onboarding" component={FinancialOnboarding} />
      <Route path="/financial-onboarding/success" component={FinancialOnboardingSuccess} />
      <Route path="/bankability-explainer" component={BankabilityExplainer} />
      <Route path="/grower-benefits" component={GrowerBenefits} />
      <Route path="/project-registration" component={ProjectRegistration} />
            <Route path="/project-registration/flow" component={ProjectRegistrationFlow} />
          <Route path="/project-registration/success" component={ProjectRegistrationSuccess} />
          <Route path="/certificate-verification" component={CertificateVerification} />
      <Route path="/browse" component={Browse} />
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
      <Route path="/dashboard/projects/:projectId/agreements" component={SupplyAgreements} />
      <Route path="/inquiries/respond/:inquiryId" component={InquiryResponse} />
      <Route path="/bankability/qualify/:supplierId" component={GrowerQualification} />
      <Route path="/bankability/assess/:projectId" component={BankabilityAssessment} />
      <Route path="/lender-portal" component={LenderPortal} />
      <Route path="/compliance-dashboard" component={ComplianceDashboard} />
      <Route path="/admin/evidence" component={EvidenceManagement} />
          <Route path="/admin/assessor-workflow" component={AdminAssessorWorkflow} />
          <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/monitoring-jobs" component={MonitoringJobsScheduler} />
      <Route path="/bankability/concentration/:projectId" component={ConcentrationAnalysis} />
      <Route path="/demand-signals/create" component={CreateDemandSignal} />
      <Route path="/demand-signals" component={BrowseDemandSignals} />
      <Route path="/demand-signals/:id" component={DemandSignalDetail} />
      <Route path="/supplier/futures" component={SupplierFutures} />
      <Route path="/supplier/futures/create" component={FuturesCreate} />
      <Route path="/supplier/futures/:id" component={FuturesDetailSupplier} />
      <Route path="/futures" component={FuturesMarketplace} />
      <Route path="/futures/:id" component={FuturesDetailBuyer} />
      <Route path="/buyer/eois" component={MyEOIs} />
      <Route path="/for-growers" component={ForGrowers} />
      <Route path="/for-developers" component={ForDevelopers} />
      <Route path="/for-lenders" component={ForLenders} />
      <Route path="/platform-features" component={PlatformFeatures} />
      <Route path="/map" component={MapView} />
      <Route path="/feedstock-map" component={FeedstockMap} />
      <Route path="/producer-registration" component={ProducerRegistration} />
      <Route path="/producer-registration/account-setup" component={ProducerAccountSetup} />
      <Route path="/producer-registration/property-map" component={ProducerPropertyMap} />
      <Route path="/producer-registration/property-details" component={ProducerPropertyDetails} />
      <Route path="/producer-registration/production-profile" component={ProducerProductionProfile} />
      <Route path="/producer-registration/carbon-calculator" component={ProducerCarbonCalculator} />
      <Route path="/producer-registration/contracts" component={ProducerContracts} />
      <Route path="/producer-registration/marketplace-listing" component={ProducerMarketplaceListing} />
      <Route path="/producer-registration/review" component={ProducerReview} />
      <Route path="/producer-registration/success" component={ProducerRegistrationSuccess} />
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
