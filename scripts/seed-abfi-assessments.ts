#!/usr/bin/env tsx

/**
 * ABFI Bankability Assessment Data Seeder
 * Seeds the 11 assessed projects from the technical report
 */

import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import fs from "fs";
import path from "path";

const assessmentData = {
  "assessment_metadata": {
    "date": "2025-01",
    "framework_version": "ABFI-5P-v1.0",
    "analyst": "ABFI Platform",
    "projects_assessed": 11,
    "scoring_methodology": {
      "pillars": [
        {"name": "volume_security", "weight": 0.20, "description": "Reliability of feedstock supply, contract terms, production capacity, weather/climate resilience"},
        {"name": "counterparty_quality", "weight": 0.20, "description": "Financial strength, track record, credit rating of all parties"},
        {"name": "contract_structure", "weight": 0.20, "description": "Binding agreements, offtake terms, duration, price mechanisms"},
        {"name": "concentration_risk", "weight": 0.20, "description": "Exposure to single points of failure (suppliers, buyers, geography)"},
        {"name": "operational_readiness", "weight": 0.20, "description": "Technology readiness, management capability, timeline to production"}
      ],
      "rating_scale": {
        "AA": {"min": 8.5, "max": 10.0, "tier": 1, "tier_label": "Investment Grade"},
        "A": {"min": 7.5, "max": 8.49, "tier": 1, "tier_label": "Investment Grade"},
        "BBB": {"min": 6.5, "max": 7.49, "tier": 1, "tier_label": "Bankable"},
        "BB": {"min": 5.5, "max": 6.49, "tier": 2, "tier_label": "Development Stage"},
        "B": {"min": 4.5, "max": 5.49, "tier": 2, "tier_label": "Development Stage"},
        "B-": {"min": 4.0, "max": 4.49, "tier": 3, "tier_label": "High Risk"},
        "CCC": {"min": 3.5, "max": 3.99, "tier": 3, "tier_label": "High Risk"},
        "CC": {"min": 2.5, "max": 3.49, "tier": 4, "tier_label": "Non-Investable"},
        "C": {"min": 1.5, "max": 2.49, "tier": 4, "tier_label": "Non-Investable"},
        "D": {"min": 0.0, "max": 1.49, "tier": 4, "tier_label": "Non-Investable"}
      }
    }
  },
  "tier_definitions": [
    {"tier": 1, "label": "Bankable", "min_score": 6.5, "description": "Suitable for conventional project finance"},
    {"tier": 2, "label": "Development Stage", "min_score": 5.0, "description": "Requires further development before bankability"},
    {"tier": 3, "label": "High Risk", "min_score": 3.5, "description": "Speculative; suitable only for venture/impact capital"},
    {"tier": 4, "label": "Non-Investable", "min_score": 0.0, "description": "Failed or fundamentally flawed projects"}
  ],
  "projects": [
    {
      "id": "ABFI-2025-001",
      "name": "Malabar Biomethane Injection Project",
      "short_name": "Malabar Biomethane",
      "status": "OPERATIONAL",
      "status_detail": "Operational since early 2023",
      "location": {
        "site": "Malabar",
        "state": "NSW",
        "coordinates": {"lat": -33.9631, "lng": 151.2497}
      },
      "technology": {
        "type": "Biogas upgrading",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 95,
        "unit": "TJ/year",
        "expandable_to": 200
      },
      "feedstock": {
        "type": "Municipal wastewater biogas",
        "source": "Sydney Water Malabar treatment plant",
        "weather_dependent": false,
        "contract_type": "Integrated facility"
      },
      "proponents": [
        {"name": "Jemena", "role": "Lead developer", "type": "Utility", "asx_code": null},
        {"name": "Sydney Water", "role": "Feedstock partner", "type": "Government-owned"}
      ],
      "funding": {
        "total_cost": 12860000,
        "arena_funding": 5900000,
        "arena_percentage": 45.9
      },
      "scores": {
        "volume_security": {"score": 9, "justification": "Wastewater feedstock is population-driven, continuous, weather-independent"},
        "counterparty_quality": {"score": 10, "justification": "Government-backed utility ($12.4B) + state-owned enterprise"},
        "contract_structure": {"score": 8, "justification": "Origin Energy offtake under GreenPower certification"},
        "concentration_risk": {"score": 6, "justification": "Single facility, single feedstock source; reliability offsets concentration"},
        "operational_readiness": {"score": 10, "justification": "Fully operational 2+ years with published performance data"}
      },
      "overall_score": 8.6,
      "rating": "AA",
      "tier": 1,
      "tier_label": "Bankable",
      "rank": 1,
      "key_strengths": [
        "Only operational biomethane-to-grid facility in Australia",
        "Government-backed counterparties eliminate credit risk",
        "Feedstock supply decoupled from weather/agriculture"
      ],
      "key_risks": [
        "Single facility concentration",
        "Expansion dependent on Sydney Water capacity"
      ],
      "critical_issues": []
    },
    {
      "id": "ABFI-2025-006",
      "name": "Delorean SA1 Biomethane Project",
      "short_name": "Delorean SA1",
      "status": "UNDER_CONSTRUCTION",
      "status_detail": "FID achieved; construction commenced Q2 FY25; first gas April 2026",
      "location": {
        "site": "Northern Adelaide",
        "state": "SA",
        "coordinates": {"lat": -34.7000, "lng": 138.6000}
      },
      "technology": {
        "type": "Anaerobic digestion with biomethane upgrading",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 200,
        "unit": "TJ/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Commercial & industrial food waste",
        "source": "C&I waste contracts",
        "weather_dependent": false,
        "contract_type": "Commercial waste agreements"
      },
      "proponents": [
        {"name": "Delorean Corporation", "role": "Developer", "type": "ASX-listed", "asx_code": "DEL"}
      ],
      "funding": {
        "total_cost": 32830000,
        "arena_funding": 6080000,
        "arena_percentage": 18.5
      },
      "scores": {
        "volume_security": {"score": 6, "justification": "C&I food waste requires commercial contracts; more reliable than agricultural residues"},
        "counterparty_quality": {"score": 6, "justification": "Small-cap ASX company; Origin Energy investment-grade offtaker"},
        "contract_structure": {"score": 9, "justification": "8-year take-or-pay with Origin ($30-40M); CO2 offtake with Supagas; CPI escalation"},
        "concentration_risk": {"score": 5, "justification": "Single Adelaide facility; significant Origin dependency"},
        "operational_readiness": {"score": 8, "justification": "FID achieved; under construction; company has 3 completed projects"}
      },
      "overall_score": 6.8,
      "rating": "BBB",
      "tier": 1,
      "tier_label": "Bankable",
      "rank": 2,
      "key_strengths": [
        "Best contract structure of all assessed projects",
        "FID achieved and construction underway",
        "Proven execution track record (3 completed projects)"
      ],
      "key_risks": [
        "Small-cap counterparty with debt financing",
        "Food waste contracts must be secured/maintained"
      ],
      "critical_issues": []
    },
    {
      "id": "ABFI-2025-002",
      "name": "Ampol Brisbane Renewable Fuels Project",
      "short_name": "Ampol BRF",
      "status": "PRE_FEED",
      "status_detail": "Pre-FEED commenced December 2024; FID contingent on policy",
      "location": {
        "site": "Lytton Refinery",
        "state": "QLD",
        "coordinates": {"lat": -27.4198, "lng": 153.1372}
      },
      "technology": {
        "type": "HEFA (Hydroprocessed Esters and Fatty Acids)",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 450,
        "unit": "ML/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Vegetable oils (canola, tallow, UCO)",
        "source": "GrainCorp crushing + imports",
        "weather_dependent": true,
        "contract_type": "MOU stage"
      },
      "proponents": [
        {"name": "Ampol", "role": "Lead developer", "type": "ASX-listed", "asx_code": "ALD"},
        {"name": "IFM Investors", "role": "Financial partner", "type": "Superannuation fund manager"}
      ],
      "funding": {
        "total_cost": null,
        "arena_funding": 8000000,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 5, "justification": "Dependent on GrainCorp facility; no direct grower contracts; import dependency likely"},
        "counterparty_quality": {"score": 9, "justification": "Ampol (ASX:ALD) major fuel retailer; IFM ($222B AUM) superannuation-backed"},
        "contract_structure": {"score": 5, "justification": "MOU stage only; no binding feedstock or offtake agreements"},
        "concentration_risk": {"score": 5, "justification": "Single Lytton site; dependent on GrainCorp proceeding"},
        "operational_readiness": {"score": 7, "justification": "Pre-FEED phase; HEFA proven globally; existing refinery infrastructure"}
      },
      "overall_score": 6.2,
      "rating": "BB",
      "tier": 2,
      "tier_label": "Development Stage",
      "rank": 3,
      "key_strengths": [
        "Institutional financial backing (IFM $1B+ commitment)",
        "Proven HEFA technology with global track record",
        "Existing refinery infrastructure"
      ],
      "key_risks": [
        "Policy dependency for FID",
        "Feedstock supply chain uncontracted",
        "Co-dependency with GrainCorp"
      ],
      "critical_issues": []
    },
    {
      "id": "ABFI-2025-004",
      "name": "Licella Project Swift",
      "short_name": "Project Swift",
      "status": "FEED",
      "status_detail": "FEED phase; target FID H2 2026",
      "location": {
        "site": "Bundaberg",
        "state": "QLD",
        "coordinates": {"lat": -24.8661, "lng": 152.3489}
      },
      "technology": {
        "type": "Catalytic Hydrothermal Reactor (Cat-HTR)",
        "trl": 8,
        "proven_commercial": true
      },
      "capacity": {
        "value": 60,
        "unit": "ML/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Sugarcane bagasse and trash",
        "source": "Isis Central Sugar Mill (grower cooperative)",
        "weather_dependent": true,
        "contract_type": "Mill supply arrangement"
      },
      "proponents": [
        {"name": "Licella Holdings", "role": "Developer", "type": "Private", "asx_code": null},
        {"name": "Shell", "role": "Upgrading partner", "type": "Major oil company"}
      ],
      "funding": {
        "total_cost": null,
        "arena_funding": 8000000,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 5, "justification": "Mill partnership (grower cooperative provides indirect alignment); sugarcane weather-vulnerable"},
        "counterparty_quality": {"score": 7, "justification": "Shell partnership adds credibility; Licella private with technology IP"},
        "contract_structure": {"score": 5, "justification": "Supply arrangement exists but undisclosed terms; no confirmed offtake"},
        "concentration_risk": {"score": 6, "justification": "Single mill feedstock source in Bundaberg region"},
        "operational_readiness": {"score": 7, "justification": "FEED phase; technology proven at Arbios Canada facility"}
      },
      "overall_score": 6.0,
      "rating": "BB",
      "tier": 2,
      "tier_label": "Development Stage",
      "rank": 4,
      "key_strengths": [
        "Most advanced Australian SAF project (FEED phase)",
        "Technology validated at commercial scale overseas",
        "Shell partnership for bio-crude upgrading"
      ],
      "key_risks": [
        "Sugarcane feedstock weather vulnerability",
        "Mill arrangement not direct grower contracts",
        "No confirmed offtake"
      ],
      "critical_issues": []
    },
    {
      "id": "ABFI-2025-005",
      "name": "Jet Zero Australia Project Ulysses",
      "short_name": "Jet Zero Australia",
      "status": "FEED",
      "status_detail": "FEED phase; target completion end 2025",
      "location": {
        "site": "Townsville",
        "state": "QLD",
        "coordinates": {"lat": -19.2590, "lng": 146.8169}
      },
      "technology": {
        "type": "Alcohol-to-Jet (LanzaJet ATJ)",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 102,
        "unit": "ML/year SAF",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Ethanol",
        "source": "Australian ethanol market",
        "weather_dependent": true,
        "contract_type": "Market supply (no disclosed contracts)"
      },
      "proponents": [
        {"name": "Jet Zero Australia", "role": "Developer", "type": "Private", "asx_code": null},
        {"name": "Qantas", "role": "Strategic investor", "type": "ASX-listed", "asx_code": "QAN"},
        {"name": "Airbus", "role": "Strategic investor", "type": "Listed", "asx_code": null},
        {"name": "Idemitsu Kosan", "role": "Strategic investor", "type": "Listed", "asx_code": null}
      ],
      "funding": {
        "total_cost": null,
        "arena_funding": null,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 4, "justification": "Relies on existing ethanol market; no disclosed direct grower contracts"},
        "counterparty_quality": {"score": 8, "justification": "Qantas/Airbus/Idemitsu equity backing; $29M March 2024 round"},
        "contract_structure": {"score": 6, "justification": "Strategic investors likely become offtakers; no binding agreements disclosed"},
        "concentration_risk": {"score": 5, "justification": "Single Townsville facility; dependent on ethanol market"},
        "operational_readiness": {"score": 7, "justification": "FEED phase; proven LanzaJet technology; experienced management"}
      },
      "overall_score": 6.0,
      "rating": "BB",
      "tier": 2,
      "tier_label": "Development Stage",
      "rank": 5,
      "key_strengths": [
        "Strategic backing from Qantas, Airbus, Idemitsu",
        "Proven LanzaJet technology (commercial in USA)",
        "Experienced management team"
      ],
      "key_risks": [
        "Ethanol feedstock supply not contracted",
        "Competition for limited Australian ethanol supply",
        "Policy dependency"
      ],
      "critical_issues": []
    },
    {
      "id": "ABFI-2025-003",
      "name": "GrainCorp Oilseed Crushing Facility",
      "short_name": "GrainCorp Crushing",
      "status": "PRE_FEED",
      "status_detail": "Pre-FEED commenced December 2024; location TBC",
      "location": {
        "site": "TBC",
        "state": "VIC",
        "coordinates": null
      },
      "technology": {
        "type": "Oilseed crushing",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 330000,
        "unit": "tonnes/year canola oil",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Canola seed",
        "source": "GrainCorp receival network (multi-state)",
        "weather_dependent": true,
        "contract_type": "Existing grower relationships"
      },
      "proponents": [
        {"name": "GrainCorp", "role": "Developer", "type": "ASX-listed", "asx_code": "GNC"}
      ],
      "funding": {
        "total_cost": null,
        "arena_funding": 6060000,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 4, "justification": "CRITICAL: Distributed aggregation model. Canola sourced from multiple receival sites across NSW/VIC/SA. Long transport distances to crushing, then oil to Brisbane refinery. Carbon intensity will be severely impacted by logistics chain. Weather-variable crop."},
        "counterparty_quality": {"score": 8, "justification": "GrainCorp (ASX:GNC) $6.5B revenue. Australia's largest grain handler. Strong balance sheet. Existing crushing operations at Numurkah demonstrate capability."},
        "contract_structure": {"score": 4, "justification": "No binding canola supply contracts; relies on spot market and existing grower relationships. No confirmed offtake for oil (dependent on Ampol BRF)."},
        "concentration_risk": {"score": 4, "justification": "Aggregation from multiple sites creates complexity. Single crushing facility. Single customer dependency (Ampol BRF)."},
        "operational_readiness": {"score": 5, "justification": "Pre-FEED; crushing proven; but CI viability of distributed supply chain unvalidated"}
      },
      "overall_score": 5.0,
      "rating": "B",
      "tier": 2,
      "tier_label": "Development Stage",
      "rank": 6,
      "key_strengths": [
        "Established grower relationships through grain network",
        "Proven crushing capability at Numurkah",
        "Strong corporate balance sheet"
      ],
      "key_risks": [
        "Distributed aggregation impacts carbon intensity",
        "Multi-state logistics increases costs and emissions",
        "Single customer dependency (Ampol)",
        "CI viability unproven for distributed model"
      ],
      "critical_issues": [
        "Distributed aggregation model collects canola from receival sites across 3 states",
        "Transport to crushing (500-800km) plus oil to Brisbane (1000-1600km)",
        "Lifecycle emissions may exceed CORSIA/ReFuelEU thresholds",
        "Cost structure may not support competitive SAF pricing",
        "Carbon intensity viability unproven for this supply chain configuration"
      ]
    },
    {
      "id": "ABFI-2025-008",
      "name": "Curtin University Renergi Biofuels Research",
      "short_name": "Curtin/Renergi",
      "status": "DEMONSTRATION",
      "status_detail": "Demonstration plant operational April 2023",
      "location": {
        "site": "Collie",
        "state": "WA",
        "coordinates": {"lat": -33.3603, "lng": 116.1558}
      },
      "technology": {
        "type": "Grinding pyrolysis (patented)",
        "trl": 7,
        "proven_commercial": false
      },
      "capacity": {
        "value": 12000,
        "unit": "tonnes/year (demo)",
        "expandable_to": null
      },
      "feedstock": {
        "type": "MSW, forestry residues, mallee biomass",
        "source": "Oil Mallee Association + waste contracts",
        "weather_dependent": true,
        "contract_type": "Grower partnership + waste"
      },
      "proponents": [
        {"name": "Renergi Pty Ltd", "role": "Developer", "type": "University spin-off", "asx_code": null},
        {"name": "Curtin University", "role": "Research partner", "type": "University"}
      ],
      "funding": {
        "total_cost": null,
        "arena_funding": 12300000,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 6, "justification": "Oil Mallee Association partnership (900+ farmers, 12,700+ ha). Genuine grower relationship. MSW option developing. Multiple feedstock pathways provide flexibility."},
        "counterparty_quality": {"score": 5, "justification": "University spin-off company. Sunshot/Garnaut consortium backing. Pre-commercial stage. Limited financial capacity for commercial scale-up."},
        "contract_structure": {"score": 3, "justification": "Demonstration/demonstration phase. Commercial contracts not yet required or developed. No offtake agreements."},
        "concentration_risk": {"score": 4, "justification": "Single Collie demonstration facility. Mallee supply chain requires significant scale-up. Regional concentration in WA."},
        "operational_readiness": {"score": 6, "justification": "Demonstration plant operational. Patented technology proven at small scale. Significant gap to commercial deployment. Additional capital required for scale-up."}
      },
      "overall_score": 4.8,
      "rating": "B-",
      "tier": 3,
      "tier_label": "High Risk",
      "rank": 7,
      "key_strengths": [
        "Patented Australian technology",
        "Genuine grower partnership (Oil Mallee Association)",
        "Operational demonstration facility"
      ],
      "key_risks": [
        "Pre-commercial stage only",
        "Significant capital required for commercial scale",
        "No commercial contracts or offtakes"
      ],
      "critical_issues": []
    },
    {
      "id": "ABFI-2025-007",
      "name": "RDA Pentland Bioenergy Project",
      "short_name": "RDA Pentland",
      "status": "PROPOSED",
      "status_detail": "Proposed since 2004; never achieved FID",
      "location": {
        "site": "Pentland",
        "state": "QLD",
        "coordinates": {"lat": -20.5167, "lng": 145.4167}
      },
      "technology": {
        "type": "Ethanol production (repositioning for SAF)",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 350,
        "unit": "ML/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Sugarcane and sweet sorghum (own cultivation on 19,100 ha)",
        "source": "Own cultivation on 19,100 dedicated hectares",
        "weather_dependent": true,
        "contract_type": "Own feedstock cultivation"
      },
      "proponents": [
        {"name": "Renewable Developments Australia", "role": "Developer", "type": "Private", "asx_code": null}
      ],
      "funding": {
        "total_cost": 800000000,
        "arena_funding": null,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 7, "justification": "STRONGEST THEORETICAL MODEL: Project proposes to grow own feedstock on 19,100 dedicated hectares. Eliminates mill intermediary risk entirely. However, 20+ years without execution severely undermines credibility of any claimed feedstock security."},
        "counterparty_quality": {"score": 3, "justification": "Private company. FID never achieved despite 20+ years. Claims of \"20 investors including US Fortune 100\" never materialised into financial close. Multiple missed construction deadlines."},
        "contract_structure": {"score": 4, "justification": "2025 announcements of Virgin Australia and Qatar Airways partnerships. Historical claims unverified. No evidence of binding agreements."},
        "concentration_risk": {"score": 5, "justification": "Single site. Dependent entirely on own agricultural operations. 75,000 ML water requirement creates resource concentration."},
        "operational_readiness": {"score": 2, "justification": "CRITICAL FAILURE: Never broke ground despite development since 2004. Original construction start 2016 never achieved. $800M capital requirement proven insurmountable. Technology pivot suggests original model failed."}
      },
      "overall_score": 4.2,
      "rating": "CCC",
      "tier": 3,
      "tier_label": "High Risk",
      "rank": 8,
      "key_strengths": [
        "Feedstock cultivation model theoretically optimal",
        "Recent airline partnership announcements",
        "Significant water allocation secured"
      ],
      "key_risks": [
        "20+ year failure to achieve financial close",
        "Multiple missed deadlines destroy credibility",
        "$800M capital requirement"
      ],
      "critical_issues": [
        "Development since 2004 with zero construction progress",
        "Original 2016 construction target never achieved",
        "Claims of Fortune 100 investor never resulted in FID"
      ]
    },
    {
      "id": "ABFI-2025-009",
      "name": "NQBE Ingham Sugar Ethanol Plant",
      "short_name": "NQBE Ingham",
      "status": "ON_HOLD",
      "status_detail": "On hold since May 2018",
      "location": {
        "site": "Ingham",
        "state": "QLD",
        "coordinates": {"lat": -18.6500, "lng": 146.1667}
      },
      "technology": {
        "type": "Integrated sugar mill, ethanol distillery, cogeneration",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 90,
        "unit": "ML/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Sugarcane",
        "source": "Herbert River growers (shareholders)",
        "weather_dependent": true,
        "contract_type": "Grower shareholder agreements"
      },
      "proponents": [
        {"name": "North Queensland Bio-Energy", "role": "Developer", "type": "Private", "asx_code": null}
      ],
      "funding": {
        "total_cost": 640000000,
        "arena_funding": null,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 5, "justification": "Claimed grower agreements with Herbert River cane farmers (shareholders). Genuine grower alignment through shareholding structure. However, sugarcane weather vulnerability remains. Project on hold for 7+ years."},
        "counterparty_quality": {"score": 3, "justification": "Private company. Dr John Hewson AM (former Liberal leader) as director provided profile but not funding. FID never achieved. ~10 years development without financial close."},
        "contract_structure": {"score": 3, "justification": "No confirmed offtake agreements. Electricity economics ($40-50/MWh) made cogeneration unviable. Ethanol offtake never secured."},
        "concentration_risk": {"score": 4, "justification": "Single integrated facility. Dependent on Herbert River growers. Single regional economy exposure."},
        "operational_readiness": {"score": 2, "justification": "On hold since May 2018. Never broke ground despite ~10 years development. $640M capital requirement. Economic model failed due to electricity prices."}
      },
      "overall_score": 3.4,
      "rating": "CC",
      "tier": 4,
      "tier_label": "Non-Investable",
      "rank": 9,
      "key_strengths": [
        "Grower-shareholder alignment",
        "Integrated facility concept"
      ],
      "key_risks": [
        "On hold 7+ years",
        "Economic model failed",
        "Never achieved financial close"
      ],
      "critical_issues": [
        "Electricity prices ($40-50/MWh) made cogeneration uneconomic",
        "Never achieved financial close despite ~10 years development"
      ]
    },
    {
      "id": "ABFI-2025-010",
      "name": "Austcane Energy Ethanol Plant",
      "short_name": "Austcane Energy",
      "status": "ON_HOLD",
      "status_detail": "On hold since 2014",
      "location": {
        "site": "Burdekin",
        "state": "QLD",
        "coordinates": {"lat": -19.5833, "lng": 147.4167}
      },
      "technology": {
        "type": "Ethanol distillery",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 100,
        "unit": "ML/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Sugarcane (100% irrigated)",
        "source": "Burdekin grower founders (200 shareholders)",
        "weather_dependent": false,
        "contract_type": "Grower shareholder arrangements"
      },
      "proponents": [
        {"name": "Austcane Energy", "role": "Developer", "type": "Private", "asx_code": null}
      ],
      "funding": {
        "total_cost": 240000000,
        "arena_funding": null,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 6, "justification": "STRONGEST REGIONAL ADVANTAGES: Burdekin has 100% irrigation from Burdekin Falls Dam (weather resilience). Chairman is one of Australia's largest cane producers. 200 Burdekin grower founders. Genuine grower alignment."},
        "counterparty_quality": {"score": 3, "justification": "Private company. On hold 11+ years. No demonstrated ability to achieve financial close. Website states 'next steps to establish offtake agreement' - unchanged for years."},
        "contract_structure": {"score": 2, "justification": "No offtake agreement ever secured. Project explicitly stalled waiting for offtake. No evidence of binding supply contracts despite grower founder involvement."},
        "concentration_risk": {"score": 4, "justification": "Single facility. Single regional feedstock source. Dependent on securing single offtaker."},
        "operational_readiness": {"score": 1, "justification": "On hold since 2014 (~11 years). Never achieved Pre-FEED or FEED. $240M capital requirement. No visible progress. No construction timeline."}
      },
      "overall_score": 3.2,
      "rating": "CC",
      "tier": 4,
      "tier_label": "Non-Investable",
      "rank": 10,
      "key_strengths": [
        "Best regional geography (irrigated Burdekin)",
        "Strong grower alignment (founder shareholders)",
        "Experienced agricultural leadership"
      ],
      "key_risks": [
        "On hold 11+ years",
        "Never secured offtake despite decade of effort",
        "No visible path forward"
      ],
      "critical_issues": [
        "Website unchanged for years stating 'next steps to establish offtake'",
        "No construction timeline ever established"
      ]
    },
    {
      "id": "ABFI-2025-011",
      "name": "Deniliquin Ethanol Plant",
      "short_name": "Deniliquin",
      "status": "FAILED",
      "status_detail": "Proponent insolvent March 2018",
      "location": {
        "site": "Deniliquin",
        "state": "NSW",
        "coordinates": {"lat": -35.5333, "lng": 144.9500}
      },
      "technology": {
        "type": "Ethanol distillery",
        "trl": 9,
        "proven_commercial": true
      },
      "capacity": {
        "value": 115,
        "unit": "ML/year",
        "expandable_to": null
      },
      "feedstock": {
        "type": "Wheat",
        "source": "None secured",
        "weather_dependent": true,
        "contract_type": "None"
      },
      "proponents": [
        {"name": "Dongmun Greentec", "role": "Developer (INSOLVENT)", "type": "Private", "asx_code": null}
      ],
      "funding": {
        "total_cost": null,
        "arena_funding": null,
        "arena_percentage": null
      },
      "scores": {
        "volume_security": {"score": 1, "justification": "No feedstock contracts ever secured. Project was never structured for execution. Proponent had no agricultural relationships."},
        "counterparty_quality": {"score": 1, "justification": "Proponent insolvent (March 2018). Failed projects in Tasmania, Victoria, Warrnambool, Junee prior to Deniliquin. NSW Office of Local Government investigations. ICAC referrals. Supreme Court actions."},
        "contract_structure": {"score": 1, "justification": "No contracts of any kind. No feedstock agreements. No offtake agreements. Never had commercial structure."},
        "concentration_risk": {"score": 2, "justification": "Single proposed facility. Single feedstock type. Irrelevant given project failure."},
        "operational_readiness": {"score": 1, "justification": "Complete failure. Never progressed beyond planning approval. Proponent collapsed. Investigations ongoing. Project was never viable."}
      },
      "overall_score": 1.2,
      "rating": "D",
      "tier": 4,
      "tier_label": "Non-Investable",
      "rank": 11,
      "key_strengths": [],
      "key_risks": [
        "Proponent insolvent",
        "Regulatory investigations",
        "Project completely failed"
      ],
      "critical_issues": [
        "NSW Office of Local Government investigations",
        "ICAC referrals",
        "Supreme Court actions to recover council loans",
        "Failed attempts in Tasmania, Victoria, Warrnambool, Junee before Deniliquin",
        "Project was never viable - serves as cautionary example only"
      ]
    }
  ]
};

