import React from "react";
import Navbar from "../components/Navbar";
import SoybeanAnalyzer from "../components/App";
import FertilizerOptimizer from "../components/FertilizerOptimizer";
import "./dashboard.css";
import BudgetOptimizer from "../components/BudgetOptimizer";

export default function Dashboard() {
  return (
    <div className="dashboard">
      <Navbar />

      <div className="content">
        <h1 className="title">🌱 Smart Agriculture AI Dashboard</h1>

        <div className="grid">
          <div className="section">
            <SoybeanAnalyzer />
          </div>

          <div className="section">
            <FertilizerOptimizer />
          </div>

          
          <div className="section">
            <BudgetOptimizer />
          </div>
        </div>
      </div>
    </div>
  );
}
