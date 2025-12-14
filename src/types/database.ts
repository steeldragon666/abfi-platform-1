// ABFI Platform Database Types
// These types mirror the Supabase database schema

export type UserRole = 'supplier' | 'buyer' | 'admin' | 'auditor';
export type VerificationStatus = 'pending' | 'verified' | 'suspended' | 'rejected';
export type SubscriptionTier = 'starter' | 'professional' | 'enterprise';
export type FeedstockStatus = 'draft' | 'pending_review' | 'active' | 'suspended' | 'archived';
export type VerificationLevel = 'self_declared' | 'document_verified' | 'third_party_audited' | 'abfi_certified';
export type InquiryStatus = 'pending' | 'responded' | 'negotiating' | 'accepted' | 'rejected' | 'closed' | 'expired';
export type TransactionStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'completed' | 'disputed' | 'cancelled';
export type CertificationType = 'ISCC_EU' | 'ISCC_PLUS' | 'RSB' | 'RED_II' | 'GO' | 'ABFI' | 'OTHER';
export type CertificationStatus = 'active' | 'expired' | 'revoked' | 'pending' | 'valid';
export type AustralianState = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';

export type FeedstockCategory =
  | 'oilseed'
  | 'UCO'
  | 'tallow'
  | 'lignocellulosic'
  | 'waste'
  | 'algae'
  | 'bamboo'
  | 'other';

export type ProductionMethod =
  | 'crop'
  | 'waste'
  | 'residue'
  | 'processing_byproduct';

