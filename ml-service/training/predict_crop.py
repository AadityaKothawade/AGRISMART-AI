import numpy as np
import pickle
from rotation_logic import adjust_scores

# Load model
model = pickle.load(open("crop_recommendation_model.pkl", "rb"))


def recommend_crops(
    N,
    P,
    K,
    temperature,
    rainfall,
    ph,
    previous_crop=None,
    season=None
):

    humidity = rainfall * 0.8

    input_data = np.array([[N, P, K, temperature, humidity, ph, rainfall]])

    probs = model.predict_proba(input_data)[0]

    top5_idx = np.argsort(probs)[-5:][::-1]

    crops = model.classes_[top5_idx]
    scores = probs[top5_idx]

    return adjust_scores(crops, scores, previous_crop, season)


# Example test
if __name__ == "__main__":

    result = recommend_crops(
        N=80,
        P=40,
        K=40,
        temperature=29,
        rainfall=300,
        ph=5.6,
        previous_crop="wheat",
        season="kharif"
    )

    for r in result:
        print(r)