async function seedABFIAssessments() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const db = drizzle(process.env.DATABASE_URL);

  console.log("🌱 Seeding ABFI Bankability Assessments...");

  try {
    // Insert framework (should already exist from migration, but ensure it)
    await db.insert(schema.abfiAssessmentFrameworks).values({
      version: assessmentData.assessment_metadata.framework_version,
      frameworkName: "ABFI Five-Pillar Bankability Assessment Framework",
      description: "Comprehensive assessment framework evaluating bioenergy projects across five critical pillars: Volume Security, Counterparty Quality, Contract Structure, Concentration Risk, and Operational Readiness.",
      assessmentDate: new Date(assessmentData.assessment_metadata.date + "-01"),
      analyst: assessmentData.assessment_metadata.analyst,
      pillarWeights: assessmentData.assessment_metadata.scoring_methodology.pillars.reduce((acc, p) => {
        acc[p.name] = p.weight;
        return acc;
      }, {} as Record<string, number>),
      ratingScale: assessmentData.assessment_metadata.scoring_methodology.rating_scale,
      tierDefinitions: assessmentData.tier_definitions,
      isActive: true,
    }).onDuplicateKeyUpdate({
      analyst: assessmentData.assessment_metadata.analyst,
      assessmentDate: new Date(assessmentData.assessment_metadata.date + "-01"),
    });

    // Insert assessments
    for (const project of assessmentData.projects) {
      console.log(`📊 Seeding assessment: ${project.short_name}`);

      await db.insert(schema.abfiBankabilityAssessments).values({
        assessmentId: project.id,
        projectName: project.name,
        shortName: project.short_name,
        status: project.status as any,
        siteLocation: project.location.site,
        state: project.location.state as any,
        latitude: project.location.coordinates?.lat,
        longitude: project.location.coordinates?.lng,
        technology: project.technology.type,
        feedstock: project.feedstock.type,
        capacityValue: project.capacity.value,
        capacityUnit: project.capacity.unit,
        volumeSecurityScore: project.scores.volume_security.score,
        volumeSecurityJustification: project.scores.volume_security.justification,
        counterpartyQualityScore: project.scores.counterparty_quality.score,
        counterpartyQualityJustification: project.scores.counterparty_quality.justification,
        contractStructureScore: project.scores.contract_structure.score,
        contractStructureJustification: project.scores.contract_structure.justification,
        concentrationRiskScore: project.scores.concentration_risk.score,
        concentrationRiskJustification: project.scores.concentration_risk.justification,
        operationalReadinessScore: project.scores.operational_readiness.score,
        operationalReadinessJustification: project.scores.operational_readiness.justification,
        overallScore: project.overall_score,
        rating: project.rating,
        tier: project.tier,
        tierLabel: project.tier_label,
        rank: project.rank,
        keyStrengths: project.key_strengths,
        keyRisks: project.key_risks,
        criticalIssues: project.critical_issues,
        totalCost: project.funding.total_cost,
        arenaFunding: project.funding.arena_funding,
        arenaPercentage: project.funding.arena_percentage,
        frameworkVersion: assessmentData.assessment_metadata.framework_version,
        isPublic: true,
      }).onDuplicateKeyUpdate({
        overallScore: project.overall_score,
        rating: project.rating,
        tier: project.tier,
        rank: project.rank,
      });

      // Insert proponents
      for (const proponent of project.proponents) {
        await db.insert(schema.abfiAssessmentProponents).values({
          assessmentId: (await db.select({ id: schema.abfiBankabilityAssessments.id })
            .from(schema.abfiBankabilityAssessments)
            .where(eq(schema.abfiBankabilityAssessments.assessmentId, project.id))
            .limit(1))[0].id,
          proponentName: proponent.name,
          proponentRole: proponent.role,
          proponentType: proponent.type,
          asxCode: proponent.asx_code,
        }).onDuplicateKeyUpdate({
          proponentRole: proponent.role,
        });
      }
    }

    console.log("✅ Successfully seeded ABFI Bankability Assessments!");
    console.log(`📊 Seeded ${assessmentData.projects.length} project assessments`);
    console.log(`🏢 Seeded proponent information for all projects`);

  } catch (error) {
    console.error("❌ Error seeding ABFI assessments:", error);
    throw error;
  }
}

// Run the seeder if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedABFIAssessments()
    .then(() => {
      console.log("🎉 Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Seeding failed:", error);
      process.exit(1);
    });
}

export { seedABFIAssessments, assessmentData };