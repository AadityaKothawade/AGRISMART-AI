# Nitrogen fixing crops
nitrogen_fixing = {
    "soyabean",
    "moong",
    "blackgram",
    "horsegram"
}

# Heavy nitrogen consuming crops
heavy_nitrogen = {
    "rice",
    "wheat",
    "maize",
    "cotton",
    "jowar"
}

# Seasonal crops
kharif_crops = {
    "rice",
    "maize",
    "cotton",
    "jowar",
    "soyabean"
}

rabi_crops = {
    "wheat",
    "barley"
}

zaid_crops = {
    "watermelon",
    "cucumber",
    "pumpkin"
}


def adjust_scores(crops, scores, previous_crop=None, season=None):

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

    return recommendations[:3]