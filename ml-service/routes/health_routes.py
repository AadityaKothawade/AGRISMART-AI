# ml-service/routes/health_routes.py

from flask import Blueprint, jsonify, current_app
from datetime import datetime

health_bp = Blueprint('health', __name__)

@health_bp.route("/health", methods=["GET"])
def health_check():
    """Check if model is loaded properly"""
    model = current_app.config.get('MODEL')
    device = current_app.config.get('DEVICE')
    model_path = current_app.config.get('MODEL_PATH')
    
    return jsonify({
        "status": "healthy",
        "soybean_model": model is not None,
        "model_path": model_path,
        "device": str(device),
        "timestamp": datetime.now().isoformat()
    })