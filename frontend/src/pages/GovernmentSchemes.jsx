// pages/GovernmentSchemes.jsx
import React, { useEffect, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import "./GovernmentSchemes.css";

export default function GovernmentSchemes() {
  const { t, language } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get translated schemes based on current language
    const getSchemesByLanguage = () => {
      if (language === 'hi') {
        return t('schemes_data_hi');
      } else if (language === 'mr') {
        return t('schemes_data_mr');
      } else {
        return t('schemes_data_en');
      }
    };

    const data = getSchemesByLanguage();
    setSchemes(data);
    setLoading(false);
  }, [language, t]);

  if (loading) return <div className="loading">{t('loading_schemes')}</div>;

  return (
    <div className="schemes-page">
      <h1 className="schemes-title">{t('gov_schemes_title')}</h1>
      <div className="schemes-grid">
        {schemes.map((scheme) => (
          <div key={scheme.id} className="scheme-card">
            <h2>{scheme.scheme_name}</h2>
            <p className="description">{scheme.description}</p>
            <div className="scheme-detail">
              <strong>{t('eligibility_label')}</strong> {scheme.eligibility}
            </div>
            <div className="scheme-detail">
              <strong>{t('benefits_label')}</strong> {scheme.benefits}
            </div>
            <a href={scheme.application_link} target="_blank" rel="noopener noreferrer" className="apply-link">
              {t('apply_now')}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}