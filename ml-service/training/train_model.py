import pandas as pd
import pickle
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import accuracy_score

# Load datasets
train_df = pd.read_csv("Train Dataset.csv")
test_df = pd.read_csv("Test Dataset.csv")

# Clean dataset
for df in [train_df, test_df]:

    if "Unnamed: 0" in df.columns:
        df.drop(columns=["Unnamed: 0"], inplace=True)

    df.columns = df.columns.str.lower()

    df["humidity"] = df["rainfall"] * 0.8


features = ['n','p','k','temperature','humidity','ph','rainfall']

X_train = train_df[features]
y_train = train_df["crop"]

X_test = test_df[features]
y_test = test_df["crop"]

# Train model
model = GradientBoostingClassifier(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    random_state=42
)

model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print("Model Accuracy:", accuracy)

# Save model
pickle.dump(model, open("crop_recommendation_model.pkl", "wb"))

print("Model saved successfully")