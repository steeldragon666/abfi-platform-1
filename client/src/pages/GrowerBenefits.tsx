import { Shield, TrendingUp, DollarSign, Users, FileCheck, Award, ArrowRight, X, Check } from "lucide-react";

export default function GrowerBenefits() {
  const problems = [
    "Middlemen take 20-40% of your crop value",
    "No visibility into market prices or demand",
    "Payment delays of 60-90 days are common",
    "Buyers question your yield claims without proof",
    "No protection against contract breaches"
  ];

  const solutions = [
    "Direct access to verified buyers—keep more profit",
    "Real-time market data shows fair regional prices",
    "Escrow system ensures payment within 7 days",
    "Platform verifies your data with satellite imagery",
    "Smart contracts enforce terms automatically"
  ];

  const protections = [
    {
      icon: "🛡️",
      title: "Contract Protection",
      description: "Escrow holds buyer funds until delivery is confirmed—no more payment risk"
    },
    {
      icon: "📊",
      title: "Price Transparency",
      description: "See what other growers are getting paid in your region before you commit"
    },
    {
      icon: "✅",
      title: "Verified Credentials",
      description: "Your production data is independently verified—builds buyer trust and premium pricing"
    },
    {
      icon: "⚖️",
      title: "Dispute Resolution",
      description: "Independent arbitration if issues arise—fair outcomes backed by blockchain evidence"
    },
    {
      icon: "💰",
      title: "Advance Payments",
      description: "Access working capital against verified future harvests at competitive rates"
    },
    {
      icon: "📈",
      title: "Market Intelligence",
      description: "Forecasts and demand signals help you plan planting and negotiate better terms"
    }
  ];

  const priceComparison = [
    { label: "Traditional Broker", price: "$85/tonne", color: "var(--red-warning, #dc2626)" },
    { label: "BioFeed AU Direct", price: "$120/tonne", color: "var(--green-bright, #22c55e)" },
    { label: "Your Gain", price: "+$35/tonne", color: "var(--gold-primary, #b8860b)", highlight: true }
  ];

  const benefits = [
    {
      icon: "🌾",
      title: "Keep Your Independence",
      description: "No exclusivity required—list your feedstock and choose the best offer from multiple buyers"
    },
    {
      icon: "📱",
      title: "Simple Mobile App",
      description: "Submit harvest data, upload photos, and track payments from your phone in the field"
    },
    {
      icon: "🤝",
      title: "Build Your Reputation",
      description: "Verified delivery history becomes your digital credential—unlock better terms over time"
    },
    {
      icon: "🔔",
      title: "Demand Alerts",
      description: "Get notified when buyers in your region are seeking your feedstock type"
    }
  ];

  return (
    <div className="min-h-screen" style={{ background: '#faf8f3', padding: '48px 32px 64px' }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ 
              background: 'linear-gradient(135deg, #2d5a27, #4a7c43)' 
            }}>
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl" style={{ fontFamily: "'DM Serif Display', serif", color: '#1a2e1a' }}>
              BioFeed <span style={{ color: '#2d5a27' }}>AU</span>
            </h1>
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full mb-5 text-xs font-semibold uppercase tracking-wide" style={{ 
            background: '#dcfce7', 
            color: '#2d5a27' 
          }}>
            For Growers
          </div>

          <h2 className="text-5xl mb-4" style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontWeight: 400, 
            color: '#1a2e1a',
            lineHeight: 1.2
          }}>
            Fair Markets, <em style={{ color: '#2d5a27', fontStyle: 'normal' }}>Fair Prices</em>
          </h2>

          <p style={{ fontSize: '18px', color: '#4a5a4a', fontWeight: 300, maxWidth: '650px', margin: '0 auto' }}>
            Stop losing money to middlemen. Connect directly with verified buyers, get paid faster, and build a reputation that earns premium pricing.
          </p>
        </header>

        {/* Problem/Solution Comparison */}
        <section className="grid grid-cols-[1fr_80px_1fr] gap-0 mb-16 items-stretch">
          {/* Problem */}
          <div className="rounded-3xl p-8 relative" style={{ 
            background: '#fef2f2', 
            border: '2px solid rgba(220, 38, 38, 0.15)' 
          }}>
            <div className="absolute -top-3 left-6 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide" style={{ 
              background: '#dc2626', 
              color: 'white' 
            }}>
              Without Us
            </div>
            <h3 className="text-2xl mb-5 mt-2" style={{ 
              fontFamily: "'DM Serif Display', serif", 
              color: '#dc2626' 
            }}>
              The Old Way
            </h3>
            <ul className="space-y-0">
              {problems.map((problem, idx) => (
                <li key={idx} className="flex items-start gap-3 py-3 text-sm border-b" style={{ 
                  color: '#4a5a4a',
                  borderColor: 'rgba(0,0,0,0.05)'
                }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs" style={{ 
                    background: 'rgba(220, 38, 38, 0.15)', 
                    color: '#dc2626' 
                  }}>
                    <X className="h-3 w-3" />
                  </div>
                  <span>{problem}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ 
              background: '#2d5a27',
              boxShadow: '0 4px 20px rgba(45, 90, 39, 0.3)'
            }}>
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Solution */}
          <div className="rounded-3xl p-8 relative" style={{ 
            background: '#dcfce7', 
            border: '2px solid rgba(34, 197, 94, 0.2)' 
          }}>
            <div className="absolute -top-3 left-6 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide" style={{ 
              background: '#22c55e', 
              color: 'white' 
            }}>
              With BioFeed AU
            </div>
            <h3 className="text-2xl mb-5 mt-2" style={{ 
              fontFamily: "'DM Serif Display', serif", 
              color: '#2d5a27' 
            }}>
              The Better Way
            </h3>
            <ul className="space-y-0">
              {solutions.map((solution, idx) => (
                <li key={idx} className="flex items-start gap-3 py-3 text-sm border-b" style={{ 
                  color: '#4a5a4a',
                  borderColor: 'rgba(0,0,0,0.05)'
                }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs" style={{ 
                    background: 'rgba(34, 197, 94, 0.2)', 
                    color: '#22c55e' 
                  }}>
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{solution}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Protection Shield Section */}
        <section className="rounded-3xl p-12 mb-16 relative overflow-hidden" style={{ background: '#1a2e1a' }}>
          <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none" style={{ 
            background: 'radial-gradient(circle, rgba(74, 124, 67, 0.2) 0%, transparent 70%)' 
          }} />

          <div className="text-center mb-10 relative z-10">
            <div className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl" style={{ 
              background: 'linear-gradient(135deg, #4a7c43, #2d5a27)' 
            }}>
              🛡️
            </div>
            <h3 className="text-4xl mb-3 text-white" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>
              Built-In Grower Protections
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '16px', fontWeight: 300, maxWidth: '550px', margin: '0 auto' }}>
              We level the playing field so you can negotiate from a position of strength
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 relative z-10">
            {protections.map((protection, idx) => (
              <div key={idx} className="rounded-2xl p-7 text-center transition-all hover:bg-white/10 hover:-translate-y-1" style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)' 
              }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl" style={{ 
                  background: 'rgba(74, 124, 67, 0.3)' 
                }}>
                  {protection.icon}
                </div>
                <h4 className="text-base font-semibold text-white mb-2">
                  {protection.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 300, lineHeight: 1.5 }}>
                  {protection.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Price Discovery */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-4xl mb-3" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#1a2e1a' }}>
              See The Difference
            </h3>
            <p style={{ color: '#4a5a4a', fontSize: '16px', fontWeight: 300 }}>
              Example: Bagasse pricing in Queensland (per tonne, delivered)
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            {priceComparison.map((item, idx) => (
              <div key={idx} className="rounded-2xl p-8 text-center" style={{ 
                background: 'white',
                boxShadow: '0 4px 20px rgba(26, 46, 26, 0.08)',
                outline: item.highlight ? '4px solid #b8860b' : 'none',
                outlineOffset: '-4px'
              }}>
                <div className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#6b7c6b' }}>
                  {item.label}
                </div>
                <div className="text-4xl font-bold mb-2" style={{ 
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: item.color
                }}>
                  {item.price}
                </div>
                {item.highlight && (
                  <div className="text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full inline-block" style={{ 
                    background: '#fef3c7', 
                    color: '#b8860b' 
                  }}>
                    41% More
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p style={{ fontSize: '14px', color: '#6b7c6b', fontStyle: 'italic' }}>
              * Actual prices vary by region, quality, and market conditions. Platform shows live regional averages.
            </p>
          </div>
        </section>

        {/* Additional Benefits */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-4xl mb-3" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400, color: '#1a2e1a' }}>
              More Ways We Help
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="rounded-2xl p-8 flex gap-5" style={{ 
                background: 'white',
                boxShadow: '0 4px 20px rgba(26, 46, 26, 0.08)'
              }}>
                <div className="text-5xl flex-shrink-0">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-2" style={{ color: '#1a2e1a' }}>
                    {benefit.title}
                  </h4>
                  <p style={{ fontSize: '14px', color: '#4a5a4a', fontWeight: 300, lineHeight: 1.6 }}>
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center rounded-3xl p-12" style={{ 
          background: 'linear-gradient(135deg, #2d5a27 0%, #4a7c43 100%)',
          boxShadow: '0 8px 32px rgba(45, 90, 39, 0.3)'
        }}>
          <h3 className="text-3xl mb-4 text-white" style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 400 }}>
            Ready to Get Fair Prices?
          </h3>
          <p className="text-lg mb-8" style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 300, maxWidth: '500px', margin: '0 auto 32px' }}>
            Join 500+ Australian growers already earning more through direct market access
          </p>
          <button className="px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105" style={{ 
            background: 'white',
            color: '#2d5a27',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            List Your Feedstock Now
          </button>
          <div className="mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
            No subscription fees • No exclusivity • No lock-in contracts
          </div>
        </div>
      </div>
    </div>
  );
}
