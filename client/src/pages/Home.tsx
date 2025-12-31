/**
 * @deprecated This component is superseded by Landing.tsx
 * The /home route now redirects to / (Landing page).
 * This file can be removed once migration is verified.
 * @see client/src/pages/Landing.tsx
 */
import React from 'react';
import { Leaf, Factory, TrendingUp, CheckCircle, Zap, BarChart, Shield, Users, Globe, ChevronRight } from 'lucide-react';
import { H1, H2, H3, Body, MetricValue } from '@/components/Typography';

// --- Design System Constants ---
const GOLD = '#D4AF37';
const BASE_TEXT_SIZE = 'text-lg'; // Approx 18px

// --- Helper Components (Internal) ---

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'primary' | 'ghost';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant, children, className = '', ...props }) => {
  const baseClasses = `min-h-[48px] px-6 py-3 rounded-xl font-semibold transition-colors duration-200 ${BASE_TEXT_SIZE}`;
  
  let variantClasses = '';
  if (variant === 'primary') {
    // Primary (bg-[#D4AF37] text-black)
    variantClasses = `bg-[${GOLD}] text-black hover:bg-opacity-90`;
  } else if (variant === 'ghost') {
    // Ghost (transparent hover:bg-gray-100)
    variantClasses = `text-black hover:bg-gray-100`;
  }

  return (
    <button className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface PathwayCardProps {
  icon: React.ReactNode;
  headline: string;
  description: string;
  ctaText: string;
}

const PathwayCard: React.FC<PathwayCardProps> = ({ icon, headline, description, ctaText }) => (
  <div className="bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-2xl p-8 flex flex-col space-y-4 transition-shadow duration-300">
    <div className="text-black w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100">
      {icon}
    </div>
    <h3 className={`text-2xl font-semibold text-black`}>{headline}</h3>
    <p className={`text-gray-700 flex-grow ${BASE_TEXT_SIZE}`}>{description}</p>
    <Button variant="ghost" className="self-start">
      {ctaText} <ChevronRight className="w-4 h-4 ml-2" />
    </Button>
  </div>
);

interface PillarItemProps {
  number: number;
  title: string;
}

const PillarItem: React.FC<PillarItemProps> = ({ number, title }) => (
  <div className="flex items-start space-x-4 p-4">
    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-black font-semibold text-xl bg-[${GOLD}]`}>
      {number}
    </div>
    <p className={`font-medium text-black ${BASE_TEXT_SIZE}`}>{title}</p>
  </div>
);

// --- Main Component ---

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* FIGMA REDESIGN - Black/White/Gold Design System */}
      {/* Section 1: Hero Section (Black Background) */}
      <header className="bg-black text-white py-24 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <H1 className="text-5xl md:text-7xl mb-6 leading-tight text-white">
            The Future of Bioenergy Feedstock is Verifiable
          </H1>
          <Body size="lg" className={`max-w-3xl mb-10 ${BASE_TEXT_SIZE}`}>
            ABFI provides the critical transparency and standardization needed to de-risk investment in the bioenergy sector.
          </Body>
          {/* Primary CTA: One primary gold CTA per screen */}
          <Button variant="primary">
            Get Certified Now
          </Button>
        </div>
      </header>

      {/* Section 2: Trust Badges (White Background) */}
      <section className="py-20 px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <H2 className="text-3xl text-black mb-12 text-center">Trusted by Industry Leaders</H2>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-70">
            {/* Placeholder for 4-5 logos/badges */}
            <CheckCircle className="w-10 h-10 text-black" />
            <span className={`font-medium text-black ${BASE_TEXT_SIZE}`}>Verified by ABFI</span>
            <Shield className="w-10 h-10 text-black" />
            <span className={`font-medium text-black ${BASE_TEXT_SIZE}`}>ISO 9001 Certified</span>
            <Users className="w-10 h-10 text-black" />
            <span className={`font-medium text-black ${BASE_TEXT_SIZE}`}>Global Partner Network</span>
          </div>
        </div>
      </section>

      {/* Section 3: Three Pathways Cards (White Background) */}
      <section className="py-20 px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <H2 className="text-4xl text-black mb-16 text-center">Your Pathway to Verifiable Bioenergy</H2>
          <div className="grid md:grid-cols-3 gap-8">
            <PathwayCard
              icon={<Leaf className="w-6 h-6" />}
              headline="Producer Certification"
              description="Standardize your feedstock with verifiable Grade, Yield, and Traceability data."
              ctaText="Learn More"
            />
            <PathwayCard
              icon={<Factory className="w-6 h-6" />}
              headline="Project Developer Sourcing"
              description="Secure your supply chain with risk-scored, volume-guaranteed, and contract-verified feedstocks."
              ctaText="Learn More"
            />
            <PathwayCard
              icon={<TrendingUp className="w-6 h-6" />}
              headline="Investor Due Diligence"
              description="Expedite financial closure with clear ESG, Compliance, and Financial Viability reports."
              ctaText="Learn More"
            />
          </div>
        </div>
      </section>

      {/* Section 4: Rating System Display (Black Background) */}
      <section className="bg-black text-white py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <H2 className={`text-4xl mb-12 text-center text-[${GOLD}]`}>ABFI Feedstock Rating System</H2>
          <Body size="lg" className={`text-center max-w-4xl mx-auto mb-16 ${BASE_TEXT_SIZE}`}>
            Our proprietary P, B, C, R grading system provides an objective, standardized measure of feedstock quality,
            de-risking supply chain decisions for all stakeholders.
          </Body>

          {/* Metric Display: Max 3 metrics visible at once */}
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-xl border border-gray-800">
              <MetricValue size="xl" className="text-white mb-2">P-</MetricValue>
              <Body className={`font-medium text-[${GOLD}]`}>Average Grade</Body>
            </div>
            <div className="p-6 rounded-xl border border-gray-800">
              <MetricValue size="xl" className="text-white mb-2">1.2M</MetricValue>
              <Body className={`font-medium text-[${GOLD}]`}>Total Volume Certified (Tons)</Body>
            </div>
            <div className="p-6 rounded-xl border border-gray-800">
              <MetricValue size="xl" className="text-white mb-2">45</MetricValue>
              <Body className={`font-medium text-[${GOLD}]`}>Projects De-risked</Body>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: 5-Pillar Assessment (White Background) */}
      <section className="py-20 px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <H2 className="text-4xl text-black mb-16 text-center">The 5 Pillars of Verifiable Feedstock</H2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
            <PillarItem number={1} title="Supply Volume & Contract" />
            <PillarItem number={2} title="Yield & Seasonality" />
            <PillarItem number={3} title="Carbon Sequestration" />
            <PillarItem number={4} title="Water Use & Land Management" />
            <PillarItem number={5} title="Financial Viability & Risk Score" />
          </div>
        </div>
      </section>

      {/* Section 6: Platform Capabilities Grid (Black Background) */}
      <section className="bg-black text-white py-20 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <H2 className={`text-4xl mb-12 text-center text-[${GOLD}]`}>Platform Capabilities</H2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {['Real-time Ledger', 'Audit Trail', 'Market Insights', 'Risk Scoring'].map((cap, index) => (
              <div key={index} className="p-6 rounded-xl border border-gray-800 hover:border-white transition-colors duration-300">
                <Zap className="w-8 h-8 mx-auto mb-4 text-white" />
                <p className={`font-semibold text-white ${BASE_TEXT_SIZE}`}>{cap}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Testimonials (White Background) */}
      <section className="py-20 px-8 md:px-16 lg:px-24 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-4xl italic font-light text-black mb-8 leading-snug">
            “ABFI's certification cut our due diligence time by 60% and unlocked critical project financing.”
          </blockquote>
          <p className={`font-semibold text-black ${BASE_TEXT_SIZE}`}>
            Jane Doe, Head of Sustainable Finance, Global Bank
          </p>
        </div>
      </section>

      {/* Section 8: Footer (Black Background) */}
      <footer className="bg-black text-white py-12 px-8 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Logo/Branding */}
          <div className="text-2xl font-bold text-white">
            ABFI <span className={`text-[${GOLD}]`}>Platform</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap justify-center space-x-6">
            {['About', 'Contact', 'Terms', 'Privacy'].map((link) => (
              <a key={link} href="#" className={`text-gray-400 hover:text-white transition-colors duration-200 ${BASE_TEXT_SIZE}`}>
                {link}
              </a>
            ))}
          </nav>

          {/* Social Media Icons Placeholder */}
          <div className="flex space-x-4">
            <Globe className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
            <BarChart className="w-6 h-6 text-gray-400 hover:text-white cursor-pointer" />
          </div>
        </div>
        <div className="text-center mt-8 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} ABFI Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
