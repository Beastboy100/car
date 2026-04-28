# MB MOTORS - Setup Guide

## Prerequisites

- **Node.js** >= 18.0.0 ([Download](https://nodejs.org/))
- **MongoDB** local or Atlas connection string
- **Git** for version control

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/mb-motors.git
   cd mb-motors
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your values:
   - `PORT`: Server port (default: 5000)
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Long random string for JWT
   - `FRONTEND_URL`: Frontend URL for CORS

## Running Locally

### Start Development Server
```bash
npm run dev
```
Server runs on `http://localhost:5000`

From other devices on same network:
```
http://<YOUR_MACHINE_IP>:5000
```

### Production Build
```bash
npm start
```

## Database Setup

### Local MongoDB
```bash
mongod  # Start MongoDB locally
```

### MongoDB Atlas (Cloud)
1. Create cluster at https://mongodb.com/cloud/atlas
2. Get connection string
3. Update `MONGO_URI` in `.env`

## Project Structure

```
mb-motors/
├── backend/          # Node.js/Express API
├── frontend/         # Client-side (HTML/CSS/JS)
├── index.html        # Entry point
├── package.json      # Dependencies
└── .env.example      # Environment template
```

## Available Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start server |
| `npm run lint` | Check code style |
| `npm run serve` | Serve files on port 3000 |

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or kill process using port 5000
```

### MongoDB Connection Failed
- Check `MONGO_URI` in `.env`
- Ensure MongoDB is running locally or accessible
- Verify IP whitelist in MongoDB Atlas

### CORS Errors
- Update `FRONTEND_URL` in `.env` to match your domain
- Check origin in browser DevTools Network tab

## Deployment

See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for deployment guides.

## Support

- **Issues**: Use GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: contact@example.com

---

**Happy coding!** 🚗
