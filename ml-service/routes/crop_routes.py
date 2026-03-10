# ml-service/routes/crop_routes.py

from flask import Blueprint, request, jsonify
import numpy as np
import pickle
import os

crop_bp = Blueprint('crop', __name__)

# ============================================
# LOAD CROP RECOMMENDATION MODEL
# ============================================
print("\n" + "="*60)
print("🌾 LOADING CROP RECOMMENDATION MODEL")
print("="*60)

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
CROP_MODEL_PATH = os.path.join(MODELS_DIR, "crop_recommendation_model.pkl")

# Load crop model
try:
    with open(CROP_MODEL_PATH, 'rb') as f:
        crop_model = pickle.load(f)
    print("✅ Crop recommendation model loaded successfully")
    print(f"   Model type: {type(crop_model).__name__}")
except Exception as e:
    print(f"❌ Error loading crop model: {e}")
    crop_model = None

# ============================================
# Nitrogen fixing crops (from training code)
# ============================================
nitrogen_fixing = {
    "soyabean", "moong", "blackgram", "horsegram"
}

# Heavy nitrogen consuming crops
heavy_nitrogen = {
    "rice", "wheat", "maize", "cotton", "jowar"
}

# Seasonal crops
kharif_crops = {
    "rice", "maize", "cotton", "jowar", "soyabean"
}

rabi_crops = {
    "wheat", "barley"
}

zaid_crops = {
    "watermelon", "cucumber", "pumpkin"
}

# ============================================
# ADJUST SCORES FUNCTION (exactly from training code)
# ============================================

def adjust_scores(crops, scores, previous_crop=None, season=None):
    """Adjust crop scores based on rotation and season - EXACT MATCH to training code"""
    recommendations = []

    for crop, score in zip(crops, scores):
        adjusted_score = score
        reason = "Suitable soil conditions"

        if previous_crop:
            previous_crop = previous_crop.lower()

            if previous_crop in heavy_nitrogen and crop in nitrogen_fixing:
                adjusted_score += 0.15
                reason = "Recommended for crop rotation (restores nitrogen)"

            if previous_crop == crop:
                adjusted_score -= 0.2
                reason = "Avoid growing same crop consecutively"

        if season:
            season = season.lower()

            if season == "kharif" and crop in kharif_crops:
                adjusted_score += 0.05

            if season == "rabi" and crop in rabi_crops:
                adjusted_score += 0.05

            if season == "zaid" and crop in zaid_crops:
                adjusted_score += 0.05

        recommendations.append({
            "crop": crop,
            "score": adjusted_score,
            "reason": reason
        })

    recommendations = sorted(
        recommendations,
        key=lambda x: x["score"],
        reverse=True
    )

    return recommendations[:3]  # Return top 3

# ============================================
# PREDICT CROPS ROUTE (exactly matching your FastAPI code)
# ============================================

@crop_bp.route("/predict-crops", methods=["POST"])
def predict_crops():
    """
    Predict crops based on soil and climate parameters
    Exact implementation matching your FastAPI code
    """
    try:
        if crop_model is None:
            return jsonify({"error": "Crop recommendation model not loaded"}), 500

        data = request.json

        # Extract values exactly as in FastAPI
        N = float(data.get("N"))
        P = float(data.get("P"))
        K = float(data.get("K"))
        temperature = float(data.get("temperature"))
        rainfall = float(data.get("rainfall"))
        ph = float(data.get("ph"))
        
        # Optional fields
        previous_crop = data.get("previous_crop")
        season = data.get("season")

        # Calculate humidity as per training code
        humidity = rainfall * 0.8

        # Prepare input data exactly as in training
        input_data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])

        # Get prediction probabilities
        probs = crop_model.predict_proba(input_data)[0]

        # Get top 5 indices
        top5_idx = np.argsort(probs)[-5:][::-1]

        # Get crop names and scores
        crops = crop_model.classes_[top5_idx]
        scores = probs[top5_idx]

        # Apply crop rotation and season adjustments
        recommendations = adjust_scores(crops, scores, previous_crop, season)

        return jsonify({"recommendations": recommendations})

    except Exception as e:
        return jsonify({"error": str(e)}), 500