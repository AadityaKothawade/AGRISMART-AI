# ml-service/routes/budget_routes.py

from flask import Blueprint, request, jsonify
import numpy as np
from datetime import datetime

budget_bp = Blueprint('budget', __name__)

# ============================================
# FERTILIZER DATABASE WITH REAL-TIME PRICES
# ============================================

# Base fertilizer database
FERTILIZER_DB = {
    "rice": {
        "recommended": {
            "Urea": {"rate": 200, "composition": "46-0-0", "N": 46, "P": 0, "K": 0},
            "DAP": {"rate": 150, "composition": "18-46-0", "N": 18, "P": 46, "K": 0},
            "MOP": {"rate": 100, "composition": "0-0-60", "N": 0, "P": 0, "K": 60}
        },
        "alternatives": [
            {"name": "NPK 12-32-16", "rate": 200, "composition": "12-32-16"},
            {"name": "Ammonium Sulphate", "rate": 250, "composition": "21-0-0"}
        ],
        "base_yield": 5.5,  # tons/hectare
        "yield_response": 0.85  # yield response factor (0-1)
    },
    "wheat": {
        "recommended": {
            "DAP": {"rate": 150, "composition": "18-46-0", "N": 18, "P": 46, "K": 0},
            "Urea": {"rate": 180, "composition": "46-0-0", "N": 46, "P": 0, "K": 0},
            "MOP": {"rate": 80, "composition": "0-0-60", "N": 0, "P": 0, "K": 60}
        },
        "alternatives": [
            {"name": "NPK 10-26-26", "rate": 180, "composition": "10-26-26"},
            {"name": "SSP", "rate": 200, "composition": "0-16-0"}
        ],
        "base_yield": 4.8,
        "yield_response": 0.82
    },
    "maize": {
        "recommended": {
            "DAP": {"rate": 180, "composition": "18-46-0", "N": 18, "P": 46, "K": 0},
            "Urea": {"rate": 220, "composition": "46-0-0", "N": 46, "P": 0, "K": 0},
            "MOP": {"rate": 120, "composition": "0-0-60", "N": 0, "P": 0, "K": 60}
        },
        "alternatives": [
            {"name": "NPK 12-32-16", "rate": 220, "composition": "12-32-16"},
            {"name": "Ammonium Sulphate", "rate": 280, "composition": "21-0-0"}
        ],
        "base_yield": 6.2,
        "yield_response": 0.88
    },
    "cotton": {
        "recommended": {
            "DAP": {"rate": 160, "composition": "18-46-0", "N": 18, "P": 46, "K": 0},
            "Urea": {"rate": 200, "composition": "46-0-0", "N": 46, "P": 0, "K": 0},
            "MOP": {"rate": 140, "composition": "0-0-60", "N": 0, "P": 0, "K": 60}
        },
        "alternatives": [
            {"name": "NPK 10-26-26", "rate": 200, "composition": "10-26-26"},
            {"name": "SSP", "rate": 180, "composition": "0-16-0"}
        ],
        "base_yield": 3.2,
        "yield_response": 0.75
    },
    "sugarcane": {
        "recommended": {
            "DAP": {"rate": 200, "composition": "18-46-0", "N": 18, "P": 46, "K": 0},
            "Urea": {"rate": 250, "composition": "46-0-0", "N": 46, "P": 0, "K": 0},
            "MOP": {"rate": 180, "composition": "0-0-60", "N": 0, "P": 0, "K": 60}
        },
        "alternatives": [
            {"name": "NPK 12-32-16", "rate": 250, "composition": "12-32-16"},
            {"name": "Ammonium Sulphate", "rate": 300, "composition": "21-0-0"}
        ],
        "base_yield": 70,
        "yield_response": 0.9
    },
    "groundnut": {
        "recommended": {
            "SSP": {"rate": 200, "composition": "0-16-0", "N": 0, "P": 16, "K": 0},
            "MOP": {"rate": 100, "composition": "0-0-60", "N": 0, "P": 0, "K": 60},
            "Urea": {"rate": 80, "composition": "46-0-0", "N": 46, "P": 0, "K": 0}
        },
        "alternatives": [
            {"name": "DAP", "rate": 120, "composition": "18-46-0"},
            {"name": "NPK 10-26-26", "rate": 150, "composition": "10-26-26"}
        ],
        "base_yield": 2.5,
        "yield_response": 0.7
    }
}

# ============================================
# REAL-TIME PRICE FETCHING
# ============================================

