// pages/FertilizerPage.jsx
import React from "react";
import FertilizerOptimizer from "../components/FertilizerOptimizer";
import { useNavigate } from "react-router-dom";

export default function FertilizerPage() {
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => navigate("/")}
        className="m-4 bg-gray-600 text-white px-4 py-2 rounded-lg"
      >
        ← Back Home
      </button>

      <FertilizerOptimizer />
    </>
  );
}