// Profile extends Supabase auth.users
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  profile_id: string;
  abn: string | null;
  company_name: string;
  trading_name: string | null;
  supplier_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  verification_status: VerificationStatus;
  subscription_tier: SubscriptionTier;
  // Notifications
  notify_new_inquiry: boolean;
  notify_inquiry_response: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Buyer {
  id: string;
  profile_id: string;
  abn: string | null;
  company_name: string;
  trading_name: string | null;
  company_type: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;
  country: string | null;
  facility_latitude: number | null;
  facility_longitude: number | null;
  website: string | null;
  description: string | null;
  logo_url: string | null;
  verification_status: VerificationStatus;
  subscription_tier: SubscriptionTier;
  // Procurement preferences
  preferred_categories: FeedstockCategory[] | null;
  preferred_states: string[] | null;
  annual_volume_requirement: number | null;
  min_abfi_score: number | null;
  max_carbon_intensity: number | null;
  // Notifications
  notify_new_feedstock: boolean;
  notify_price_change: boolean;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Feedstock {
  id: string;
  feedstock_id: string; // ABFI-[TYPE]-[STATE]-[XXXXXX]
  supplier_id: string;
  category: FeedstockCategory;
  type: string | null;
  name: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  state: string;
  region: string | null;
  production_method: string | null;
  collection_method: string | null;
  storage_method: string | null;
  distance_to_port_km: number | null;
  annual_capacity_tonnes: number | null;
  available_volume_current: number | null;
  available_volume_annual: number | null;
  available_volume_forward: Record<string, number> | null;
  minimum_order_tonnes: number | null;
  lead_time_days: number | null;
  price_aud_per_tonne: number | null;
  price_indication: number | null;
  price_unit: string | null;
  delivery_options: string | null;

  // ABFI Scores (0-100)
  abfi_score: number | null;
  sustainability_score: number | null;
  carbon_intensity_score: number | null;
  quality_score: number | null;
  reliability_score: number | null;

  // Carbon Intensity
  carbon_intensity_value: number | null; // gCO2e/MJ
  carbon_intensity_rating: string | null;
  carbon_intensity_method: string | null;

  // Quality & Sustainability Data
  quality_parameters: Record<string, number> | null;
  sustainability_data: Record<string, boolean | string> | null;

  // Status
  status: FeedstockStatus;
  verification_level: VerificationLevel;

  // Stats
  view_count: number | null;
  inquiry_count: number | null;
  shortlist_count: number | null;

  // Metadata
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  last_verified_at: string | null;
  verified_by: string | null;

  // Relations (when joined)
  supplier?: Supplier;
  certificates?: Certificate[];
  quality_tests?: QualityTest[];
}

export interface Certificate {
  id: string;
  feedstock_id: string;
  type: CertificationType;
  certificate_number: string | null;
  issuing_body: string | null;
  issue_date: string | null;
  issued_date: string | null;
  expiry_date: string | null;
  status: string;
  document_url: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface QualityTest {
  id: string;
  feedstock_id: string;
  test_date: string | null;
  laboratory_name: string | null;
  laboratory: string | null;
  batch_reference: string | null;
  report_number: string | null;
  parameters: QualityParameter[];
  report_url: string | null;
  verification_status: string;
  created_at: string;
  updated_at: string;
}

export interface QualityParameter {
  name: string;
  value: number;
  unit: string;
  specification_min: number | null;
  specification_max: number | null;
  pass: boolean;
}

export interface Inquiry {
  id: string;
  inquiry_id: string;
  buyer_id: string;
  supplier_id: string;
  feedstock_id: string | null;
  subject: string | null;
  initial_message: string | null;
  message: string | null;
  volume_requested: number | null;
  volume_required: number | null;
  delivery_location: string | null;
  delivery_timeline: string | null;
  delivery_date_start: string | null;
  delivery_date_end: string | null;
  status: InquiryStatus;
  response: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;

  // Relations (when joined)
  buyer?: Buyer;
  supplier?: Supplier;
  feedstock?: Feedstock;
}

export interface Shortlist {
  id: string;
  buyer_id: string;
  feedstock_id: string;
  created_at: string;
  feedstock?: Feedstock;
}

export interface Transaction {
  id: string;
  feedstock_id: string;
  supplier_id: string;
  buyer_id: string;
  inquiry_id: string | null;
  volume_tonnes: number;
  price_per_tonne: number | null;
  total_value: number | null;
  delivery_date: string;
  delivery_address: string;
  status: TransactionStatus;
  quality_receipt_url: string | null;
  supplier_rating: number | null;
  supplier_feedback: string | null;
  buyer_rating: number | null;
  buyer_feedback: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Document {
  id: string;
  owner_id: string; // supplier_id or buyer_id
  owner_type: 'supplier' | 'buyer';
  feedstock_id: string | null;
  name: string;
  type: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'inquiry' | 'transaction' | 'certificate' | 'verification' | 'system';
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// Search & Filter Types
export interface FeedstockSearchParams {
  category?: FeedstockCategory;
  type?: string;
  state?: AustralianState;
  region?: string;
  min_abfi_score?: number;
  max_carbon_intensity?: number;
  min_volume?: number;
  certifications?: CertificationType[];
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  search?: string;
  sort_by?: 'abfi_score' | 'distance' | 'carbon_intensity' | 'volume' | 'created_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ABFI Score Calculation Types
export interface SustainabilityInputs {
  certification_type: CertificationType | null;
  no_deforestation_verified: boolean;
  no_hcv_land_conversion: boolean;
  no_peatland_drainage: boolean;
  indigenous_rights_compliance: boolean;
  fair_work_certified: boolean;
  community_benefit_documented: boolean;
  supply_chain_transparent: boolean;
  regenerative_practice_certified: boolean;
  soil_carbon_measured: boolean;
  biodiversity_corridor_maintained: boolean;
}

export interface QualityInputs {
  category: FeedstockCategory;
  parameters: Record<string, number>;
}

export interface ReliabilityInputs {
  delivery_performance: number; // % OTIF
  volume_consistency: number; // variance from contracted
  quality_consistency: number; // batch CoV
  response_time_hours: number;
  platform_months: number;
  transaction_count: number;
}

export interface AbfiScoreResult {
  abfi_score: number;
  sustainability_score: number;
  carbon_intensity_score: number;
  quality_score: number;
  reliability_score: number;
  breakdown: {
    sustainability: Record<string, number>;
    carbon: { value: number; rating: string };
    quality: Record<string, number>;
    reliability: Record<string, number>;
  };
}

// ============================================
// Carbon Intensity Reporting Types
// ============================================

export type CIMethodology = 'RED_II' | 'RTFO' | 'ISO_14064' | 'ISCC' | 'RSB';
export type CIDataQuality = 'default' | 'industry_average' | 'primary_measured';
export type CIReportStatus = 'draft' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'expired';
export type CIAuditAction = 'created' | 'updated' | 'submitted' | 'review_started' | 'approved' | 'rejected' | 'revision_requested' | 'expired';

export interface CarbonIntensityReport {
  id: string;
  report_id: string;
  feedstock_id: string;
  supplier_id: string;

  // Reporting Period
  reporting_period_start: string;
  reporting_period_end: string;
  reference_year: number;

  // Methodology
  methodology: CIMethodology;
  methodology_version: string | null;
  data_quality_level: CIDataQuality;

  // Scope 1 Emissions (Direct) - gCO2e/MJ
  scope1_cultivation: number;
  scope1_processing: number;
  scope1_transport: number;
  scope1_total: number;

  // Scope 2 Emissions (Indirect - Energy) - gCO2e/MJ
  scope2_electricity: number;
  scope2_steam_heat: number;
  scope2_total: number;

  // Scope 3 Emissions (Value Chain) - gCO2e/MJ
  scope3_upstream_inputs: number;
  scope3_land_use_change: number;
  scope3_distribution: number;
  scope3_end_of_life: number;
  scope3_total: number;

  // Totals & Ratings
  total_ci_value: number;
  ci_rating: string | null;
  ci_score: number | null;

  // Compliance Flags
  ghg_savings_percentage: number | null;
  red_ii_compliant: boolean;
  rtfo_compliant: boolean;
  cfp_compliant: boolean;
  iscc_compliant: boolean;
  rsb_compliant: boolean;

  // Uncertainty & Documentation
  uncertainty_range_low: number | null;
  uncertainty_range_high: number | null;
  calculation_notes: string | null;
  supporting_documents: CISupportingDocument[];

  // Status & Verification
  status: CIReportStatus;
  verification_level: VerificationLevel;
  assigned_auditor_id: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  auditor_notes: string | null;
  rejection_reason: string | null;
  expiry_date: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations (when joined)
  feedstock?: Feedstock;
  supplier?: Supplier;
  verifier?: Profile;
  assigned_auditor?: Profile;
  audit_logs?: CIAuditLog[];
}

export interface CISupportingDocument {
  name: string;
  url: string;
  type: string;
  uploaded_at?: string;
}

export interface CIAuditLog {
  id: string;
  report_id: string;
  user_id: string;
  action: CIAuditAction;
  previous_status: string | null;
  new_status: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;

  // Relations (when joined)
  user?: Profile;
}

// CI Report Creation/Update Input Types
export interface CIReportInput {
  feedstock_id: string;
  reporting_period_start: string;
  reporting_period_end: string;
  reference_year: number;
  methodology: CIMethodology;
  methodology_version?: string;
  data_quality_level: CIDataQuality;

  // Scope 1
  scope1_cultivation?: number;
  scope1_processing?: number;
  scope1_transport?: number;

  // Scope 2
  scope2_electricity?: number;
  scope2_steam_heat?: number;

  // Scope 3
  scope3_upstream_inputs?: number;
  scope3_land_use_change?: number;
  scope3_distribution?: number;
  scope3_end_of_life?: number;

  // Additional
  uncertainty_range_low?: number;
  uncertainty_range_high?: number;
  calculation_notes?: string;
  supporting_documents?: CISupportingDocument[];
}

// CI Search & Filter Types
export interface CIReportSearchParams {
  feedstock_id?: string;
  supplier_id?: string;
  methodology?: CIMethodology;
  status?: CIReportStatus;
  min_ci_value?: number;
  max_ci_value?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'total_ci_value' | 'ghg_savings_percentage' | 'reporting_period_start';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Emission Factor Types (for calculation engine)
export interface EmissionFactor {
  category: FeedstockCategory;
  methodology: CIMethodology;
  scope: 'scope1' | 'scope2' | 'scope3';
  component: string;
  default_value: number;
  unit: string;
  source: string;
  notes?: string;
}

export interface CICalculationResult {
  total_ci_value: number;
  ci_rating: string;
  ci_score: number;
  ghg_savings_percentage: number;
  scope1_total: number;
  scope2_total: number;
  scope3_total: number;
  red_ii_compliant: boolean;
  rtfo_compliant: boolean;
  cfp_compliant: boolean;
  iscc_compliant: boolean;
  rsb_compliant: boolean;
  uncertainty_range_low: number;
  uncertainty_range_high: number;
}

// Emission-only input for calculator (without metadata)
export interface CIEmissionInput {
  scope1_cultivation: number;
  scope1_processing: number;
  scope1_transport: number;
  scope2_electricity: number;
  scope2_steam_heat: number;
  scope3_upstream_inputs: number;
  scope3_land_use_change: number;
  scope3_distribution: number;
  scope3_end_of_life: number;
}
