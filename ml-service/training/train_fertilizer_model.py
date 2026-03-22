# ml-service/training/train_fertilizer_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import pickle
import os

def generate_synthetic_data(n_samples=10000):
    """Generate synthetic fertilizer recommendation data"""
    np.random.seed(42)
    
    data = []
    
    crops = ['rice', 'wheat', 'maize', 'cotton', 'sugarcane', 'groundnut', 'soyabean']
    soil_types = ['Sandy', 'Loamy', 'Clayey', 'Black', 'Red']
    
    # Crop nutrient requirements (kg/ha)
    crop_req = {
        'rice': {'N': 120, 'P': 60, 'K': 60},
        'wheat': {'N': 150, 'P': 75, 'K': 75},
        'maize': {'N': 135, 'P': 65, 'K': 65},
        'cotton': {'N': 100, 'P': 50, 'K': 50},
        'sugarcane': {'N': 200, 'P': 100, 'K': 100},
        'groundnut': {'N': 40, 'P': 80, 'K': 60},
        'soyabean': {'N': 30, 'P': 90, 'K': 70}
    }
    
    for _ in range(n_samples):
        crop = np.random.choice(crops)
        soil_type = np.random.choice(soil_types)
        area = np.random.uniform(0.5, 10)  # hectares
        budget = np.random.uniform(5000, 50000)  # ₹
        
        # Soil test values (mg/kg)
        soil_n = np.random.uniform(10, 150)
        soil_p = np.random.uniform(5, 100)
        soil_k = np.random.uniform(5, 150)
        soil_ph = np.random.uniform(5.5, 8.5)
        soil_moisture = np.random.uniform(10, 60)
        temperature = np.random.uniform(15, 40)
        humidity = np.random.uniform(30, 90)
        
        # Calculate required NPK
        req = crop_req[crop]
        
        # Convert soil mg/kg to kg/ha (approximate)
        soil_n_kg = soil_n * 2.24
        soil_p_kg = soil_p * 2.24
        soil_k_kg = soil_k * 2.24
        
        # Calculate needed fertilizer (kg/ha)
        n_needed = max(0, req['N'] - soil_n_kg)
        p_needed = max(0, req['P'] - soil_p_kg)
        k_needed = max(0, req['K'] - soil_k_kg)
        
        # Calculate optimal fertilizer amounts (simplified)
        urea = n_needed * area / 0.46  # Urea has 46% N
        dap = p_needed * area / 0.46  # DAP has 46% P2O5
        mop = k_needed * area / 0.6   # MOP has 60% K2O
        
        data.append({
            'crop': crop,
            'soil_type': soil_type,
            'area': area,
            'budget': budget,
            'soil_n': soil_n,
            'soil_p': soil_p,
            'soil_k': soil_k,
            'soil_ph': soil_ph,
            'soil_moisture': soil_moisture,
            'temperature': temperature,
            'humidity': humidity,
            'urea_recommended': max(0, urea),
            'dap_recommended': max(0, dap),
            'mop_recommended': max(0, mop)
        })
    
    return pd.DataFrame(data)

def train_model():
    """Train fertilizer recommendation model"""
    print("Generating synthetic training data...")
    df = generate_synthetic_data(10000)
    
    # Prepare features
    feature_cols = ['area', 'budget', 'soil_n', 'soil_p', 'soil_k', 'soil_ph', 
                   'soil_moisture', 'temperature', 'humidity']
    
    # One-hot encode categorical variables
    df_encoded = pd.get_dummies(df, columns=['crop', 'soil_type'])
    
    # Get all feature columns (including encoded ones)
    encoded_cols = [col for col in df_encoded.columns if col not in 
                   ['urea_recommended', 'dap_recommended', 'mop_recommended']]
    
    X = df_encoded[encoded_cols]
    y_urea = df_encoded['urea_recommended']
    y_dap = df_encoded['dap_recommended']
    y_mop = df_encoded['mop_recommended']
    
    # Split data
    X_train, X_test, y_train_urea, y_test_urea = train_test_split(X, y_urea, test_size=0.2, random_state=42)
    _, _, y_train_dap, y_test_dap = train_test_split(X, y_dap, test_size=0.2, random_state=42)
    _, _, y_train_mop, y_test_mop = train_test_split(X, y_mop, test_size=0.2, random_state=42)
    
    # Train models
    print("Training Random Forest models...")
    model_urea = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model_dap = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    model_mop = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    
    model_urea.fit(X_train, y_train_urea)
    model_dap.fit(X_train, y_train_dap)
    model_mop.fit(X_train, y_train_mop)
    
    # Evaluate
    urea_pred = model_urea.predict(X_test)
    dap_pred = model_dap.predict(X_test)
    mop_pred = model_mop.predict(X_test)
    
    print(f"\nModel Performance:")
    print(f"Urea - R2 Score: {r2_score(y_test_urea, urea_pred):.3f}")
    print(f"Urea - RMSE: {np.sqrt(mean_squared_error(y_test_urea, urea_pred)):.2f} kg")
    print(f"DAP - R2 Score: {r2_score(y_test_dap, dap_pred):.3f}")
    print(f"DAP - RMSE: {np.sqrt(mean_squared_error(y_test_dap, dap_pred)):.2f} kg")
    print(f"MOP - R2 Score: {r2_score(y_test_mop, mop_pred):.3f}")
    print(f"MOP - RMSE: {np.sqrt(mean_squared_error(y_test_mop, mop_pred)):.2f} kg")
    
    # Save models
    model_path = os.path.join('models', 'fertilizer_model.pkl')
    
    # Create a combined model object
    combined_model = {
        'model_urea': model_urea,
        'model_dap': model_dap,
        'model_mop': model_mop,
        'feature_columns': encoded_cols,
        'crop_requirements': crop_req
    }
    
    with open(model_path, 'wb') as f:
        pickle.dump(combined_model, f)
    
    print(f"\n✅ Model saved to {model_path}")
    
    return combined_model

if __name__ == "__main__":
    train_model()