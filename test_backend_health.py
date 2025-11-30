#!/usr/bin/env python3
"""
Test Backend Health
"""
import requests
import time
import sys

print("Testing backend health...")
time.sleep(2)  # Wait for server to start

try:
    response = requests.get('http://localhost:5000/api/health', timeout=5)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
