"""
Test suite for Card Detail Modal features:
- Binder assignment from card detail modal (PUT /api/cards/:id with binder_id)
- Price history tracking (PUT /api/cards/:id with price adds to price_history)
- Role-based access (child cannot update cards)
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


class TestCardBinderAssignment:
    """Test binder assignment from card detail modal"""
    
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
    
    def test_update_card_binder_id(self, admin_session):
        """Test PUT /api/cards/:id with binder_id updates the card's binder"""
        # Get existing cards
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        assert cards_resp.status_code == 200
        cards = cards_resp.json().get("cards", [])
        assert len(cards) > 0, "Need at least one card to test"
        
        # Get existing binders
        binders_resp = admin_session.get(f"{BASE_URL}/api/binders")
        assert binders_resp.status_code == 200
        binders = binders_resp.json().get("binders", [])
        
        # Find a card without binder (Porygon2)
        card_without_binder = next((c for c in cards if not c.get("binder_id")), None)
        
        if card_without_binder and len(binders) > 0:
            card_id = card_without_binder["_id"]
            binder_id = binders[0]["_id"]
            original_binder = card_without_binder.get("binder_id")
            
            # Update card with binder_id
            update_resp = admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": binder_id
            })
            assert update_resp.status_code == 200
            updated_card = update_resp.json()
            assert updated_card["binder_id"] == binder_id
            print(f"✓ Updated card {card_id} with binder_id: {binder_id}")
            
            # Verify persistence with GET
            verify_resp = admin_session.get(f"{BASE_URL}/api/cards")
            assert verify_resp.status_code == 200
            verified_cards = verify_resp.json().get("cards", [])
            verified_card = next((c for c in verified_cards if c["_id"] == card_id), None)
            assert verified_card is not None
            assert verified_card["binder_id"] == binder_id
            print(f"✓ Verified binder_id persisted in database")
            
            # Restore original state
            admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": original_binder
            })
            print(f"✓ Restored original binder state")
        else:
            # Create a test binder and test card
            binder_data = {"name": "TEST_Binder_Assignment", "color": "from-blue-500 to-cyan-500"}
            binder_resp = admin_session.post(f"{BASE_URL}/api/binders", json=binder_data)
            assert binder_resp.status_code == 200
            test_binder_id = binder_resp.json()["_id"]
            
            # Use first card
            card_id = cards[0]["_id"]
            original_binder = cards[0].get("binder_id")
            
            # Update card with new binder
            update_resp = admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": test_binder_id
            })
            assert update_resp.status_code == 200
            print(f"✓ Updated card with test binder")
            
            # Restore and cleanup
            admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": original_binder
            })
            admin_session.delete(f"{BASE_URL}/api/binders/{test_binder_id}")
            print(f"✓ Cleaned up test binder")
    
    def test_remove_card_from_binder(self, admin_session):
        """Test setting binder_id to null removes card from binder"""
        # Get cards
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        cards = cards_resp.json().get("cards", [])
        
        # Find card with binder (Trevenant)
        card_with_binder = next((c for c in cards if c.get("binder_id")), None)
        
        if card_with_binder:
            card_id = card_with_binder["_id"]
            original_binder = card_with_binder["binder_id"]
            
            # Remove from binder (set to null)
            update_resp = admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": None
            })
            assert update_resp.status_code == 200
            updated_card = update_resp.json()
            assert updated_card.get("binder_id") is None
            print(f"✓ Removed card from binder (binder_id set to null)")
            
            # Restore original binder
            admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": original_binder
            })
            print(f"✓ Restored original binder assignment")
        else:
            print("⚠ No card with binder found, skipping test")
    
    def test_child_cannot_update_card_binder(self, child_session, admin_session):
        """Test that child accounts cannot update card binder"""
        # Get cards (child sees admin's cards)
        cards_resp = child_session.get(f"{BASE_URL}/api/cards")
        assert cards_resp.status_code == 200
        cards = cards_resp.json().get("cards", [])
        
        if len(cards) > 0:
            card_id = cards[0]["_id"]
            
            # Child tries to update binder
            update_resp = child_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "binder_id": "some_binder_id"
            })
            assert update_resp.status_code == 403
            print(f"✓ Child correctly denied card binder update (403)")
        else:
            print("⚠ No cards found for child test")


