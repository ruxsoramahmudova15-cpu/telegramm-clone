# Environment Configuration

## Server Environment Variables (server/.env)

```
PORT=5000
USE_MOCK=false
MONGO_URL=mongodb+srv://shaxlofariddinova_db_user:15052009ruxsora@cluster0.qu03lgm.mongodb.net/?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## Client Environment Variables (client/.env)

```
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

## For Production Deployment

### Render.com (Backend)
- `NODE_ENV`: production
- `PORT`: 5000
- `MONGO_URL`: your-mongodb-atlas-url
- `JWT_SECRET`: your-secret-key
- `JWT_EXPIRES_IN`: 7d
- `CLIENT_URL`: https://your-frontend.vercel.app

### Vercel (Frontend)
- `VITE_API_URL`: https://your-backend.onrender.com
- `VITE_SOCKET_URL`: https://your-backend.onrender.com
