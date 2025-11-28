import requests
import csv
import random
import time

BASE_URL = "http://localhost:8000/api/auth"

def register_user(name, email, password, role='traveler'):
    try:
        # Try login first
        resp = requests.post(f"{BASE_URL}/login", json={"email": email, "password": password})
        if resp.status_code == 200:
            print(f"User {email} already exists.")
            return True
        
        # If not, signup
        resp = requests.post(f"{BASE_URL}/signup", json={"name": name, "email": email, "password": password})
        if resp.status_code == 201:
            print(f"Registered {email}")
            return True
        else:
            print(f"Failed to register {email}: {resp.text}")
            return False
    except Exception as e:
        print(f"Error registering {email}: {e}")
        return False

def generate_data():
    # Generate 500 Travelers
    print("Generating Travelers...")
    with open('travelers.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        # No header for JMeter CSV by default if we ignore first line = false
        for i in range(1, 501):
            email = f"traveler{i}@test.com"
            password = "password123"
            name = f"Traveler {i}"
            writer.writerow([email, password])
            register_user(name, email, password)

    # Generate 50 Owners
    print("Generating Owners...")
    with open('owners.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        for i in range(1, 51):
            email = f"owner{i}@test.com"
            password = "password123"
            name = f"Owner {i}"
            writer.writerow([email, password])
            # Register as traveler first
            if register_user(name, email, password):
                # Enable host mode
                # Login to get cookie
                s = requests.Session()
                s.post(f"{BASE_URL}/login", json={"email": email, "password": password})
                # Get token
                t_resp = s.post(f"{BASE_URL}/session-token")
                if t_resp.status_code == 200:
                    token = t_resp.json()['token']
                    # Exchange
                    # Owner API is on 8001
                    o_resp = requests.post("http://localhost:8001/api/auth/exchange", json={"token": token})
                    if o_resp.status_code == 200:
                        # Enable Host
                        # Need to set cookie for owner session? 
                        # The exchange sets the cookie in the response.
                        # requests.Session handles cookies automatically if we use the same session object? 
                        # No, different domain/port usually means different cookies, but localhost is same domain.
                        # However, we need to capture the cookie from 8001 response.
                        owner_cookies = o_resp.cookies
                        
                        # Enable host
                        h_resp = requests.post("http://localhost:8001/api/auth/host/enable", cookies=owner_cookies)
                        if h_resp.status_code == 200:
                            print(f"Enabled host for {email}")
                            
                            # Create a property
                            prop_data = {
                                "title": f"Test Property {i}",
                                "description": "A lovely place for testing",
                                "price": random.randint(50, 500),
                                "city": "Test City",
                                # "country": "Test Country", # Not allowed by schema
                                "type": "Apartment",
                                "capacity": 4,
                                "bedrooms": 2,
                                "bathrooms": 1,
                                "amenities": ["Wifi", "Kitchen"]
                            }
                            # Property API is on 8001 (Owner Service)
                            p_resp = requests.post("http://localhost:8001/api/properties", json=prop_data, cookies=owner_cookies)
                            if p_resp.status_code == 201:
                                print(f"Created property for {email}")
                            else:
                                print(f"Failed to create property: {p_resp.status_code} {p_resp.text}")
                                
                        else:
                            print(f"Failed to enable host for {email}: {h_resp.text}")

if __name__ == "__main__":
    generate_data()
