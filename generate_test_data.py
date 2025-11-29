import requests
import csv
import random
import time
import argparse
import sys

def get_base_urls(host):
    return f"http://{host}:8000/api/auth", f"http://{host}:8001/api"

def register_user(base_url, name, email, password, role='traveler'):
    try:
        # Try login first
        resp = requests.post(f"{base_url}/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            print(f"User {email} already exists.")
            return True
        
        # If not, signup
        resp = requests.post(f"{base_url}/signup", json={"name": name, "email": email, "password": password})
        if resp.status_code == 201:
            print(f"Registered {email}")
            return True
        else:
            print(f"Failed to register {email}: {resp.text}")
            return False
    except Exception as e:
        print(f"Error registering {email}: {e}")
        return False

def generate_data(host):
    TRAVELER_AUTH_URL, OWNER_API_URL = get_base_urls(host)
    
    # Generate 500 Travelers
    print(f"Generating Travelers on {host}...")
    with open('travelers.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        # No header for JMeter CSV by default if we ignore first line = false
        for i in range(1, 501):
            email = f"traveler{i}@test.com"
            password = "password123"
            name = f"Traveler {i}"
            writer.writerow([email, password])
            register_user(TRAVELER_AUTH_URL, name, email, password)

    # Generate 50 Owners
    print(f"Generating Owners on {host}...")
    with open('owners.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        for i in range(1, 51):
            email = f"owner{i}@test.com"
            password = "password123"
            name = f"Owner {i}"
            writer.writerow([email, password])
            # Register as traveler first
            if register_user(TRAVELER_AUTH_URL, name, email, password):
                # Enable host mode
                # Login to get cookie
                s = requests.Session()
                s.post(f"{TRAVELER_AUTH_URL}/login", json={"email": email, "password": password})
                # Get token
                t_resp = s.post(f"{TRAVELER_AUTH_URL}/session-token")
                if t_resp.status_code == 200:
                    token = t_resp.json()['token']
                    # Exchange
                    o_resp = requests.post(f"{OWNER_API_URL}/auth/exchange", json={"token": token})
                    if o_resp.status_code == 200:
                        owner_cookies = o_resp.cookies
                        
                        # Enable host
                        h_resp = requests.post(f"{OWNER_API_URL}/host/enable", cookies=owner_cookies)
                        if h_resp.status_code == 200:
                            print(f"Enabled host for {email}")
                            
                            # Create a property
                            prop_data = {
                                "title": f"Test Property {i}",
                                "description": "A lovely place for testing",
                                "price": random.randint(50, 500),
                                "city": "Test City",
                                "type": "Apartment",
                                "capacity": 4,
                                "bedrooms": 2,
                                "bathrooms": 1,
                                "amenities": ["Wifi", "Kitchen"]
                            }
                            p_resp = requests.post(f"{OWNER_API_URL}/properties", json=prop_data, cookies=owner_cookies)
                            if p_resp.status_code == 201:
                                print(f"Created property for {email}")
                            else:
                                print(f"Failed to create property: {p_resp.status_code} {p_resp.text}")
                                
                        else:
                            print(f"Failed to enable host for {email}: {h_resp.text}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Generate test data for Airbnb Prototype')
    parser.add_argument('--host', default='localhost', help='Target host IP (default: localhost)')
    args = parser.parse_args()
    
    generate_data(args.host)
