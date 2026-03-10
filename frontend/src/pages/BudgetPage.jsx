// pages/BudgetPage.jsx
import React from "react";
import BudgetOptimizer from "../components/BudgetOptimizer";
import { useNavigate } from "react-router-dom";

export default function BudgetPage() {
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="m-4 bg-gray-600 text-white px-4 py-2 rounded-lg"
      >
        ← Back Home
      </button>

      <BudgetOptimizer />
    </>
  );
}