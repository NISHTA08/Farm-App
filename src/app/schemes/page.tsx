"use client";

import BottomNav from "@/components/BottomNav";
import {
  Landmark,
  IndianRupee,
  Shield,
  CreditCard,
  FlaskConical,
  Store,
  Sun,
  GraduationCap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";

interface Scheme {
  id: string;
  name: string;
  shortName: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  benefit: string;
  description: string;
  eligibility: string[];
  howToApply: string[];
  link: string;
}

const schemes: Scheme[] = [
  {
    id: "pm-kisan",
    name: "PM Kisan Samman Nidhi",
    shortName: "PM-KISAN",
    icon: <IndianRupee size={20} />,
    color: "text-emerald-400",
    glow: "glow-green",
    benefit: "₹6,000/year direct transfer",
    description: "All landholding farmer families receive ₹6,000 per year in three equal installments of ₹2,000 directly into their bank accounts.",
    eligibility: [
      "Must be a landholding farmer family",
      "Valid Aadhaar card linked to bank account",
      "Land records in the applicant's name",
      "Not a government employee or income tax payer",
    ],
    howToApply: [
      "Visit pmkisan.gov.in or your nearest CSC center",
      "Submit Aadhaar, bank details, and land documents",
      "Verification done by state/district nodal officer",
      "Approved farmers receive first installment within 30 days",
    ],
    link: "https://pmkisan.gov.in",
  },
  {
    id: "pmfby",
    name: "Pradhan Mantri Fasal Bima Yojana",
    shortName: "PMFBY",
    icon: <Shield size={20} />,
    color: "text-blue-400",
    glow: "glow-blue",
    benefit: "Crop insurance at 1.5-2% premium",
    description: "Comprehensive crop insurance at very low premium — 2% for Kharif crops, 1.5% for Rabi crops, and 5% for commercial/horticultural crops. Government subsidizes the rest.",
    eligibility: [
      "All farmers growing notified crops in notified areas",
      "Both loanee and non-loanee farmers can enroll",
      "Sharecroppers and tenant farmers also eligible",
      "Must enroll before sowing season deadline",
    ],
    howToApply: [
      "Apply through your bank branch (if loanee farmer)",
      "Non-loanee: visit nearest CSC, bank, or pmfby.gov.in",
      "Submit land records, sowing declaration, bank details",
      "Premium auto-debited from crop loan or paid separately",
    ],
    link: "https://pmfby.gov.in",
  },
  {
    id: "kcc",
    name: "Kisan Credit Card",
    shortName: "KCC",
    icon: <CreditCard size={20} />,
    color: "text-violet-400",
    glow: "glow-violet",
    benefit: "Credit up to ₹3L at 4% interest",
    description: "Short-term credit for crop production, post-harvest expenses, and maintenance of farm assets. Interest rate is 7% with 3% government subvention — effective rate just 4%.",
    eligibility: [
      "Individual/joint borrowers who are owner cultivators",
      "Tenant farmers, oral lessees, and sharecroppers",
      "Self Help Groups (SHGs) and Joint Liability Groups (JLGs)",
      "Must have land documents or tenancy proof",
    ],
    howToApply: [
      "Visit any commercial, cooperative, or regional rural bank",
      "Submit application with land records and identity proof",
      "Bank assesses credit limit based on land and crop pattern",
      "Card issued within 14 days of application",
    ],
    link: "https://www.pmkisan.gov.in/KCC",
  },
  {
    id: "soil-health",
    name: "Soil Health Card Scheme",
    shortName: "Soil Health",
    icon: <FlaskConical size={20} />,
    color: "text-amber-400",
    glow: "glow-amber",
    benefit: "Free soil testing & recommendations",
    description: "Government provides free soil health cards with nutrient status and fertilizer recommendations. Cards are issued every 2 years covering all 12 major nutrients.",
    eligibility: [
      "All farmers across India are eligible",
      "No minimum land requirement",
      "Both individual and community testing available",
    ],
    howToApply: [
      "Contact nearest Krishi Vigyan Kendra (KVK)",
      "Visit soilhealth.dac.gov.in for online registration",
      "Soil sample collected by trained personnel",
      "Card with recommendations delivered within 6-8 weeks",
    ],
    link: "https://soilhealth.dac.gov.in",
  },
  {
    id: "enam",
    name: "electronic National Agriculture Market",
    shortName: "eNAM",
    icon: <Store size={20} />,
    color: "text-teal-400",
    glow: "glow-green",
    benefit: "Sell produce at best price across India",
    description: "Pan-India electronic trading platform connecting 1,000+ APMC mandis. Farmers can see prices from multiple markets and sell to the highest bidder online.",
    eligibility: [
      "Any farmer with produce to sell",
      "Must register at nearest eNAM-enabled mandi",
      "Bank account and Aadhaar required",
    ],
    howToApply: [
      "Register at your nearest eNAM-enabled APMC mandi",
      "Or download eNAM mobile app from Play Store",
      "Upload produce details with quality parameters",
      "Receive bids from traders across connected mandis",
    ],
    link: "https://enam.gov.in",
  },
  {
    id: "pm-kusum",
    name: "PM-KUSUM (Solar for Farmers)",
    shortName: "PM-KUSUM",
    icon: <Sun size={20} />,
    color: "text-yellow-400",
    glow: "glow-amber",
    benefit: "Solar pumps with 60% subsidy",
    description: "Install solar pumps (up to 10 HP) with 60% government subsidy (30% central + 30% state). Farmers can also earn by selling surplus solar power to the grid.",
    eligibility: [
      "Individual farmers, water user associations, FPOs",
      "Must have existing grid-connected agricultural pump",
      "For Component A: farmers with barren/fallow land",
      "For Component B: any farmer needing irrigation pump",
    ],
    howToApply: [
      "Apply through state-designated portal/DISCOM",
      "Submit land documents and existing pump details",
      "Pay farmer's share (40%) after approval",
      "Installation done by empaneled vendor within 120 days",
    ],
    link: "https://pmkusum.mnre.gov.in",
  },
  {
    id: "atma",
    name: "Agricultural Technology Management Agency",
    shortName: "ATMA",
    icon: <GraduationCap size={20} />,
    color: "text-pink-400",
    glow: "glow-violet",
    benefit: "Free training & farm visits by experts",
    description: "District-level agricultural extension program providing training, demonstrations, and expert farm visits. Includes exposure visits to progressive farms and research stations.",
    eligibility: [
      "All farmers in participating districts",
      "Priority to small and marginal farmers",
      "Women farmers given special preference",
    ],
    howToApply: [
      "Contact District Agriculture Officer or Block Technology Manager",
      "Register as a farmer group or Farmer Interest Group (FIG)",
      "Participate in training programs and field demonstrations",
      "Free expert advisory through farm visits",
    ],
    link: "https://agricoop.nic.in",
  },
];

export default function SchemesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-kh-bg pb-28 relative overflow-hidden">
      <div className="orb w-[300px] h-[300px] bg-blue-600/15 -top-28 right-0 animate-glow" />
      <div className="orb w-[200px] h-[200px] bg-emerald-600/15 top-96 -left-20 animate-glow" style={{ animationDelay: "1.5s" }} />

      <header className="relative z-10 px-6 pt-6 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <Landmark size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="font-display text-display-sm text-kh-text">Govt Schemes</h1>
            <p className="text-body-xs text-kh-text-dim">{schemes.length} schemes for farmers</p>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-lg mx-auto px-6 mt-4 space-y-3">
        {schemes.map((scheme, i) => {
          const isOpen = expandedId === scheme.id;
          return (
            <div
              key={scheme.id}
              className={`glow-card bg-kh-card overflow-hidden animate-scale-in ${isOpen ? scheme.glow : ""}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <button
                onClick={() => setExpandedId(isOpen ? null : scheme.id)}
                className="w-full p-5 text-left flex items-start gap-4 touch-manipulation"
              >
                <div className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0 ${scheme.color}`}>
                  {scheme.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-body-md font-semibold text-kh-text">{scheme.shortName}</h3>
                      <p className="text-body-xs text-kh-text-dim mt-0.5">{scheme.name}</p>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-kh-text-dim shrink-0 mt-1" /> : <ChevronDown size={16} className="text-kh-text-dim shrink-0 mt-1" />}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full bg-kh-accent/10 text-body-xs text-kh-accent font-medium">
                    {scheme.benefit}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 space-y-4 animate-fade-in border-t border-kh-border pt-4 ml-14">
                  <p className="text-body-sm text-kh-text-secondary leading-relaxed">{scheme.description}</p>

                  <div>
                    <h4 className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-2">Eligibility</h4>
                    <ul className="space-y-1.5">
                      {scheme.eligibility.map((e, j) => (
                        <li key={j} className="flex items-start gap-2 text-body-sm text-kh-text-muted">
                          <CheckCircle size={12} className="text-kh-accent mt-0.5 shrink-0" /> {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-body-xs text-kh-text-dim uppercase tracking-wider mb-2">How to Apply</h4>
                    <ol className="space-y-1.5">
                      {scheme.howToApply.map((s, j) => (
                        <li key={j} className="flex items-start gap-2 text-body-sm text-kh-text-muted">
                          <span className="text-body-xs text-kh-accent font-semibold mt-0.5 shrink-0 w-4">{j + 1}.</span> {s}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-body-sm text-kh-accent font-medium hover:underline"
                  >
                    Visit Official Website <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <BottomNav />
    </div>
  );
}
