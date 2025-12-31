import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Route, Switch, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserRoleProvider } from "./contexts/UserRoleContext";
import { Analytics } from "@vercel/analytics/react";
import AppLayout from "./components/AppLayout";
import { NotificationProvider } from "./components/NotificationProvider";

// Lazy load non-critical UI components that aren't needed for initial render
const HeyGenTour = lazy(() => import("./components/Onboarding/HeyGenTour").then(m => ({ default: m.HeyGenTour })));
const AvatarAssistant = lazy(() => import("./components/AIHelper/AvatarAssistant").then(m => ({ default: m.AvatarAssistant })));
const HelpWidget = lazy(() => import("./components/HelpDesk/HelpWidget").then(m => ({ default: m.HelpWidget })));

// Lazy load all pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const FeedstockDetail = lazy(() => import("@/pages/FeedstockDetail"));
const FeedstockEdit = lazy(() => import("@/pages/FeedstockEdit"));
const Browse = lazy(() => import("./pages/Browse"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SupplierRegistration = lazy(() => import("./pages/SupplierRegistration"));
const BuyerRegistration = lazy(() => import("./pages/BuyerRegistration"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const FeedstockCreate = lazy(() => import("./pages/FeedstockCreate"));
const SendInquiry = lazy(() => import("./pages/SendInquiry"));
const MapView = lazy(() => import("./pages/MapView"));
const CertificateUpload = lazy(() => import("./pages/CertificateUpload"));
const SupplierInquiries = lazy(() => import("./pages/SupplierInquiries"));
const BuyerInquiries = lazy(() => import("./pages/BuyerInquiries"));
const SupplierFeedstocks = lazy(() => import("./pages/SupplierFeedstocks"));
const BankabilityDashboard = lazy(() => import("./pages/BankabilityDashboard"));
const SavedSearches = lazy(() => import("./pages/SavedSearches"));
const SupplierProfile = lazy(() => import("@/pages/SupplierProfile"));
const SupplierPublicProfile = lazy(
  () => import("@/pages/SupplierPublicProfile"),
);
const BuyerProfile = lazy(() => import("@/pages/BuyerProfile"));
const Notifications = lazy(() => import("./pages/Notifications"));
const QualityTestUpload = lazy(() => import("./pages/QualityTestUpload"));
const SupplyAgreements = lazy(() => import("./pages/SupplyAgreements"));
const InquiryResponse = lazy(() => import("./pages/InquiryResponse"));
const GrowerQualification = lazy(() => import("./pages/GrowerQualification"));
const BankabilityAssessment = lazy(() => import("./pages/BankabilityAssessment"));
const LenderPortal = lazy(() => import("./pages/LenderPortal"));
const LenderPortfolioOverview = lazy(() => import("./pages/LenderPortfolioOverview"));
const LenderRiskAnalytics = lazy(() => import("./pages/LenderRiskAnalytics"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const GrantVerification = lazy(() => import("./pages/GrantVerification"));
const ARENACEFCDashboard = lazy(() => import("./pages/ARENACEFCDashboard"));
const ABARESLandUse = lazy(() => import("./pages/ABARESLandUse"));
const BOMWeatherDashboard = lazy(() => import("./pages/BOMWeatherDashboard"));
const EvidenceManagement = lazy(() => import("./pages/EvidenceManagement"));
const EvidenceVaultDashboard = lazy(() => import("./pages/EvidenceVaultDashboard"));
const SupplyChainDashboard = lazy(() => import("./pages/SupplyChainDashboard"));
const EmissionsCalculator = lazy(() => import("./pages/EmissionsCalculator"));
const CredentialsDashboard = lazy(() => import("./pages/CredentialsDashboard"));
const GOSchemeDashboard = lazy(() => import("./pages/GOSchemeDashboard"));
const FeedstockMap = lazy(() => import("./pages/FeedstockMap"));
const AustralianDataExplorer = lazy(() => import("./pages/AustralianDataExplorer"));
const DevLogin = lazy(() => import("./pages/DevLogin"));
const MyGovIdLogin = lazy(() => import("./pages/MyGovIdLogin"));
const ProducerRegistration = lazy(() => import("./pages/ProducerRegistration"));
const ProducerAccountSetup = lazy(() => import("./pages/ProducerAccountSetup"));
const ProducerPropertyMap = lazy(() => import("./pages/ProducerPropertyMap"));
const ProducerPropertyDetails = lazy(
  () => import("./pages/ProducerPropertyDetails"),
);
const ProducerProductionProfile = lazy(
  () => import("./pages/ProducerProductionProfile"),
);
const ProducerCarbonCalculator = lazy(
  () => import("./pages/ProducerCarbonCalculator"),
);
const ProducerContracts = lazy(() => import("./pages/ProducerContracts"));
const ProducerMarketplaceListing = lazy(
  () => import("./pages/ProducerMarketplaceListing"),
);
const ProducerReview = lazy(() => import("./pages/ProducerReview"));
const FinancialOnboarding = lazy(() => import("./pages/FinancialOnboarding"));
const BankabilityExplainer = lazy(
  () => import("./pages/BankabilityExplainer"),
);
const GrowerBenefits = lazy(() => import("./pages/GrowerBenefits"));
const ProjectRegistration = lazy(() => import("./pages/ProjectRegistration"));
const ProjectRegistrationFlow = lazy(
  () => import("./pages/ProjectRegistrationFlow"),
);
const ProjectRegistrationSuccess = lazy(
  () => import("./pages/ProjectRegistrationSuccess"),
);
const CertificateVerification = lazy(
  () => import("./pages/CertificateVerification"),
);
const ProducerRegistrationSuccess = lazy(
  () => import("./pages/ProducerRegistrationSuccess"),
);
const FinancialOnboardingSuccess = lazy(
  () => import("./pages/FinancialOnboardingSuccess"),
);
const AdminAssessorWorkflow = lazy(
  () => import("@/pages/AdminAssessorWorkflow"),
);
const AdminUserManagement = lazy(() => import("@/pages/AdminUserManagement"));
const AdminRSIE = lazy(() => import("@/pages/AdminRSIE"));
const MonitoringJobsScheduler = lazy(
  () => import("./pages/MonitoringJobsScheduler"),
);
const GrowerQualificationTiers = lazy(
  () => import("./pages/GrowerQualificationTiers"),
);
const ConcentrationAnalysis = lazy(
  () => import("./pages/ConcentrationAnalysis"),
);
const CreateDemandSignal = lazy(() => import("./pages/CreateDemandSignal"));
const BrowseDemandSignals = lazy(() => import("./pages/BrowseDemandSignals"));
const DemandSignalDetail = lazy(() => import("./pages/DemandSignalDetail"));
const SupplierFutures = lazy(() => import("./pages/SupplierFutures"));
const FuturesCreate = lazy(() => import("./pages/FuturesCreate"));
const FuturesDetailSupplier = lazy(
  () => import("./pages/FuturesDetailSupplier"),
);
const FuturesMarketplace = lazy(() => import("./pages/FuturesMarketplace"));
const FuturesDetailBuyer = lazy(() => import("./pages/FuturesDetailBuyer"));
const MyEOIs = lazy(() => import("./pages/MyEOIs"));
const ForGrowers = lazy(() => import("./pages/ForGrowers"));
const ForDevelopers = lazy(() => import("./pages/ForDevelopers"));
const ForLenders = lazy(() => import("./pages/ForLenders"));
const PlatformFeatures = lazy(() => import("./pages/PlatformFeatures"));
const Explainers = lazy(() => import("./pages/Explainers"));
const StressTesting = lazy(() => import("./pages/StressTesting"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));
const PlatformHealth = lazy(() => import("./pages/PlatformHealth"));
const ProcurementScenarios = lazy(() => import("./pages/ProcurementScenarios"));
const LendingSentimentDashboard = lazy(() => import("./pages/LendingSentimentDashboard"));
const FeedstockPriceDashboard = lazy(() => import("./pages/FeedstockPriceDashboard"));
const PolicyCarbonDashboard = lazy(() => import("./pages/PolicyCarbonDashboard"));
const StealthDiscovery = lazy(() => import("./pages/StealthDiscovery"));
const MarketIntelligence = lazy(() => import("./pages/MarketIntelligence"));

// Bankability Rating Framework v3.0
const BankabilityRatings = lazy(() => import("./pages/BankabilityRatings"));
const ProjectRatingsMatrix = lazy(() => import("./pages/ProjectRatingsMatrix"));
const ProjectRatingDetail = lazy(() => import("./pages/ProjectRatingDetail"));
const CarbonIntensityAnalysis = lazy(() => import("./pages/CarbonIntensityAnalysis"));

// New navigation architecture
const Landing = lazy(() => import("./pages/Landing"));
const Explore = lazy(() => import("./pages/Explore"));
const SimplifiedDashboard = lazy(() => import("./components/dashboard/SimplifiedDashboard").then(m => ({ default: m.SimplifiedDashboard })));
const UnifiedDashboard = lazy(() => import("./pages/UnifiedDashboard"));
const UnifiedMapPage = lazy(() => import("./pages/UnifiedMapPage"));
const GrowerDashboard = lazy(() => import("./pages/GrowerDashboard"));
const GrowerSettings = lazy(() => import("./pages/GrowerSettings"));
const DeveloperDashboard = lazy(() => import("./pages/DeveloperDashboard"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard"));

// Phase 2 Features
const PriceDashboard = lazy(() => import("./pages/PriceDashboard"));
const SupplierDirectory = lazy(() => import("./pages/SupplierDirectory"));
const QuoteRequest = lazy(() => import("./pages/QuoteRequest"));
const Changelog = lazy(() => import("./pages/Changelog"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <div className="space-y-3 pt-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
        {/* ============================================= */}
        {/* CONSOLIDATED NAVIGATION ARCHITECTURE         */}
        {/* ============================================= */}

        {/* Core Routes */}
        <Route path="/" component={Landing} />
        <Route path="/explore" component={Explore} />
        <Route path="/welcome" component={SimplifiedDashboard} />
        <Route path="/unified" component={UnifiedDashboard} />

        {/* Unified Map - Primary map experience */}
        <Route path="/map" component={UnifiedMapPage} />
        <Route path="/unified-map" component={UnifiedMapPage} />

        {/* Legacy map routes -> redirect to unified map */}
        <Route path="/feedstock-map">
          <Redirect to="/map" />
        </Route>
        <Route path="/market-intelligence">
          <Redirect to="/map" />
        </Route>
        <Route path="/australian-data">
          <Redirect to="/map" />
        </Route>

        {/* Role-specific dashboards (will be deprecated - redirect to unified) */}
        <Route path="/grower/dashboard" component={GrowerDashboard} />
        <Route path="/grower/settings" component={GrowerSettings} />
        <Route path="/developer/dashboard" component={DeveloperDashboard} />
        <Route path="/finance/dashboard" component={FinanceDashboard} />

        {/* Phase 2 Features */}
        <Route path="/price-dashboard" component={PriceDashboard} />
        <Route path="/supplier-directory" component={SupplierDirectory} />
        <Route path="/quote-request" component={QuoteRequest} />
        <Route path="/changelog" component={Changelog} />

        {/* Legacy home route -> redirect to landing */}
        <Route path="/home">
          <Redirect to="/" />
        </Route>
        <Route path="/financial-onboarding" component={FinancialOnboarding} />
        <Route
          path="/financial-onboarding/success"
          component={FinancialOnboardingSuccess}
        />
        <Route path="/bankability-explainer" component={BankabilityExplainer} />
        <Route path="/explainers" component={Explainers} />
        {/* grower-benefits redirected to for-growers above */}
        <Route path="/project-registration" component={ProjectRegistration} />
        <Route
          path="/project-registration/flow"
          component={ProjectRegistrationFlow}
        />
        <Route
          path="/project-registration/success"
          component={ProjectRegistrationSuccess}
        />
        <Route
          path="/certificate-verification"
          component={CertificateVerification}
        />
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
        <Route path="/suppliers/:id" component={SupplierPublicProfile} />
        <Route path="/buyer/profile" component={BuyerProfile} />
        <Route path="/notifications" component={Notifications} />
        <Route path="/quality-test/upload" component={QualityTestUpload} />
        <Route
          path="/dashboard/projects/:projectId/agreements"
          component={SupplyAgreements}
        />
        <Route
          path="/inquiries/respond/:inquiryId"
          component={InquiryResponse}
        />
        <Route
          path="/bankability/qualify/:supplierId"
          component={GrowerQualification}
        />
        <Route
          path="/bankability/assess/:projectId"
          component={BankabilityAssessment}
        />
        <Route path="/lender-portal" component={LenderPortal} />
        <Route path="/lender/portfolio" component={LenderPortfolioOverview} />
        <Route path="/lender/risk-analytics" component={LenderRiskAnalytics} />
        <Route path="/stress-testing" component={StressTesting} />
        <Route path="/admin/audit-logs" component={AdminAuditLogs} />
        <Route path="/platform-health" component={PlatformHealth} />
        <Route path="/procurement-scenarios" component={ProcurementScenarios} />
        <Route path="/lending-sentiment" component={LendingSentimentDashboard} />
        <Route path="/feedstock-prices" component={FeedstockPriceDashboard} />
        <Route path="/policy-carbon" component={PolicyCarbonDashboard} />
        <Route path="/stealth-discovery" component={StealthDiscovery} />
        <Route path="/market-intelligence" component={MarketIntelligence} />

        {/* Bankability Rating Framework v3.0 */}
        <Route path="/ratings" component={BankabilityRatings} />
        <Route path="/ratings/projects" component={ProjectRatingsMatrix} />
        <Route path="/ratings/project/:id" component={ProjectRatingDetail} />
        <Route path="/ratings/carbon-intensity" component={CarbonIntensityAnalysis} />

        <Route path="/compliance-dashboard" component={ComplianceDashboard} />
        <Route path="/grant-verification" component={GrantVerification} />
        <Route path="/arena-cefc" component={ARENACEFCDashboard} />
        <Route path="/abares-land-use" component={ABARESLandUse} />
        <Route path="/bom-weather" component={BOMWeatherDashboard} />
        <Route path="/admin/evidence" component={EvidenceManagement} />
        <Route path="/evidence-vault" component={EvidenceVaultDashboard} />
        <Route path="/supply-chain" component={SupplyChainDashboard} />
        <Route path="/emissions" component={EmissionsCalculator} />
        <Route path="/credentials" component={CredentialsDashboard} />
        <Route path="/go-scheme" component={GOSchemeDashboard} />
        <Route
          path="/admin/assessor-workflow"
          component={AdminAssessorWorkflow}
        />
        <Route path="/admin/users" component={AdminUserManagement} />
        <Route path="/admin/rsie" component={AdminRSIE} />
        <Route
          path="/admin/monitoring-jobs"
          component={MonitoringJobsScheduler}
        />
        <Route
          path="/bankability/concentration/:projectId"
          component={ConcentrationAnalysis}
        />
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
        {/* Merge grower-benefits into for-growers */}
        <Route path="/grower-benefits">
          <Redirect to="/for-growers" />
        </Route>
        <Route path="/grower-qualification" component={GrowerQualificationTiers} />
        <Route path="/for-developers" component={ForDevelopers} />
        <Route path="/for-lenders" component={ForLenders} />
        <Route path="/platform-features" component={PlatformFeatures} />
        {/* Map routes consolidated above - legacy components kept for reference */}
        {/* Authentication - consolidated */}
        <Route path="/login" component={DevLogin} />
        <Route path="/dev-login">
          <Redirect to="/login" />
        </Route>
        <Route path="/mygovid-login" component={MyGovIdLogin} />
        <Route path="/producer-registration" component={ProducerRegistration} />
        <Route
          path="/producer-registration/account-setup"
          component={ProducerAccountSetup}
        />
        <Route
          path="/producer-registration/property-map"
          component={ProducerPropertyMap}
        />
        <Route
          path="/producer-registration/property-details"
          component={ProducerPropertyDetails}
        />
        <Route
          path="/producer-registration/production-profile"
          component={ProducerProductionProfile}
        />
        <Route
          path="/producer-registration/carbon-calculator"
          component={ProducerCarbonCalculator}
        />
        <Route
          path="/producer-registration/contracts"
          component={ProducerContracts}
        />
        <Route
          path="/producer-registration/marketplace-listing"
          component={ProducerMarketplaceListing}
        />
        <Route path="/producer-registration/review" component={ProducerReview} />
        <Route
          path="/producer-registration/success"
          component={ProducerRegistrationSuccess}
        />
        <Route path="/certificate/upload" component={CertificateUpload} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <UserRoleProvider>
          <TooltipProvider>
            <Toaster />
            <NotificationProvider />
            <Router />
            {/* Lazy load non-critical overlays - they load after main content */}
            <Suspense fallback={null}>
              <HeyGenTour />
              <AvatarAssistant />
              <HelpWidget />
            </Suspense>
            <Analytics />
          </TooltipProvider>
        </UserRoleProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