def get_fertilizer_prices():
    """
    Fetch real-time fertilizer prices
    In production, this would call an API like AGMARKNET [citation:1]
    """
    # Base prices (₹ per kg)
    base_prices = {
        "Urea": 6.50,
        "DAP": 27.50,
        "MOP": 16.00,
        "NPK 10-26-26": 24.00,
        "NPK 12-32-16": 26.50,
        "Ammonium Sulphate": 8.50,
        "SSP": 11.00
    }
    
    # Add small random variation to simulate real-time changes (±5%)
    import random
    prices = {}
    for fert, price in base_prices.items():
        variation = random.uniform(0.95, 1.05)
        prices[fert] = round(price * variation, 2)
    
    return prices

def get_crop_market_price(crop):
    """
    Fetch current market price for crops
    Would integrate with government APIs in production [citation:5]
    """
    market_prices = {
        "rice": 2200,      # ₹ per quintal
        "wheat": 2150,
        "maize": 1850,
        "cotton": 6500,
        "sugarcane": 350,
        "groundnut": 5500,
        "soyabean": 4800,
        "potato": 1200,
        "tomato": 1500,
        "onion": 1800
    }
    return market_prices.get(crop.lower(), 2000)

# ============================================
# YIELD PREDICTION MODEL
# ============================================

def predict_yield(crop, soil_n, soil_p, soil_k, area_ha):
    """
    Predict yield based on soil nutrients and fertilizer application
    Uses response factor model similar to agricultural research [citation:3][citation:6]
    """
    crop_data = FERTILIZER_DB.get(crop.lower())
    if not crop_data:
        return 0
    
    base_yield = crop_data["base_yield"]
    response_factor = crop_data["yield_response"]
    
    # Calculate nutrient adequacy (0-1 scale)
    n_adequacy = min(soil_n / 100, 1.0)
    p_adequacy = min(soil_p / 80, 1.0)
    k_adequacy = min(soil_k / 80, 1.0)
    
    # Combined soil health factor
    soil_factor = (n_adequacy * 0.4 + p_adequacy * 0.3 + k_adequacy * 0.3)
    
    # Predicted yield (tons/hectare)
    predicted_yield = base_yield * (0.5 + 0.5 * soil_factor) * response_factor
    
    # Total yield for the area
    total_yield = predicted_yield * area_ha
    
    return round(total_yield, 2)

# ============================================
# BUDGET OPTIMIZATION ROUTE
# ============================================

