# ml-service/routes/seed_routes.py

from flask import Blueprint, request, jsonify, current_app
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
import io
import cv2
import base64

seed_bp = Blueprint('seed', __name__)

# ============================================
# HELPER FUNCTIONS (defined inside routes file)
# ============================================

def get_top_k_predictions(probs, class_labels, k=3):
    """Get top k predictions with confidence scores"""
    probs_np = probs.cpu().numpy()[0]
    top_indices = probs.argsort(descending=True)[0][:k].cpu().numpy()
    
    results = []
    for idx in top_indices:
        results.append({
            "class": class_labels[idx],
            "confidence": float(probs_np[idx])
        })
    
    return results

def get_quality_status(severity):
    """Get quality status based on severity"""
    if severity == 0:
        return "Good"
    elif severity == 1:
        return "Moderate"
    else:
        return "Poor"

# ============================================
# SINGLE SEED PREDICTION
# ============================================

@seed_bp.route("/predict", methods=["POST"])
def predict_single():
    """Predict soybean seed quality from a single image with enhanced response"""
    try:
        # Get model and configurations from app
        model = current_app.config.get('MODEL')
        device = current_app.config.get('DEVICE')
        transform = current_app.config.get('TRANSFORM')
        class_labels = current_app.config.get('CLASS_LABELS')
        severity_map = current_app.config.get('SEVERITY_MAP')
        recommendations_map = current_app.config.get('RECOMMENDATIONS_MAP')
        
        if model is None:
            return jsonify({"error": "Soybean model not loaded"}), 500
        
        # Get file
        files = request.files.getlist('file')
        if not files:
            files = request.files.getlist('images') or []
        
        if not files:
            return jsonify({"error": "No file provided"}), 400
        
        file = files[0]
        
        # Read image
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        # Prepare tensor
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # Predict
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = F.softmax(outputs, dim=1)
        
        probs_list = probs.cpu().numpy()[0]
        predicted_index = probs.argmax().item()
        predicted_class = class_labels[predicted_index]
        confidence = float(probs_list[predicted_index])
        
        severity = severity_map[predicted_class]
        quality_status = get_quality_status(severity)
        damaged_percentage = 100 if severity > 0 else 0
        
        # Get top predictions
        top_predictions = get_top_k_predictions(probs, class_labels, 3)
        
        result = {
            "seed_id": 1,
            "filename": file.filename,
            "classification": predicted_class,
            "confidence": confidence,
            "severity": severity,
            "top_predictions": top_predictions
        }
        
        response = {
            "success": True,
            "results": [result],
            "summary": {
                "total_seeds": 1,
                "damaged_percentage": damaged_percentage,
                "quality_status": quality_status,
                "recommendations": recommendations_map[severity]
            }
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# BATCH SEED PREDICTION
# ============================================

@seed_bp.route("/predict_batch", methods=["POST"])
def predict_batch():
    """Batch prediction of soybean seeds with enhanced response"""
    try:
        # Get model and configurations from app
        model = current_app.config.get('MODEL')
        device = current_app.config.get('DEVICE')
        transform = current_app.config.get('TRANSFORM')
        class_labels = current_app.config.get('CLASS_LABELS')
        severity_map = current_app.config.get('SEVERITY_MAP')
        
        if model is None:
            return jsonify({"error": "Soybean model not loaded"}), 500
        
        files = request.files.getlist('file')
        if not files:
            files = request.files.getlist('images') or []
        
        if not files:
            return jsonify({"error": "No files provided"}), 400

        results = {name: 0 for name in class_labels}
        detailed_results = []

        for idx, file in enumerate(files, start=1):
            img_bytes = file.read()
            image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
            
            input_tensor = transform(image).unsqueeze(0).to(device)
            
            with torch.no_grad():
                outputs = model(input_tensor)
                probs = F.softmax(outputs, dim=1)
                _, predicted = torch.max(outputs, 1)
            
            predicted_class = class_labels[predicted.item()]
            results[predicted_class] += 1
            
            # Add detailed result for each seed
            detailed_results.append({
                "seed_id": idx,
                "filename": file.filename,
                "classification": predicted_class,
                "confidence": float(probs[0][predicted.item()].item()),
                "severity": severity_map[predicted_class]
            })

        total = len(files)
        
        # Calculate damaged count
        damaged = (
            results["Broken soybeans"]
            + results["Immature soybeans"]
            + results["Skin-damaged soybeans"]
            + results["Spotted soybeans"]
        )
        
        damaged_percentage = (damaged / total) * 100 if total > 0 else 0
        
        # Determine quality status
        if damaged_percentage < 20:
            quality_status = "Good"
        elif damaged_percentage < 50:
            quality_status = "Moderate"
        else:
            quality_status = "Poor"
        
        # Generate batch recommendations
        if damaged_percentage > 50:
            recommendations = [
                "High damage detected in batch. Consider sourcing new seeds.",
                "Check storage conditions for remaining seeds."
            ]
        elif damaged_percentage > 25:
            recommendations = [
                "Moderate damage detected. Remove damaged seeds before planting.",
                "Consider using seed treatment before sowing."
            ]
        else:
            recommendations = [
                "Good quality batch. Ready for planting.",
                "Store remaining seeds in cool, dry place."
            ]
        
        return jsonify({
            "success": True,
            "results": detailed_results,
            "summary": {
                "total_seeds": total,
                "distribution": results,
                "damaged_percentage": round(damaged_percentage, 2),
                "quality_status": quality_status,
                "recommendations": recommendations
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================
# SEED PREDICTION WITH GRAD-CAM EXPLANATION
# ============================================

@seed_bp.route("/predict_with_explanation", methods=["POST"])
def predict_with_explanation():
    """Predict soybean seed quality with Grad-CAM explanation"""
    try:
        # Get model and configurations from app
        model = current_app.config.get('MODEL')
        device = current_app.config.get('DEVICE')
        transform = current_app.config.get('TRANSFORM')
        class_labels = current_app.config.get('CLASS_LABELS')
        severity_map = current_app.config.get('SEVERITY_MAP')
        recommendations_map = current_app.config.get('RECOMMENDATIONS_MAP')
        img_size = current_app.config.get('IMG_SIZE')
        
        if model is None:
            return jsonify({"error": "Soybean model not loaded"}), 500
        
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file provided"}), 400
        
        # Read image
        img_bytes = file.read()
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        # Prepare tensor
        input_tensor = transform(image).unsqueeze(0).to(device)
        
        # Prediction
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, 1)
        
        prediction = class_labels[predicted.item()]
        severity = severity_map[prediction]
        
        # GradCAM
        encoded = None
        try:
            from pytorch_grad_cam import GradCAM
            from pytorch_grad_cam.utils.image import show_cam_on_image
            
            # Target layer for Grad-CAM
            target_layer = model.features[-1]
            
            # Initialize Grad-CAM
            cam = GradCAM(model=model, target_layers=[target_layer])
            
            # Generate CAM
            grayscale_cam = cam(input_tensor=input_tensor)[0]
            
            # Prepare RGB image
            rgb_img = cv2.resize(np.array(image), img_size).astype(np.float32) / 255
            
            # Generate CAM image
            cam_image = show_cam_on_image(rgb_img, grayscale_cam, use_rgb=True)
            
            # Encode image to base64
            _, buffer = cv2.imencode(".jpg", cam_image)
            encoded = base64.b64encode(buffer).decode("utf-8")
            
        except Exception as cam_error:
            print(f"Grad-CAM error: {cam_error}")
        
        # Get top predictions
        with torch.no_grad():
            outputs = model(input_tensor)
            probs = F.softmax(outputs, dim=1)
            top_predictions = get_top_k_predictions(probs, class_labels, 3)
        
        result = {
            "seed_id": 1,
            "filename": file.filename,
            "classification": prediction,
            "confidence": float(confidence.item()),
            "severity": severity,
            "top_predictions": top_predictions
        }
        
        quality_status = get_quality_status(severity)
        damaged_percentage = 100 if severity > 0 else 0
        
        response = {
            "success": True,
            "results": [result],
            "summary": {
                "total_seeds": 1,
                "damaged_percentage": damaged_percentage,
                "quality_status": quality_status,
                "recommendations": recommendations_map[severity]
            },
            "explanation_image": encoded
        }
        
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500