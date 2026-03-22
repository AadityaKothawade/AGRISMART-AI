import React, { useEffect, useState } from "react";
import "./GovernmentSchemes.css";

export default function GovernmentSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const data = [
      {
        id: 1,
        scheme_name: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
        description:
          "Income support scheme providing ₹6000 per year to small and marginal farmers.",
        eligibility:
          "All small and marginal farmers owning cultivable land.",
        benefits:
          "₹6000 per year in three equal installments directly into bank account.",
        application_link: "https://pmkisan.gov.in/"
      },
      {
        id: 2,
        scheme_name: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
        description:
          "Crop insurance scheme to protect farmers against crop loss due to natural disasters.",
        eligibility:
          "Farmers growing notified crops in notified areas.",
        benefits:
          "Insurance coverage and financial support in case of crop failure.",
        application_link: "https://pmfby.gov.in/"
      },
      {
        id: 3,
        scheme_name: "Mahatma Jyotirao Phule Shetkari Karj Mukti Yojana",
        description:
          "Loan waiver scheme launched by Maharashtra government for farmers.",
        eligibility:
          "Farmers with crop loans from banks in Maharashtra.",
        benefits:
          "Loan waiver up to ₹2 lakh.",
        application_link: "https://mjpsky.maharashtra.gov.in/"
      },
      {
        id: 4,
        scheme_name: "Soil Health Card Scheme",
        description:
          "Provides soil health cards to farmers with recommendations for fertilizers.",
        eligibility:
          "All farmers across India.",
        benefits:
          "Better crop productivity and reduced fertilizer cost.",
        application_link: "https://soilhealth.dac.gov.in/"
      },
      {
        id: 5,
        scheme_name: "Kisan Credit Card (KCC)",
        description:
          "Provides farmers with easy credit for agriculture and allied activities.",
        eligibility:
          "Farmers engaged in agriculture or allied activities.",
        benefits:
          "Short-term credit with low interest rates.",
        application_link: "https://www.myscheme.gov.in/schemes/kcc"
      }
    ];

    setSchemes(data);
    setLoading(false);

  }, []);

  if (loading) return <div className="loading">Loading schemes...</div>;

  return (
    <div className="schemes-page">
      <h1 className="schemes-title">
        Government Schemes for Maharashtra Farmers
      </h1>

      <div className="schemes-grid">
        {schemes.map((scheme) => (
          <div key={scheme.id} className="scheme-card">

            <h2>{scheme.scheme_name}</h2>

            <p className="description">{scheme.description}</p>

            <div className="scheme-detail">
              <strong>Eligibility:</strong> {scheme.eligibility}
            </div>

            <div className="scheme-detail">
              <strong>Benefits:</strong> {scheme.benefits}
            </div>

            <a
              href={scheme.application_link}
              target="_blank"
              rel="noopener noreferrer"
              className="apply-link"
            >
              Apply Now →
            </a>

          </div>
        ))}
      </div>
    </div>
  );
}