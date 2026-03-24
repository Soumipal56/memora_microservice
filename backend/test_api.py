import requests
import json

url = "http://localhost:8000/api/ingest"
data = {"url": "https://en.wikipedia.org/wiki/Artificial_intelligence"}

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print("Response Content:")
    print(response.text)
except Exception as e:
    print(f"Request failed: {e}")
