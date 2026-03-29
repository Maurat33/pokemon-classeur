"""
Test Gen 1 Auto-Binder Feature
Tests the automatic assignment of Gen 1 Pokemon cards to 'Génération 1' binder

Feature requirements:
- POST /api/cards with Gen 1 Pokemon (EN or FR name) should auto-assign to 'Génération 1' binder
- POST /api/cards with non-Gen 1 Pokemon should NOT auto-assign
- Gen 1 Pokemon with suffixes (EX, VMAX, etc.) should still be detected
- 'Génération 1' binder should be auto-created if it doesn't exist
- Duplicate cards should increment quantity, not create new card
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGen1AutoBinder:
    """Tests for Gen 1 Pokemon auto-binder assignment"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin before each test"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pokemon.com",
            "password": "Admin123!"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.user_id = login_resp.json().get("id")
        yield
        # Cleanup: delete test cards created during tests
        self._cleanup_test_cards()
    
    def _cleanup_test_cards(self):
        """Delete cards created during tests (those with TEST_ prefix in card_name)"""
        try:
            cards_resp = self.session.get(f"{BASE_URL}/api/cards")
            if cards_resp.status_code == 200:
                cards = cards_resp.json().get("cards", [])
                for card in cards:
                    if card.get("card_name", "").startswith("TEST_"):
                        self.session.delete(f"{BASE_URL}/api/cards/{card['_id']}")
        except:
            pass
    
    def _create_test_card(self, pokemon_name, tcg_id=None):
        """Helper to create a test card
        Note: pokemon_name should be the actual Pokemon name (e.g., 'Pikachu', not 'TEST_Pikachu')
        The TEST_ prefix is added to card_name for cleanup purposes
        """
        card_data = {
            "pokemon_name": pokemon_name,  # Use actual Pokemon name for Gen 1 detection
            "card_name": f"TEST_{pokemon_name}",  # TEST_ prefix for cleanup
            "set_name": "Test Set",
            "card_number": "001/100",
            "image_url": "https://example.com/test.png",
            "price": 10.0,
            "condition": "good",
            "quantity": 1,
            "tcg_id": tcg_id or f"test-{pokemon_name.lower().replace(' ', '-')}-{int(time.time())}",
            "rarity": "Rare",
            "types": ["Fire"]
        }
        return self.session.post(f"{BASE_URL}/api/cards", json=card_data)
    
    # ============ Gen 1 English Names ============
    
    def test_gen1_english_pikachu_auto_binder(self):
        """POST /api/cards with Pikachu (EN Gen 1) should return auto_binder='Génération 1'"""
        resp = self._create_test_card("Pikachu")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1', got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Pikachu (EN) auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_english_charizard_auto_binder(self):
        """POST /api/cards with Charizard (EN Gen 1) should return auto_binder='Génération 1'"""
        resp = self._create_test_card("Charizard")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1', got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Charizard (EN) auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_english_mewtwo_auto_binder(self):
        """POST /api/cards with Mewtwo (EN Gen 1) should return auto_binder='Génération 1'"""
        resp = self._create_test_card("Mewtwo")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1', got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Mewtwo (EN) auto-assigned to binder_id: {data.get('binder_id')}")
    
    # ============ Gen 1 French Names ============
    
    def test_gen1_french_dracaufeu_auto_binder(self):
        """POST /api/cards with Dracaufeu (FR Gen 1 = Charizard) should return auto_binder='Génération 1'"""
        resp = self._create_test_card("Dracaufeu")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1', got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Dracaufeu (FR) auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_french_ectoplasma_auto_binder(self):
        """POST /api/cards with Ectoplasma (FR Gen 1 = Gengar) should return auto_binder='Génération 1'"""
        resp = self._create_test_card("Ectoplasma")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1', got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Ectoplasma (FR) auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_french_ronflex_auto_binder(self):
        """POST /api/cards with Ronflex (FR Gen 1 = Snorlax) should return auto_binder='Génération 1'"""
        resp = self._create_test_card("Ronflex")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1', got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Ronflex (FR) auto-assigned to binder_id: {data.get('binder_id')}")
    
    # ============ Non-Gen 1 Pokemon ============
    
    def test_non_gen1_lucario_no_auto_binder(self):
        """POST /api/cards with Lucario (Gen 4) should NOT have auto_binder"""
        resp = self._create_test_card("Lucario")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") is None, f"Expected no auto_binder for Lucario, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is None, f"Expected binder_id to be null for non-Gen 1, got: {data.get('binder_id')}"
        print(f"✓ Lucario (Gen 4) NOT auto-assigned to any binder")
    
    def test_non_gen1_greninja_no_auto_binder(self):
        """POST /api/cards with Greninja (Gen 6) should NOT have auto_binder"""
        resp = self._create_test_card("Greninja")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") is None, f"Expected no auto_binder for Greninja, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is None, f"Expected binder_id to be null for non-Gen 1, got: {data.get('binder_id')}"
        print(f"✓ Greninja (Gen 6) NOT auto-assigned to any binder")
    
    def test_non_gen1_rayquaza_no_auto_binder(self):
        """POST /api/cards with Rayquaza (Gen 3) should NOT have auto_binder"""
        resp = self._create_test_card("Rayquaza")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") is None, f"Expected no auto_binder for Rayquaza, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is None, f"Expected binder_id to be null for non-Gen 1, got: {data.get('binder_id')}"
        print(f"✓ Rayquaza (Gen 3) NOT auto-assigned to any binder")
    
    # ============ Gen 1 with Suffixes ============
    
    def test_gen1_pikachu_ex_suffix_auto_binder(self):
        """POST /api/cards with 'Pikachu EX' should still detect Gen 1"""
        resp = self._create_test_card("Pikachu EX")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1' for Pikachu EX, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Pikachu EX auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_dracaufeu_vmax_suffix_auto_binder(self):
        """POST /api/cards with 'Dracaufeu VMAX' should still detect Gen 1"""
        resp = self._create_test_card("Dracaufeu VMAX")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1' for Dracaufeu VMAX, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Dracaufeu VMAX auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_charizard_gx_suffix_auto_binder(self):
        """POST /api/cards with 'Charizard GX' should still detect Gen 1"""
        resp = self._create_test_card("Charizard GX")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1' for Charizard GX, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Charizard GX auto-assigned to binder_id: {data.get('binder_id')}")
    
    def test_gen1_mewtwo_vstar_suffix_auto_binder(self):
        """POST /api/cards with 'Mewtwo VSTAR' should still detect Gen 1"""
        resp = self._create_test_card("Mewtwo VSTAR")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        data = resp.json()
        assert data.get("auto_binder") == "Génération 1", f"Expected auto_binder='Génération 1' for Mewtwo VSTAR, got: {data.get('auto_binder')}"
        assert data.get("binder_id") is not None, "Expected binder_id to be set"
        print(f"✓ Mewtwo VSTAR auto-assigned to binder_id: {data.get('binder_id')}")
    
    # ============ Binder Creation and Reuse ============
    
    def test_gen1_binder_exists_after_adding_gen1_card(self):
        """GET /api/binders should show 'Génération 1' binder after adding a Gen 1 card"""
        # First add a Gen 1 card
        resp = self._create_test_card("Bulbasaur")
        assert resp.status_code == 200, f"Create card failed: {resp.text}"
        
        binder_id = resp.json().get("binder_id")
        
        # Check binders list
        binders_resp = self.session.get(f"{BASE_URL}/api/binders")
        assert binders_resp.status_code == 200, f"Get binders failed: {binders_resp.text}"
        
        binders = binders_resp.json().get("binders", [])
        gen1_binder = next((b for b in binders if b.get("name") == "Génération 1"), None)
        
        assert gen1_binder is not None, "Expected 'Génération 1' binder to exist"
        assert gen1_binder.get("_id") == binder_id, f"Expected binder_id to match: {binder_id}"
        print(f"✓ 'Génération 1' binder exists with id: {gen1_binder.get('_id')}")
    
    def test_gen1_binder_reused_for_multiple_cards(self):
        """Multiple Gen 1 cards should use the same 'Génération 1' binder"""
        # Add first Gen 1 card
        resp1 = self._create_test_card("Squirtle")
        assert resp1.status_code == 200
        binder_id_1 = resp1.json().get("binder_id")
        
        # Add second Gen 1 card
        resp2 = self._create_test_card("Charmander")
        assert resp2.status_code == 200
        binder_id_2 = resp2.json().get("binder_id")
        
        assert binder_id_1 == binder_id_2, f"Expected same binder_id for both Gen 1 cards: {binder_id_1} vs {binder_id_2}"
        print(f"✓ Both Gen 1 cards assigned to same binder: {binder_id_1}")
    
    # ============ Duplicate Card Handling ============
    
    def test_duplicate_card_increments_quantity(self):
        """Adding same card twice should increment quantity, not create new card"""
        unique_tcg_id = f"test-duplicate-{int(time.time())}"
        
        # Add first card
        resp1 = self._create_test_card("Pikachu_Dup", tcg_id=unique_tcg_id)
        assert resp1.status_code == 200
        data1 = resp1.json()
        assert data1.get("quantity") == 1, f"Expected quantity=1, got: {data1.get('quantity')}"
        assert data1.get("is_duplicate") == False, "First card should not be marked as duplicate"
        
        # Add same card again (same tcg_id)
        resp2 = self._create_test_card("Pikachu_Dup", tcg_id=unique_tcg_id)
        assert resp2.status_code == 200
        data2 = resp2.json()
        assert data2.get("quantity") == 2, f"Expected quantity=2 after duplicate, got: {data2.get('quantity')}"
        assert data2.get("is_duplicate") == True, "Second card should be marked as duplicate"
        print(f"✓ Duplicate card incremented quantity to: {data2.get('quantity')}")


class TestGen1BinderDescription:
    """Test that the auto-created binder has correct description"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login as admin"""
        self.session = requests.Session()
        login_resp = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@pokemon.com",
            "password": "Admin123!"
        })
        assert login_resp.status_code == 200
        yield
    
    def test_gen1_binder_has_correct_description(self):
        """The 'Génération 1' binder should have French description"""
        binders_resp = self.session.get(f"{BASE_URL}/api/binders")
        assert binders_resp.status_code == 200
        
        binders = binders_resp.json().get("binders", [])
        gen1_binder = next((b for b in binders if b.get("name") == "Génération 1"), None)
        
        if gen1_binder:
            desc = gen1_binder.get("description", "")
            assert "151" in desc or "génération" in desc.lower() or "originaux" in desc.lower(), \
                f"Expected description to mention 151 or generation, got: {desc}"
            print(f"✓ 'Génération 1' binder description: {desc}")
        else:
            pytest.skip("'Génération 1' binder not yet created - add a Gen 1 card first")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
