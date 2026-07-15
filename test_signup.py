import urllib.request
import json

url = "http://localhost:8000/api/auth/signup"
data = json.dumps({"email": "test2@test.com", "password": "password123", "full_name": "Test"}).encode("utf-8")
headers = {"Content-Type": "application/json"}

req = urllib.request.Request(url, data=data, headers=headers, method="POST")
try:
    with urllib.request.urlopen(req) as f:
        print(f.status)
        print(f.read().decode("utf-8"))
except Exception as e:
    print(e)
    if hasattr(e, "read"):
        print(e.read().decode("utf-8"))
