"""
Test suite for Pokemon Card Binder new features:
- Binders (Classeurs) CRUD
- Cards by Set grouping
- Vitrine (Public Showcase)
- Auth with admin and child roles
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://build-on-code-1.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@pokemon.com"
ADMIN_PASSWORD = "Admin123!"
CHILD_EMAIL = "leo@pokemon.com"
CHILD_PASSWORD = "Pokemon123"


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestAdminAuth:
    """Admin authentication tests"""
    
    def test_admin_login(self):
        """Test admin login returns correct role"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        assert "id" in data
        print(f"✓ Admin login successful: {data['email']} (role: {data['role']})")
        return session
    
    def test_admin_me_endpoint(self):
        """Test /auth/me returns admin user"""
        session = requests.Session()
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        
        # Get current user
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        data = me_resp.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print(f"✓ Admin /auth/me verified: {data['email']}")


class TestChildAuth:
    """Child account authentication tests"""
    
    def test_child_login(self):
        """Test child login returns correct role"""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CHILD_EMAIL,
            "password": CHILD_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == CHILD_EMAIL
        assert data["role"] == "child"
        print(f"✓ Child login successful: {data['email']} (role: {data['role']})")
        return session


class TestBindersCRUD:
    """Binders (Classeurs) CRUD operations - Admin only"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def child_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CHILD_EMAIL,
            "password": CHILD_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_binders(self, admin_session):
        """Test GET /api/binders returns binders list"""
        response = admin_session.get(f"{BASE_URL}/api/binders")
        assert response.status_code == 200
        data = response.json()
        assert "binders" in data
        assert isinstance(data["binders"], list)
        print(f"✓ GET /api/binders returned {len(data['binders'])} binders")
    
    def test_create_binder(self, admin_session):
        """Test POST /api/binders creates a new binder"""
        binder_data = {
            "name": "TEST_Binder_Creation",
            "description": "Test binder for automated testing",
            "color": "from-blue-500 to-cyan-500"
        }
        response = admin_session.post(f"{BASE_URL}/api/binders", json=binder_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == binder_data["name"]
        assert data["description"] == binder_data["description"]
        assert data["color"] == binder_data["color"]
        assert "_id" in data
        print(f"✓ Created binder: {data['name']} (id: {data['_id']})")
        
        # Cleanup - delete the test binder
        delete_resp = admin_session.delete(f"{BASE_URL}/api/binders/{data['_id']}")
        assert delete_resp.status_code == 200
        print(f"✓ Cleaned up test binder")
    
    def test_delete_binder(self, admin_session):
        """Test DELETE /api/binders/:id deletes a binder"""
        # First create a binder to delete
        binder_data = {
            "name": "TEST_Binder_To_Delete",
            "description": "Will be deleted",
            "color": "from-red-500 to-pink-500"
        }
        create_resp = admin_session.post(f"{BASE_URL}/api/binders", json=binder_data)
        assert create_resp.status_code == 200
        binder_id = create_resp.json()["_id"]
        
        # Delete the binder
        delete_resp = admin_session.delete(f"{BASE_URL}/api/binders/{binder_id}")
        assert delete_resp.status_code == 200
        data = delete_resp.json()
        assert "message" in data
        print(f"✓ Deleted binder: {binder_id}")
        
        # Verify it's gone
        get_resp = admin_session.get(f"{BASE_URL}/api/binders")
        binders = get_resp.json()["binders"]
        binder_ids = [b["_id"] for b in binders]
        assert binder_id not in binder_ids
        print(f"✓ Verified binder no longer exists")
    
    def test_child_cannot_create_binder(self, child_session):
        """Test that child accounts cannot create binders"""
        binder_data = {
            "name": "TEST_Child_Binder",
            "description": "Should fail",
            "color": "from-green-500 to-emerald-500"
        }
        response = child_session.post(f"{BASE_URL}/api/binders", json=binder_data)
        assert response.status_code == 403
        print(f"✓ Child correctly denied binder creation (403)")
    
    def test_child_cannot_delete_binder(self, admin_session, child_session):
        """Test that child accounts cannot delete binders"""
        # Admin creates a binder
        binder_data = {
            "name": "TEST_Binder_Child_Delete_Attempt",
            "description": "Child should not be able to delete",
            "color": "from-purple-500 to-pink-500"
        }
        create_resp = admin_session.post(f"{BASE_URL}/api/binders", json=binder_data)
        assert create_resp.status_code == 200
        binder_id = create_resp.json()["_id"]
        
        # Child tries to delete
        delete_resp = child_session.delete(f"{BASE_URL}/api/binders/{binder_id}")
        assert delete_resp.status_code == 403
        print(f"✓ Child correctly denied binder deletion (403)")
        
        # Cleanup - admin deletes
        admin_session.delete(f"{BASE_URL}/api/binders/{binder_id}")


class TestCardsBySet:
    """Cards grouped by set endpoint"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_cards_by_set(self, admin_session):
        """Test GET /api/cards/by-set returns cards grouped by set"""
        response = admin_session.get(f"{BASE_URL}/api/cards/by-set")
        assert response.status_code == 200
        data = response.json()
        assert "sets" in data
        assert isinstance(data["sets"], list)
        
        # If there are sets, verify structure
        if len(data["sets"]) > 0:
            first_set = data["sets"][0]
            assert "set_name" in first_set
            assert "count" in first_set
            assert "total_value" in first_set
            assert "cards" in first_set
            print(f"✓ GET /api/cards/by-set returned {len(data['sets'])} sets")
            print(f"  First set: {first_set['set_name']} ({first_set['count']} cards, {first_set['total_value']}€)")
        else:
            print(f"✓ GET /api/cards/by-set returned empty (no cards in collection)")


