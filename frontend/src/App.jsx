// App.jsx
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
          <Route path="/soybean" element={<SoybeanPage />} />
          <Route path="/fertilizer" element={<FertilizerPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/weather" element={<WeatherPage />} />
        </Route>
        
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      </Routes>
    </div>
  );
}

export default App;