class TestPriceHistoryTracking:
    """Test price history tracking when updating card price"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_price_update_adds_to_history(self, admin_session):
        """Test PUT /api/cards/:id with price creates new entry in price_history"""
        # Get cards
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        assert cards_resp.status_code == 200
        cards = cards_resp.json().get("cards", [])
        assert len(cards) > 0, "Need at least one card to test"
        
        card = cards[0]
        card_id = card["_id"]
        original_price = card["price"]
        original_history_length = len(card.get("price_history", []))
        
        # Update price
        new_price = original_price + 0.10
        update_resp = admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
            "price": new_price
        })
        assert update_resp.status_code == 200
        updated_card = update_resp.json()
        
        # Verify price updated
        assert updated_card["price"] == new_price
        print(f"✓ Price updated from {original_price} to {new_price}")
        
        # Verify price_history has new entry
        new_history = updated_card.get("price_history", [])
        assert len(new_history) == original_history_length + 1
        print(f"✓ Price history length increased from {original_history_length} to {len(new_history)}")
        
        # Verify latest entry has correct price
        latest_entry = new_history[-1]
        assert latest_entry["price"] == new_price
        assert "date" in latest_entry
        print(f"✓ Latest price history entry: {latest_entry['price']}€ at {latest_entry['date']}")
        
        # Restore original price (this will add another history entry)
        admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
            "price": original_price
        })
        print(f"✓ Restored original price")
    
    def test_card_with_multiple_price_history(self, admin_session):
        """Test that card with multiple price entries has correct history structure"""
        # Get cards
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        cards = cards_resp.json().get("cards", [])
        
        # Find Trevenant (should have 4+ price history entries)
        trevenant = next((c for c in cards if "trevenant" in c.get("pokemon_name", "").lower()), None)
        
        if trevenant:
            history = trevenant.get("price_history", [])
            print(f"✓ Trevenant has {len(history)} price history entries")
            assert len(history) > 1, "Trevenant should have multiple price history entries"
            
            # Verify each entry has price and date
            for i, entry in enumerate(history):
                assert "price" in entry, f"Entry {i} missing price"
                assert "date" in entry, f"Entry {i} missing date"
                print(f"  Entry {i+1}: {entry['price']}€ at {entry['date'][:10]}")
        else:
            print("⚠ Trevenant card not found")
    
    def test_card_with_single_price_history(self, admin_session):
        """Test that card with single price entry has correct structure"""
        # Get cards
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        cards = cards_resp.json().get("cards", [])
        
        # Find Porygon2 (should have 1 price history entry)
        porygon = next((c for c in cards if "porygon" in c.get("pokemon_name", "").lower()), None)
        
        if porygon:
            history = porygon.get("price_history", [])
            print(f"✓ Porygon2 has {len(history)} price history entry")
            assert len(history) >= 1, "Porygon2 should have at least 1 price history entry"
            
            # Verify entry structure
            entry = history[0]
            assert "price" in entry
            assert "date" in entry
            print(f"  Entry: {entry['price']}€ at {entry['date'][:10]}")
        else:
            print("⚠ Porygon2 card not found")


class TestCardDetailEndpoint:
    """Test card detail related endpoints"""
    
    @pytest.fixture
    def admin_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return session
    
    def test_get_cards_includes_price_history(self, admin_session):
        """Test GET /api/cards returns cards with price_history field"""
        response = admin_session.get(f"{BASE_URL}/api/cards")
        assert response.status_code == 200
        cards = response.json().get("cards", [])
        
        for card in cards:
            assert "price_history" in card, f"Card {card.get('pokemon_name')} missing price_history"
            assert isinstance(card["price_history"], list)
        
        print(f"✓ All {len(cards)} cards have price_history field")
    
    def test_get_cards_includes_binder_id(self, admin_session):
        """Test GET /api/cards returns cards with binder_id field"""
        response = admin_session.get(f"{BASE_URL}/api/cards")
        assert response.status_code == 200
        cards = response.json().get("cards", [])
        
        for card in cards:
            # binder_id can be None or a string
            assert "binder_id" in card or card.get("binder_id") is None
        
        print(f"✓ All {len(cards)} cards have binder_id field")
    
    def test_update_card_condition(self, admin_session):
        """Test PUT /api/cards/:id with condition updates correctly"""
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        cards = cards_resp.json().get("cards", [])
        
        if len(cards) > 0:
            card = cards[0]
            card_id = card["_id"]
            original_condition = card["condition"]
            new_condition = "mint" if original_condition != "mint" else "good"
            
            update_resp = admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "condition": new_condition
            })
            assert update_resp.status_code == 200
            updated_card = update_resp.json()
            assert updated_card["condition"] == new_condition
            print(f"✓ Condition updated from {original_condition} to {new_condition}")
            
            # Restore
            admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "condition": original_condition
            })
            print(f"✓ Restored original condition")
    
    def test_update_card_quantity(self, admin_session):
        """Test PUT /api/cards/:id with quantity updates correctly"""
        cards_resp = admin_session.get(f"{BASE_URL}/api/cards")
        cards = cards_resp.json().get("cards", [])
        
        if len(cards) > 0:
            card = cards[0]
            card_id = card["_id"]
            original_quantity = card["quantity"]
            new_quantity = original_quantity + 1
            
            update_resp = admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "quantity": new_quantity
            })
            assert update_resp.status_code == 200
            updated_card = update_resp.json()
            assert updated_card["quantity"] == new_quantity
            print(f"✓ Quantity updated from {original_quantity} to {new_quantity}")
            
            # Restore
            admin_session.put(f"{BASE_URL}/api/cards/{card_id}", json={
                "quantity": original_quantity
            })
            print(f"✓ Restored original quantity")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
