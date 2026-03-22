from flask import Blueprint, request, jsonify, current_app
import pickle
import numpy as np
import os
import warnings
warnings.filterwarnings('ignore')

# Create blueprint
fertilizer_bp = Blueprint('fertilizer', __name__)

# Load fertilizer model
MODEL_PATH = os.path.join("models", "fertilizer_model.pkl")

# Fertilizer recommendations mapping
FERTILIZER_RECOMMENDATIONS = {
    "Urea": {
        "composition": {"N": 46, "P": 0, "K": 0},
        "price_per_kg": 25,
        "application_rate": "120-150 kg/ha",
        "description": "High nitrogen fertilizer for vegetative growth",
        "suitable_crops": ["maize", "wheat", "rice", "sugarcane"]
    },
    "DAP": {
        "composition": {"N": 18, "P": 46, "K": 0},
        "price_per_kg": 30,
        "application_rate": "100-120 kg/ha",
        "description": "Phosphorus-rich fertilizer for root development",
        "suitable_crops": ["wheat", "rice", "maize", "cotton", "groundnut"]
    },
    "MOP": {
        "composition": {"N": 0, "P": 0, "K": 60},
        "price_per_kg": 28,
        "application_rate": "50-80 kg/ha",
        "description": "Potassium fertilizer for disease resistance",
        "suitable_crops": ["potato", "banana", "sugarcane", "cotton"]
    },
    "NPK 10-26-26": {
        "composition": {"N": 10, "P": 26, "K": 26},
        "price_per_kg": 35,
        "application_rate": "150-200 kg/ha",
        "description": "Balanced fertilizer for oilseed crops",
        "suitable_crops": ["groundnut", "soyabean", "rapeseed", "sunflower"]
    },
    "NPK 12-32-16": {
        "composition": {"N": 12, "P": 32, "K": 16},
        "price_per_kg": 38,
        "application_rate": "120-150 kg/ha",
        "description": "High phosphorus for pulse crops",
        "suitable_crops": ["pigeonpea", "moong", "blackgram", "chickpea"]
    },
    "NPK 15-15-15": {
        "composition": {"N": 15, "P": 15, "K": 15},
        "price_per_kg": 32,
        "application_rate": "100-150 kg/ha",
        "description": "General purpose balanced fertilizer",
        "suitable_crops": ["rice", "wheat", "maize", "vegetables"]
    },
    "NPK 20-20-0": {
        "composition": {"N": 20, "P": 20, "K": 0},
        "price_per_kg": 30,
        "application_rate": "80-120 kg/ha",
        "description": "Nitrogen and Phosphorus blend",
        "suitable_crops": ["maize", "cotton", "sugarcane"]
    },
    "Single Super Phosphate": {
        "composition": {"N": 0, "P": 16, "K": 0},
        "price_per_kg": 22,
        "application_rate": "200-250 kg/ha",
        "description": "Low-cost phosphorus source",
        "suitable_crops": ["all crops", "pulses", "oilseeds"]
    },
    "Muriate of Potash": {
        "composition": {"N": 0, "P": 0, "K": 60},
        "price_per_kg": 28,
        "application_rate": "50-80 kg/ha",
        "description": "High potassium for quality improvement",
        "suitable_crops": ["potato", "banana", "tobacco", "fruits"]
    },
    "Ammonium Sulphate": {
        "composition": {"N": 21, "P": 0, "K": 0, "S": 24},
        "price_per_kg": 26,
        "application_rate": "100-150 kg/ha",
        "description": "Nitrogen with sulfur for oilseed crops",
        "suitable_crops": ["groundnut", "soyabean", "onion", "garlic"]
    },
    "Complex 17:17:17": {
        "composition": {"N": 17, "P": 17, "K": 17},
        "price_per_kg": 36,
        "application_rate": "120-180 kg/ha",
        "description": "Complete NPK complex for all crops",
        "suitable_crops": ["all crops", "vegetables", "fruits"]
    }
}

