#!/usr/bin/env python3
"""
Pokemon Card Collection Manager - Backend API Testing
Tests all backend endpoints for functionality and integration
"""

import requests
import sys
import json
from datetime import datetime

class PokemonAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.admin_credentials = {
            "email": "admin@pokemon.com",
            "password": "Admin123!"
        }
        self.test_user_credentials = {
            "email": "test@pokemon.com", 
            "password": "Test123!",
            "name": "Test User"
        }

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            self.failed_tests.append({"name": name, "details": details})
            print(f"❌ {name} - {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200, auth_required=False):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response
            
        except Exception as e:
            return False, str(e)

    def test_health_check(self):
        """Test health endpoint"""
        success, response = self.make_request('GET', 'health')
        if success:
            data = response.json()
            self.log_test("Health Check", 
                         "status" in data and data["status"] == "healthy",
                         f"Response: {data}")
        else:
            self.log_test("Health Check", False, f"Request failed: {response}")

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.make_request(
            'POST', 'auth/login', 
            self.admin_credentials
        )
        if success:
            data = response.json()
            self.log_test("Admin Login", 
                         "email" in data and data["email"] == self.admin_credentials["email"],
                         f"User: {data.get('name', 'Unknown')}")
            return True
        else:
            self.log_test("Admin Login", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.make_request(
            'POST', 'auth/register',
            self.test_user_credentials,
            expected_status=200
        )
        if success:
            data = response.json()
            self.log_test("User Registration", 
                         "email" in data and data["email"] == self.test_user_credentials["email"])
            return True
        else:
            # User might already exist, try login instead
            success, response = self.make_request(
                'POST', 'auth/login',
                {
                    "email": self.test_user_credentials["email"],
                    "password": self.test_user_credentials["password"]
                }
            )
            if success:
                self.log_test("User Registration", True, "User already exists, login successful")
                return True
            else:
                self.log_test("User Registration", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
                return False

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        success, response = self.make_request('GET', 'auth/me')
        if success:
            data = response.json()
            self.log_test("Auth Me", 
                         "email" in data,
                         f"User: {data.get('email', 'Unknown')}")
        else:
            self.log_test("Auth Me", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_logout(self):
        """Test logout"""
        success, response = self.make_request('POST', 'auth/logout')
        self.log_test("Logout", success, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_pokemon_search(self):
        """Test Pokemon TCG API search"""
        success, response = self.make_request('GET', 'pokemon/search?q=pikachu')
        if success:
            data = response.json()
            self.log_test("Pokemon Search", 
                         "cards" in data,
                         f"Found {len(data.get('cards', []))} cards")
        else:
            self.log_test("Pokemon Search", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_cards_crud(self):
        """Test cards CRUD operations"""
        # Test GET cards (empty initially)
        success, response = self.make_request('GET', 'cards')
        if success:
            data = response.json()
            self.log_test("Get Cards", "cards" in data, f"Cards count: {len(data.get('cards', []))}")
        else:
            self.log_test("Get Cards", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
            return

        # Test POST card
        test_card = {
            "pokemon_name": "Pikachu",
            "card_name": "Pikachu Test Card",
            "set_name": "Test Set",
            "card_number": "001",
            "image_url": "https://example.com/pikachu.jpg",
            "price": 25.50,
            "condition": "mint",
            "quantity": 1,
            "rarity": "rare"
        }
        
        success, response = self.make_request('POST', 'cards', test_card, expected_status=200)
        if success:
            data = response.json()
            card_id = data.get('_id')
            self.log_test("Create Card", card_id is not None, f"Card ID: {card_id}")
            
            if card_id:
                # Test PUT card (update)
                update_data = {"price": 30.00}
                success, response = self.make_request('PUT', f'cards/{card_id}', update_data)
                self.log_test("Update Card", success, f"Updated price to 30.00")
                
                # Test DELETE card
                success, response = self.make_request('DELETE', f'cards/{card_id}')
                self.log_test("Delete Card", success, "Card deleted")
        else:
            self.log_test("Create Card", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_stats(self):
        """Test statistics endpoint"""
        success, response = self.make_request('GET', 'stats')
        if success:
            data = response.json()
            self.log_test("Get Stats", 
                         "total_cards" in data and "total_value" in data,
                         f"Stats: {data}")
        else:
            self.log_test("Get Stats", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_share(self):
        """Test share functionality"""
        success, response = self.make_request('POST', 'share')
        if success:
            data = response.json()
            share_token = data.get('share_token')
            self.log_test("Create Share Link", 
                         share_token is not None,
                         f"Token: {share_token}")
            
            if share_token:
                # Test accessing shared collection
                success, response = self.make_request('GET', f'share/{share_token}')
                if success:
                    data = response.json()
                    self.log_test("Access Shared Collection",
                                 "collector_name" in data and "cards" in data,
                                 f"Collector: {data.get('collector_name', 'Unknown')}")
                else:
                    self.log_test("Access Shared Collection", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")
        else:
            self.log_test("Create Share Link", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🧪 Starting Pokemon Card Collection Manager API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Test health first
        self.test_health_check()
        
        # Test authentication flow
        if self.test_admin_login():
            self.test_auth_me()
            
            # Test Pokemon search (external API)
            self.test_pokemon_search()
            
            # Test cards CRUD
            self.test_cards_crud()
            
            # Test stats
            self.test_stats()
            
            # Test sharing
            self.test_share()
            
            # Test logout
            self.test_logout()
        
        # Test user registration
        self.test_user_registration()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed tests:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = PokemonAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())