class TestVitrine:
    """Vitrine (Public Showcase) endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    @pytest.fixture
    def child_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": CHILD_EMAIL,
            "password": CHILD_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_admin_create_vitrine(self, admin_session):
        """Test POST /api/vitrine/create creates a vitrine token"""
        response = admin_session.post(f"{BASE_URL}/api/vitrine/create", json={
            "title": "TEST_Vitrine",
            "description": "Test vitrine for automated testing"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert len(data["token"]) > 0
        print(f"✓ Created vitrine with token: {data['token'][:10]}...")
        return data["token"]
    
    def test_get_vitrine_public(self, admin_session):
        """Test GET /api/vitrine/:token returns public vitrine data"""
        # First create a vitrine
        create_resp = admin_session.post(f"{BASE_URL}/api/vitrine/create", json={
            "title": "TEST_Public_Vitrine",
            "description": "Public test vitrine"
        })
        assert create_resp.status_code == 200
        token = create_resp.json()["token"]
        
        # Get vitrine (no auth needed - public endpoint)
        public_session = requests.Session()
        response = public_session.get(f"{BASE_URL}/api/vitrine/{token}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "title" in data
        assert "collector_name" in data
        assert "cards" in data
        assert "stats" in data
        assert "total_cards" in data["stats"]
        assert "total_value" in data["stats"]
        assert "unique_pokemon" in data["stats"]
        assert "type_distribution" in data["stats"]
        assert "set_distribution" in data["stats"]
        
        print(f"✓ GET /api/vitrine/{token[:10]}... returned vitrine data")
        print(f"  Title: {data['title']}")
        print(f"  Cards: {data['stats']['total_cards']}, Value: {data['stats']['total_value']}€")
    
    def test_child_cannot_create_vitrine(self, child_session):
        """Test that child accounts cannot create vitrines"""
        response = child_session.post(f"{BASE_URL}/api/vitrine/create", json={
            "title": "TEST_Child_Vitrine",
            "description": "Should fail"
        })
        assert response.status_code == 403
        print(f"✓ Child correctly denied vitrine creation (403)")
    
    def test_invalid_vitrine_token(self):
        """Test GET /api/vitrine/:token with invalid token returns 404"""
        response = requests.get(f"{BASE_URL}/api/vitrine/invalid_token_12345")
        assert response.status_code == 404
        print(f"✓ Invalid vitrine token correctly returns 404")


class TestLogout:
    """Logout functionality"""
    
    def test_logout(self):
        """Test POST /api/auth/logout clears session"""
        session = requests.Session()
        
        # Login first
        login_resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert login_resp.status_code == 200
        
        # Verify logged in
        me_resp = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp.status_code == 200
        
        # Logout
        logout_resp = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_resp.status_code == 200
        data = logout_resp.json()
        assert "message" in data
        print(f"✓ Logout successful")
        
        # Verify logged out (should fail to get /auth/me)
        me_resp_after = session.get(f"{BASE_URL}/api/auth/me")
        assert me_resp_after.status_code == 401
        print(f"✓ Session cleared after logout (401 on /auth/me)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