# Crop-specific fertilizer recommendations
CROP_SPECIFIC_FERTILIZERS = {
    "rice": {
        "basal": ["DAP", "NPK 15-15-15"],
        "top_dressing": ["Urea"],
        "recommendations": [
            "Apply DAP or NPK 15-15-15 as basal dose",
            "Top dress with Urea at tillering and panicle initiation",
            "Apply zinc sulfate if deficiency observed"
        ]
    },
    "wheat": {
        "basal": ["DAP", "NPK 15-15-15"],
        "top_dressing": ["Urea"],
        "recommendations": [
            "Apply DAP at sowing time",
            "Split Urea application: half at sowing, half at first irrigation",
            "Consider potash if soil test shows deficiency"
        ]
    },
    "maize": {
        "basal": ["DAP", "NPK 20-20-0"],
        "top_dressing": ["Urea", "NPK 15-15-15"],
        "recommendations": [
            "Apply DAP or NPK 20-20-0 at sowing",
            "Top dress with Urea at knee-high stage",
            "Side dress with NPK at tasseling if needed"
        ]
    },
    "cotton": {
        "basal": ["DAP", "NPK 15-15-15"],
        "top_dressing": ["Urea", "MOP"],
        "recommendations": [
            "Apply DAP at sowing",
            "Split nitrogen application: 50% at sowing, 50% at flowering",
            "Apply potash at flowering for boll development"
        ]
    },
    "sugarcane": {
        "basal": ["DAP", "NPK 15-15-15"],
        "top_dressing": ["Urea", "MOP"],
        "recommendations": [
            "Apply full P and K at planting",
            "Split nitrogen: at planting, tillering, and grand growth",
            "Apply additional potash for sugar content"
        ]
    },
    "groundnut": {
        "basal": ["DAP", "Single Super Phosphate"],
        "top_dressing": ["Ammonium Sulphate"],
        "recommendations": [
            "Apply phosphorus-rich fertilizers at sowing",
            "Use gypsum as calcium source at flowering",
            "Avoid excess nitrogen to prevent vegetative growth"
        ]
    },
    "soyabean": {
        "basal": ["DAP", "NPK 10-26-26"],
        "top_dressing": ["Ammonium Sulphate"],
        "recommendations": [
            "Apply phosphorus and potassium at sowing",
            "Inoculate seeds with Rhizobium for nitrogen fixation",
            "Apply sulfur if soil is deficient"
        ]
    },
    "potato": {
        "basal": ["NPK 15-15-15", "MOP"],
        "top_dressing": ["Urea", "MOP"],
        "recommendations": [
            "Apply full NPK at planting",
            "Earthing up with additional potash",
            "Avoid excess nitrogen to prevent hollow heart"
        ]
    },
    "onion": {
        "basal": ["DAP", "NPK 15-15-15"],
        "top_dressing": ["Ammonium Sulphate", "MOP"],
        "recommendations": [
            "Apply phosphorus at transplanting",
            "Split nitrogen: at transplanting, 30, and 45 DAT",
            "Apply potash for bulb development"
        ]
    },
    "banana": {
        "basal": ["NPK 15-15-15", "MOP"],
        "top_dressing": ["Urea", "MOP"],
        "recommendations": [
            "Apply high potassium for fruit quality",
            "Split applications every 2-3 months",
            "Apply magnesium if deficiency observed"
        ]
    }
}

def load_fertilizer_model():
    """Load the pickle model for fertilizer recommendation"""
    try:
        if os.path.exists(MODEL_PATH):
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            print(f"✅ Fertilizer model loaded from {MODEL_PATH}")
            return model
        else:
            print(f"❌ Fertilizer model not found at {MODEL_PATH}")
            return None
    except Exception as e:
        print(f"❌ Error loading fertilizer model: {e}")
        return None

# Load model at module level
fertilizer_model = load_fertilizer_model()

def calculate_npk_deficiency(soil_n, soil_p, soil_k, crop_requirements):
    """
    Calculate NPK deficiency based on crop requirements
    Returns deficiency in kg/ha
    """
    # Default crop requirements (kg/ha)
    default_requirements = {
        "rice": {"N": 120, "P": 60, "K": 60},
        "wheat": {"N": 150, "P": 75, "K": 75},
        "maize": {"N": 180, "P": 90, "K": 90},
        "cotton": {"N": 150, "P": 60, "K": 60},
        "sugarcane": {"N": 250, "P": 100, "K": 100},
        "groundnut": {"N": 40, "P": 80, "K": 80},
        "soyabean": {"N": 30, "P": 90, "K": 90},
        "potato": {"N": 200, "P": 100, "K": 150},
        "onion": {"N": 150, "P": 75, "K": 75},
        "banana": {"N": 300, "P": 150, "K": 300},
        "vegetables": {"N": 150, "P": 100, "K": 100}
    }
    
    req = default_requirements.get(crop_requirements, default_requirements["rice"])
    
    # Convert soil ppm to kg/ha (assuming 2.24 conversion factor for 0-15 cm depth)
    # 1 ppm = 2.24 kg/ha for top 15 cm soil
    soil_n_kg = float(soil_n or 50) * 2.24
    soil_p_kg = float(soil_p or 40) * 2.24
    soil_k_kg = float(soil_k or 30) * 2.24
    
    # Calculate deficiency
    deficiency = {
        "N": max(0, req["N"] - soil_n_kg),
        "P": max(0, req["P"] - soil_p_kg),
        "K": max(0, req["K"] - soil_k_kg)
    }
    
    return deficiency

