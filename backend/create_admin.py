import requests
import json

# Backend URL
BACKEND_URL = "https://synapseai-backend-910625707162.asia-south1.run.app"

# Admin data
admin_data = {
    "email": "admin@synapseai.com",
    "password": "Admin@123",
    "full_name": "System Administrator",
    "role": "admin"
}

# Call signup API
response = requests.post(
    f"{BACKEND_URL}/api/v1/auth/signup",
    json=admin_data
)

print(f"Status Code: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
