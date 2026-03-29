from dotenv import load_dotenv
load_dotenv()

import os
import secrets
import base64
import httpx
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from bson import ObjectId
from fastapi import FastAPI, HTTPException, Request, Response, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from contextlib import asynccontextmanager
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import openpyxl

# ============ CONFIG ============
JWT_ALGORITHM = "HS256"
POKEMON_TCG_API = "https://api.pokemontcg.io/v2"

# ============ DATABASE ============
client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "pokemon_classeur")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.cards.create_index([("user_id", 1), ("pokemon_name", 1)])
    
    # Seed admin
    await seed_admin()
    
    yield
    client.close()

app = FastAPI(title="Pokemon Classeur API", lifespan=lifespan)

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ PASSWORD UTILS ============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# ============ JWT UTILS ============
def get_jwt_secret() -> str:
    return os.environ.get("JWT_SECRET", "default-secret-change-me")

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ ADMIN SEEDING ============
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@pokemon.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        hashed = hash_password(admin_password)
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hashed,
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc)
        })
        print(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
    
    # Write credentials
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin User
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
""")

# ============ PYDANTIC MODELS ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CardCreate(BaseModel):
    pokemon_name: str
    card_name: str
    set_name: str
    card_number: Optional[str] = None
    image_url: str
    price: float = 0.0
    condition: str = "good"
    quantity: int = 1
    tcg_id: Optional[str] = None
    rarity: Optional[str] = None

class CardUpdate(BaseModel):
    price: Optional[float] = None
    condition: Optional[str] = None
    quantity: Optional[int] = None

class AIAnalyzeRequest(BaseModel):
    image_base64: str

# ============ AUTH ENDPOINTS ============
@app.post("/api/auth/register")
async def register(data: UserRegister, response: Response):
    email = data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = hash_password(data.password)
    result = await db.users.insert_one({
        "email": email,
        "password_hash": hashed,
        "name": data.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc)
    })
    
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": data.name, "role": "user"}

@app.post("/api/auth/login")
async def login(data: UserLogin, request: Request, response: Response):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_time = attempt.get("last_attempt", datetime.now(timezone.utc))
        if datetime.now(timezone.utc) - lockout_time < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many attempts. Try again in 15 minutes.")
        else:
            await db.login_attempts.delete_one({"identifier": identifier})
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc)}},
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}

@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@app.get("/api/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@app.post("/api/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ============ POKEMON TCG API ============
@app.get("/api/pokemon/search")
async def search_pokemon(q: str, page: int = 1, pageSize: int = 20):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{POKEMON_TCG_API}/cards",
                params={"q": f"name:{q}*", "page": page, "pageSize": pageSize},
                timeout=15.0
            )
            data = response.json()
            cards = []
            for card in data.get("data", []):
                cards.append({
                    "id": card.get("id"),
                    "name": card.get("name"),
                    "set": card.get("set", {}).get("name", "Unknown"),
                    "number": card.get("number"),
                    "rarity": card.get("rarity"),
                    "image": card.get("images", {}).get("small"),
                    "image_large": card.get("images", {}).get("large"),
                    "prices": card.get("tcgplayer", {}).get("prices", {}),
                })
            return {"cards": cards, "totalCount": data.get("totalCount", 0)}
        except Exception as e:
            print(f"Pokemon TCG API error: {e}")
            return {"cards": [], "totalCount": 0}

@app.get("/api/pokemon/card/{card_id}")
async def get_pokemon_card(card_id: str):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{POKEMON_TCG_API}/cards/{card_id}", timeout=10.0)
            data = response.json().get("data", {})
            prices = data.get("tcgplayer", {}).get("prices", {})
            market_price = 0
            for variant, price_data in prices.items():
                if "market" in price_data:
                    market_price = price_data["market"]
                    break
            return {
                "id": data.get("id"),
                "name": data.get("name"),
                "set": data.get("set", {}).get("name"),
                "number": data.get("number"),
                "rarity": data.get("rarity"),
                "image": data.get("images", {}).get("large"),
                "prices": prices,
                "market_price": market_price
            }
        except Exception as e:
            raise HTTPException(status_code=404, detail="Card not found")

# ============ AI CARD RECOGNITION ============
@app.post("/api/ai/analyze-card")
async def analyze_card(data: AIAnalyzeRequest, request: Request):
    user = await get_current_user(request)
    
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"card-analysis-{user['_id']}-{datetime.now().timestamp()}",
            system_message="""You are a Pokemon card expert. Analyze the image and extract:
1. Pokemon name
2. Card set/extension name  
3. Card number (if visible)
4. Rarity (common, uncommon, rare, holo rare, ultra rare, etc)
5. Estimated condition (mint, excellent, good, poor)

Respond ONLY in this exact JSON format:
{"pokemon_name": "...", "set_name": "...", "card_number": "...", "rarity": "...", "condition": "..."}

If you cannot identify something, use null for that field."""
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=data.image_base64)
        user_message = UserMessage(
            text="Analyze this Pokemon card and extract the information.",
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON from response
        import json
        import re
        json_match = re.search(r'\{[^}]+\}', response)
        if json_match:
            result = json.loads(json_match.group())
            return result
        else:
            return {"pokemon_name": None, "set_name": None, "card_number": None, "rarity": None, "condition": "good"}
    except Exception as e:
        print(f"AI analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

# ============ CARD COLLECTION CRUD ============
@app.get("/api/cards")
async def get_cards(request: Request):
    user = await get_current_user(request)
    cursor = db.cards.find({"user_id": user["_id"]}).sort("created_at", -1)
    cards = []
    async for card in cursor:
        card["_id"] = str(card["_id"])
        cards.append(card)
    return {"cards": cards}

@app.post("/api/cards")
async def create_card(data: CardCreate, request: Request):
    user = await get_current_user(request)
    card_doc = {
        "user_id": user["_id"],
        "pokemon_name": data.pokemon_name,
        "card_name": data.card_name,
        "set_name": data.set_name,
        "card_number": data.card_number,
        "image_url": data.image_url,
        "price": data.price,
        "condition": data.condition,
        "quantity": data.quantity,
        "tcg_id": data.tcg_id,
        "rarity": data.rarity,
        "created_at": datetime.now(timezone.utc),
        "price_history": [{"price": data.price, "date": datetime.now(timezone.utc).isoformat()}]
    }
    result = await db.cards.insert_one(card_doc)
    card_doc["_id"] = str(result.inserted_id)
    return card_doc

@app.put("/api/cards/{card_id}")
async def update_card(card_id: str, data: CardUpdate, request: Request):
    user = await get_current_user(request)
    
    card = await db.cards.find_one({"_id": ObjectId(card_id), "user_id": user["_id"]})
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    update_data = {}
    if data.price is not None:
        update_data["price"] = data.price
        # Add to price history
        update_data["$push"] = {"price_history": {"price": data.price, "date": datetime.now(timezone.utc).isoformat()}}
    if data.condition is not None:
        update_data["condition"] = data.condition
    if data.quantity is not None:
        update_data["quantity"] = data.quantity
    
    if "$push" in update_data:
        push_data = update_data.pop("$push")
        await db.cards.update_one(
            {"_id": ObjectId(card_id)},
            {"$set": update_data, "$push": push_data}
        )
    else:
        await db.cards.update_one({"_id": ObjectId(card_id)}, {"$set": update_data})
    
    updated = await db.cards.find_one({"_id": ObjectId(card_id)})
    updated["_id"] = str(updated["_id"])
    return updated

@app.delete("/api/cards/{card_id}")
async def delete_card(card_id: str, request: Request):
    user = await get_current_user(request)
    result = await db.cards.delete_one({"_id": ObjectId(card_id), "user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card deleted"}

# ============ STATISTICS ============
@app.get("/api/stats")
async def get_stats(request: Request):
    user = await get_current_user(request)
    
    pipeline = [
        {"$match": {"user_id": user["_id"]}},
        {"$group": {
            "_id": None,
            "total_cards": {"$sum": "$quantity"},
            "total_value": {"$sum": {"$multiply": ["$price", "$quantity"]}},
            "unique_pokemon": {"$addToSet": "$pokemon_name"},
            "mint_count": {"$sum": {"$cond": [{"$eq": ["$condition", "mint"]}, "$quantity", 0]}},
            "max_price": {"$max": "$price"}
        }}
    ]
    
    result = await db.cards.aggregate(pipeline).to_list(1)
    
    if not result:
        return {
            "total_cards": 0,
            "total_value": 0,
            "unique_pokemon": 0,
            "avg_value": 0,
            "mint_count": 0,
            "top_card": None
        }
    
    stats = result[0]
    total_cards = stats.get("total_cards", 0)
    total_value = stats.get("total_value", 0)
    
    # Get top card
    top_card = await db.cards.find_one(
        {"user_id": user["_id"]},
        sort=[("price", -1)]
    )
    
    return {
        "total_cards": total_cards,
        "total_value": round(total_value, 2),
        "unique_pokemon": len(stats.get("unique_pokemon", [])),
        "avg_value": round(total_value / total_cards, 2) if total_cards > 0 else 0,
        "mint_count": stats.get("mint_count", 0),
        "top_card": {
            "name": top_card.get("card_name") if top_card else None,
            "price": top_card.get("price") if top_card else 0
        }
    }

@app.get("/api/stats/top-cards")
async def get_top_cards(request: Request, limit: int = 5):
    user = await get_current_user(request)
    cursor = db.cards.find({"user_id": user["_id"]}).sort("price", -1).limit(limit)
    cards = []
    async for card in cursor:
        card["_id"] = str(card["_id"])
        cards.append(card)
    return {"cards": cards}

# ============ SHARE COLLECTION ============
@app.post("/api/share")
async def create_share_link(request: Request):
    user = await get_current_user(request)
    share_token = secrets.token_urlsafe(16)
    
    await db.shares.update_one(
        {"user_id": user["_id"]},
        {"$set": {
            "token": share_token,
            "user_name": user.get("name", "Collector"),
            "created_at": datetime.now(timezone.utc)
        }},
        upsert=True
    )
    
    return {"share_token": share_token}

@app.get("/api/share/{token}")
async def get_shared_collection(token: str):
    share = await db.shares.find_one({"token": token})
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    cursor = db.cards.find({"user_id": share["user_id"]}).sort("price", -1)
    cards = []
    async for card in cursor:
        card["_id"] = str(card["_id"])
        cards.append(card)
    
    # Stats
    total_value = sum(c["price"] * c["quantity"] for c in cards)
    total_cards = sum(c["quantity"] for c in cards)
    
    return {
        "collector_name": share.get("user_name", "Collector"),
        "cards": cards,
        "stats": {
            "total_cards": total_cards,
            "total_value": round(total_value, 2),
            "unique_pokemon": len(set(c["pokemon_name"] for c in cards))
        }
    }

# ============ EXPORT ============
@app.get("/api/export/pdf")
async def export_pdf(request: Request):
    user = await get_current_user(request)
    
    cursor = db.cards.find({"user_id": user["_id"]}).sort("pokemon_name", 1)
    cards = await cursor.to_list(1000)
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []
    
    # Title
    elements.append(Paragraph(f"Collection Pokemon - {user.get('name', 'Collector')}", styles['Title']))
    elements.append(Spacer(1, 20))
    
    # Table data
    data = [["Pokemon", "Set", "Condition", "Qty", "Price", "Total"]]
    total_value = 0
    for card in cards:
        total = card["price"] * card["quantity"]
        total_value += total
        data.append([
            card["pokemon_name"],
            card["set_name"][:20],
            card["condition"],
            str(card["quantity"]),
            f"{card['price']:.2f}€",
            f"{total:.2f}€"
        ])
    
    data.append(["", "", "", "", "TOTAL:", f"{total_value:.2f}€"])
    
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF007F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor('#121218')),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2D2D3B')),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
    ]))
    elements.append(table)
    
    doc.build(elements)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=collection_{datetime.now().strftime('%Y%m%d')}.pdf"}
    )

@app.get("/api/export/excel")
async def export_excel(request: Request):
    user = await get_current_user(request)
    
    cursor = db.cards.find({"user_id": user["_id"]}).sort("pokemon_name", 1)
    cards = await cursor.to_list(1000)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Collection"
    
    # Headers
    headers = ["Pokemon", "Card Name", "Set", "Number", "Rarity", "Condition", "Quantity", "Price (€)", "Total (€)"]
    ws.append(headers)
    
    # Style header
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col)
        cell.font = openpyxl.styles.Font(bold=True, color="FFFFFF")
        cell.fill = openpyxl.styles.PatternFill(start_color="FF007F", end_color="FF007F", fill_type="solid")
    
    # Data
    total_value = 0
    for card in cards:
        total = card["price"] * card["quantity"]
        total_value += total
        ws.append([
            card["pokemon_name"],
            card["card_name"],
            card["set_name"],
            card.get("card_number", ""),
            card.get("rarity", ""),
            card["condition"],
            card["quantity"],
            card["price"],
            total
        ])
    
    # Total row
    ws.append(["", "", "", "", "", "", "", "TOTAL:", total_value])
    
    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=collection_{datetime.now().strftime('%Y%m%d')}.xlsx"}
    )

# ============ HEALTH CHECK ============
@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