def recommend_fertilizers(deficiency, crop, budget=5000):
    """
    Recommend fertilizers based on NPK deficiency and budget
    """
    recommendations = []
    total_cost = 0
    
    # Sort fertilizers by how well they match the deficiency
    for name, details in FERTILIZER_RECOMMENDATIONS.items():
        # Skip if not suitable for this crop
        if crop not in details["suitable_crops"] and "all crops" not in details["suitable_crops"]:
            continue
            
        # Calculate how much of each nutrient this fertilizer provides
        n_provided = details["composition"]["N"]
        p_provided = details["composition"]["P"]
        k_provided = details["composition"]["K"]
        
        # Calculate match score (higher is better)
        score = 0
        if deficiency["N"] > 0 and n_provided > 0:
            score += n_provided / 46 * 100  # 46 is max N in Urea
        if deficiency["P"] > 0 and p_provided > 0:
            score += p_provided / 46 * 100
        if deficiency["K"] > 0 and k_provided > 0:
            score += k_provided / 60 * 100  # 60 is max K in MOP
            
        # Calculate quantity needed and cost
        if score > 0:
            # Estimate quantity based on most deficient nutrient
            max_deficiency = max(deficiency.values())
            if max_deficiency > 0:
                # Calculate quantity in kg
                if n_provided > 0:
                    quantity = deficiency["N"] / (n_provided / 100)  # Convert to kg of fertilizer
                elif p_provided > 0:
                    quantity = deficiency["P"] / (p_provided / 100)
                else:
                    quantity = deficiency["K"] / (k_provided / 100)
                
                # Round to nearest 50kg bag
                quantity = max(50, round(quantity / 50) * 50)
                cost = quantity * details["price_per_kg"]
                
                # Check if within budget
                if total_cost + cost <= budget:
                    recommendations.append({
                        "name": name,
                        "quantity": quantity,
                        "cost": cost,
                        "price_per_kg": details["price_per_kg"],
                        "composition": details["composition"],
                        "description": details["description"],
                        "application_rate": details["application_rate"],
                        "score": score
                    })
                    total_cost += cost
    
    # Sort by score (best match first)
    recommendations.sort(key=lambda x: x["score"], reverse=True)
    
    return recommendations, total_cost

@fertilizer_bp.route('/recommend-fertilizer', methods=['POST'])
def recommend_fertilizer():
    """
    Endpoint to recommend fertilizers based on soil nutrients and crop
    Expected JSON:
    {
        "crop": "rice",
        "nitrogen": 50,      # soil N in mg/kg
        "phosphorous": 40,   # soil P in mg/kg
        "potassium": 30,     # soil K in mg/kg
        "budget": 5000,      # optional budget in rupees
        "area": 1            # optional area in hectares
    }
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['crop', 'nitrogen', 'phosphorous', 'potassium']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        crop = data['crop'].lower()
        nitrogen = float(data['nitrogen'])
        phosphorous = float(data['phosphorous'])
        potassium = float(data['potassium'])
        budget = float(data.get('budget', 5000))
        area = float(data.get('area', 1))  # area in hectares
        
        # Calculate NPK deficiency
        deficiency = calculate_npk_deficiency(nitrogen, phosphorous, potassium, crop)
        
        # Get crop-specific recommendations
        crop_advice = CROP_SPECIFIC_FERTILIZERS.get(crop, {
            "basal": ["DAP", "Urea"],
            "top_dressing": ["Urea"],
            "recommendations": ["Use balanced fertilization based on soil test"]
        })
        
        # Get fertilizer recommendations
        recommendations, total_cost = recommend_fertilizers(deficiency, crop, budget)
        
        # If model is available, use it for predictions
        model_prediction = None
        if fertilizer_model is not None:
            try:
                # Prepare features for model
                features = np.array([[nitrogen, phosphorous, potassium, 
                                    deficiency['N'], deficiency['P'], deficiency['K']]])
                
                # Make prediction (assuming model returns fertilizer class)
                prediction = fertilizer_model.predict(features)
                model_prediction = prediction.tolist() if hasattr(prediction, 'tolist') else str(prediction)
            except Exception as e:
                print(f"Model prediction error: {e}")
                model_prediction = "Model prediction failed"
        
        # Prepare response
        response = {
            'success': True,
            'crop': crop,
            'soil_nutrients': {
                'nitrogen': nitrogen,
                'phosphorous': phosphorous,
                'potassium': potassium
            },
            'deficiency': {
                'N': round(deficiency['N'], 2),
                'P': round(deficiency['P'], 2),
                'K': round(deficiency['K'], 2)
            },
            'recommendations': recommendations,
            'total_cost': total_cost,
            'budget_remaining': budget - total_cost,
            'crop_advice': crop_advice,
            'area': area,
            'application_schedule': [
                f"Basal dose: Apply {' + '.join(crop_advice['basal'][:2])}",
                f"Top dressing: Apply {crop_advice['top_dressing'][0]} in split doses",
                "Follow soil test recommendations for micronutrients"
            ],
            'model_prediction': model_prediction,
            'message': f"Recommended {len(recommendations)} fertilizer types within ₹{budget} budget"
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@fertilizer_bp.route('/fertilizer-options', methods=['GET'])
def get_fertilizer_options():
    """Get all available fertilizer options"""
    return jsonify({
        'success': True,
        'fertilizers': FERTILIZER_RECOMMENDATIONS
    }), 200

@fertilizer_bp.route('/crop-fertilizer-guide/<crop>', methods=['GET'])
def get_crop_fertilizer_guide(crop):
    """Get fertilizer guide for specific crop"""
    crop = crop.lower()
    guide = CROP_SPECIFIC_FERTILIZERS.get(crop)
    
    if guide:
        return jsonify({
            'success': True,
            'crop': crop,
            'guide': guide
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': f'No guide found for crop: {crop}'
        }), 404