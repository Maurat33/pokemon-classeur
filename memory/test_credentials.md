# Test Credentials

## Admin User (Parent)
- Email: admin@pokemon.com
- Password: Admin123!
- Role: admin
- Permissions: Full access (add, edit, delete cards)

## Child User (Léo)
- Email: maurat.leo@gmail.com
- Password: Facile33
- Role: child
- Permissions: View cards, play games (cannot delete or edit prices)

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/refresh
