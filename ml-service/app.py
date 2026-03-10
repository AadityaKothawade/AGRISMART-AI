# ml-service/app.py

from flask import Flask
from flask_cors import CORS
import torch
import torch.nn as nn
from torchvision import models, transforms
import warnings
import os
warnings.filterwarnings('ignore')

# Import routes
from routes.health_routes import health_bp
from routes.seed_routes import seed_bp
from routes.crop_routes import crop_bp  # New crop routes


# ============================================
# GLOBAL MODEL CONFIGURATION
# ============================================
print("\n" + "="*60)
print("🚀 LOADING SOYBEAN SEED DETECTION MODEL (PyTorch)")
print("="*60)

# Updated model path to models folder
MODEL_PATH = os.path.join("models", "best_seed_model.pth")
IMG_SIZE = (224, 224)

CLASS_LABELS = [
    "Broken soybeans",
    "Immature soybeans",
    "Intact soybeans",
    "Skin-damaged soybeans",
    "Spotted soybeans"
]

# Severity mapping
SEVERITY_MAP = {
    "Intact soybeans": 0,
    "Spotted soybeans": 1,
    "Skin-damaged soybeans": 1,
    "Immature soybeans": 2,
    "Broken soybeans": 2
}

# Recommendations mapping
RECOMMENDATIONS_MAP = {
    0: ["Seeds appear healthy. Suitable for planting."],
    1: ["Moderate damage detected. Inspect seeds before planting."],
    2: [
        "High damage detected. Consider sourcing new seeds.",
        "Check storage conditions for remaining seeds."
    ]
}

# Device configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Load PyTorch model
try:
    # Check if model file exists
    if not os.path.exists(MODEL_PATH):
        print(f"❌ Model file not found at: {MODEL_PATH}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Files in models folder: {os.listdir('models') if os.path.exists('models') else 'models folder not found'}")
        model = None
    else:
        # Create model architecture
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(CLASS_LABELS))
        
        # Load weights
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        model = model.to(device)
        model.eval()
        print("✅ Soybean model loaded successfully (PyTorch)")
        print(f"📁 Model loaded from: {MODEL_PATH}")
except Exception as e:
    print(f"❌ Error loading soybean model: {e}")
    model = None

# Image transforms for PyTorch model
transform = transforms.Compose([
    transforms.Resize(IMG_SIZE),
    transforms.ToTensor()
])

# Create Flask app
app = Flask(__name__)
CORS(app)

# Store model and configurations in app config for routes to access
app.config['MODEL'] = model
app.config['DEVICE'] = device
app.config['TRANSFORM'] = transform
app.config['CLASS_LABELS'] = CLASS_LABELS
app.config['SEVERITY_MAP'] = SEVERITY_MAP
app.config['RECOMMENDATIONS_MAP'] = RECOMMENDATIONS_MAP
app.config['IMG_SIZE'] = IMG_SIZE
app.config['MODEL_PATH'] = MODEL_PATH

# Register blueprints
app.register_blueprint(health_bp)
app.register_blueprint(seed_bp)
app.register_blueprint(crop_bp)  # Register new crop routes

# ============================================
# RUN SERVER
# ============================================
if __name__ == "__main__":
    print("\n" + "="*60)
    print("🚀 AGRI SMART AI - COMPLETE ML SERVICE")
    print("="*60)
    print("📡 Server starting on http://127.0.0.1:5001")
    print("\n📊 Available Endpoints:")
    print("   - GET  /health                         : Health check")
    print("   - POST /predict                         : Single seed prediction")
    print("   - POST /predict_batch                    : Batch seed prediction")
    print("   - POST /predict_with_explanation         : Seed analysis with Grad-CAM")
    print("   - POST /predict-crops                    : Crop recommendations (NEW)")

    print("\n✅ All models loaded!")
    print("="*60 + "\n")
    
    app.run(port=5001, debug=True)