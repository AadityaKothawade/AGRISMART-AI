// frontend/src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { useSaveUser } from "./hooks/useSaveUser";
import Home from "./Home";
import SoybeanPage from "./pages/SoybeanPage";
import FertilizerPage from "./pages/FertilizerPage";
import BudgetPage from "./pages/BudgetPage";
import WeatherPage from "./pages/WeatherPage";
import SignInPage from "./components/auth/SignInPage";
import SignUpPage from "./components/auth/SignUpPage";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import BuyProduct from "./pages/BuyProduct";
import SellProduct from "./pages/SellProduct";
import GovernmentSchemes from "./pages/GovernmentSchemes";
import MyOrders from "./pages/MyOrders";
import Chatbot from "./components/Chatbot/Chatbot"; // Import Chatbot
import "./App.css";

function App() {
  useSaveUser();

  return (
    <div className="App">
      <Navbar />
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in/*" element={<SignInPage />} />
        <Route path="/sign-up/*" element={<SignUpPage />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/marketplace" element={<Marketplace />}>
            <Route path="buy" element={<BuyProduct />} />
            <Route path="sell" element={<SellProduct />} />
            <Route path="store" element={<div>Store Page (to be built)</div>} />
          </Route>
          <Route path="/schemes" element={<GovernmentSchemes />} />
          <Route path="/my-orders" element={<MyOrders />} />
          
          <Route path="/soybean" element={<SoybeanPage />} />
          <Route path="/fertilizer" element={<FertilizerPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/weather" element={<WeatherPage />} />
        </Route>
        
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      </Routes>
      
      {/* Add Chatbot Component - it will appear on all pages */}
      <Chatbot />
    </div>
  );
}

export default App;