@budget_bp.route("/optimize-budget", methods=["POST"])
def optimize_budget():
    """
    Optimize fertilizer purchase within budget
    """
    try:
        data = request.json
        
        crop = data.get("crop", "").lower()
        budget = float(data.get("budget", 0))
        area = float(data.get("area", 1))  # hectares
        soil_n = float(data.get("soil_n", 50))
        soil_p = float(data.get("soil_p", 40))
        soil_k = float(data.get("soil_k", 30))
        
        if not crop or crop not in FERTILIZER_DB:
            return jsonify({"error": "Invalid or unsupported crop"}), 400
        
        # Get real-time prices
        prices = get_fertilizer_prices()
        crop_price = get_crop_market_price(crop)
        
        crop_data = FERTILIZER_DB[crop]
        recommended = crop_data["recommended"]
        
        # Calculate optimal combination
        optimal_combo = []
        total_cost = 0
        remaining_budget = budget
        
        # Sort fertilizers by priority (based on crop needs)
        priority_order = ["DAP", "Urea", "MOP", "SSP", "NPK 12-32-16", "NPK 10-26-26", "Ammonium Sulphate"]
        
        for fert_name in priority_order:
            if fert_name in recommended:
                fert_info = recommended[fert_name]
                rate_per_ha = fert_info["rate"]
                
                # Calculate quantity needed for the area
                quantity_needed = rate_per_ha * area
                cost = quantity_needed * prices.get(fert_name, 20)
                
                if cost <= remaining_budget:
                    # Can afford full recommended quantity
                    optimal_combo.append({
                        "name": fert_name,
                        "quantity_kg": round(quantity_needed, 2),
                        "price_per_kg": prices.get(fert_name, 20),
                        "total_cost": round(cost, 2),
                        "composition": fert_info["composition"],
                        "is_recommended": True
                    })
                    total_cost += cost
                    remaining_budget -= cost
                else:
                    # Partial quantity based on budget
                    if remaining_budget > 0:
                        affordable_qty = remaining_budget / prices.get(fert_name, 20)
                        if affordable_qty > 10:  # Only if at least 10kg
                            optimal_combo.append({
                                "name": fert_name,
                                "quantity_kg": round(affordable_qty, 2),
                                "price_per_kg": prices.get(fert_name, 20),
                                "total_cost": round(remaining_budget, 2),
                                "composition": fert_info["composition"],
                                "is_recommended": True,
                                "note": "Partial quantity due to budget constraint"
                            })
                            total_cost += remaining_budget
                            remaining_budget = 0
        
        # Predict yield with this fertilizer combination
        # Using NPK from the combination to estimate soil improvement
        total_n = sum(item.get("quantity_kg", 0) * (recommended.get(item["name"], {}).get("N", 0) / 100) for item in optimal_combo if "N" in item.get("composition", ""))
        total_p = sum(item.get("quantity_kg", 0) * (recommended.get(item["name"], {}).get("P", 0) / 100) for item in optimal_combo if "P" in item.get("composition", ""))
        total_k = sum(item.get("quantity_kg", 0) * (recommended.get(item["name"], {}).get("K", 0) / 100) for item in optimal_combo if "K" in item.get("composition", ""))
        
        # Combine with existing soil nutrients
        effective_n = soil_n + total_n / area
        effective_p = soil_p + total_p / area
        effective_k = soil_k + total_k / area
        
        predicted_yield = predict_yield(crop, effective_n, effective_p, effective_k, area)
        expected_revenue = predicted_yield * 10 * crop_price  # Convert tons to quintals (1 ton = 10 quintals)
        
        # Generate alternative budget scenarios
        alternatives = []
        for budget_multiplier in [0.5, 0.75, 1.25, 1.5]:
            alt_budget = budget * budget_multiplier
            alt_combo = []
            alt_remaining = alt_budget
            
            for fert_name in priority_order:
                if fert_name in recommended:
                    fert_info = recommended[fert_name]
                    rate_per_ha = fert_info["rate"]
                    quantity_needed = rate_per_ha * area
                    cost = quantity_needed * prices.get(fert_name, 20)
                    
                    if cost <= alt_remaining:
                        alt_combo.append({
                            "name": fert_name,
                            "quantity_kg": round(quantity_needed, 2),
                            "total_cost": round(cost, 2)
                        })
                        alt_remaining -= cost
            
            if alt_combo:
                alternatives.append({
                    "budget": round(alt_budget, 2),
                    "combo": alt_combo,
                    "remaining": round(alt_remaining, 2)
                })
        
        response = {
            "success": True,
            "crop": crop.title(),
            "area_hectares": area,
            "total_budget": budget,
            "total_spent": round(total_cost, 2),
            "remaining_budget": round(remaining_budget, 2),
            "optimal_combination": optimal_combo,
            "predicted_yield_tons": predicted_yield,
            "expected_revenue_rs": round(expected_revenue, 2),
            "profit_estimate": round(expected_revenue - total_cost, 2),
            "roi_percentage": round(((expected_revenue - total_cost) / total_cost * 100), 2) if total_cost > 0 else 0,
            "market_price_per_quintal": crop_price,
            "current_fertilizer_prices": prices,
            "alternative_scenarios": alternatives,
            "recommendations": [
                f"🌾 Expected yield: {predicted_yield} tons from {area} hectares",
                f"💰 Estimated revenue: ₹{round(expected_revenue, 2)} at current market price",
                f"📈 ROI: {round(((expected_revenue - total_cost) / total_cost * 100), 2) if total_cost > 0 else 0}%",
                f"💡 {'Budget sufficient for all recommended fertilizers' if remaining_budget >= 0 else 'Consider increasing budget for optimal yield'}"
            ]
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================
# PRICE UPDATE ROUTE (for real-time data)
# ============================================

@budget_bp.route("/current-prices", methods=["GET"])
def current_prices():
    """Get current fertilizer and crop prices"""
    prices = get_fertilizer_prices()
    
    # Sample crop prices
    crop_prices = {
        "rice": get_crop_market_price("rice"),
        "wheat": get_crop_market_price("wheat"),
        "maize": get_crop_market_price("maize"),
        "cotton": get_crop_market_price("cotton")
    }
    
    return jsonify({
        "success": True,
        "fertilizer_prices": prices,
        "crop_prices": crop_prices,
        "last_updated": datetime.now().isoformat(),
        "source": "AGMARKNET (simulated) [citation:1]"
    })