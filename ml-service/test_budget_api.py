import requests
import json

url = "http://127.0.0.1:5001/optimize-budget"

payload = {
    "crop": "rice",
    "budget": 10000,
    "area": 1.5,
    "soil_n": 45,
    "soil_p": 30,
    "soil_k": 25
}

headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print(json.dumps(response.json(), indent=2))