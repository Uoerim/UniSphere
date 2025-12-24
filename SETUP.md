# 🎓 UniSphere - University Management System

A comprehensive university management system built with React, Node.js, Express, Prisma, and MySQL using the Entity-Attribute-Value (EAV) pattern for maximum flexibility.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Git

### Option 1: Automated Setup (Recommended)

#### Windows (PowerShell)
```powershell
.\setup.ps1
```

#### Linux/macOS
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. ✅ Check Docker is running
2. ✅ Install all npm dependencies (server & client)
3. ✅ Start MySQL database via Docker
4. ✅ Generate Prisma client
5. ✅ Push database schema
6. ✅ Create default admin user

### Option 2: Manual Setup

#### 1. Start MySQL Database
```bash
docker-compose up -d mysql
```

#### 2. Install Server Dependencies
```bash
cd server
npm install
npx prisma generate
npx prisma db push
npm run create-admin
```

#### 3. Install Client Dependencies
```bash
cd ../client
npm install
```

## 🏃 Running the Application

### Option 1: Using Docker Compose (All Services)
```bash
docker-compose up
```

This starts:
- MySQL database (port 3306)
- Backend server (port 4000)
- Frontend client (port 5173)

### Option 2: Manual Start (Separate Terminals)

**Terminal 1 - Database:**
```bash
docker-compose up mysql
```

**Terminal 2 - Backend Server:**
```bash
cd server
npm run dev
```

**Terminal 3 - Frontend Client:**
```bash
cd client
npm run dev
```

**Terminal 4 - Prisma Studio (Optional):**
```bash
cd server
npx prisma studio
```

## 🌐 Application URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |
| Prisma Studio | http://localhost:5555 |
| MySQL Database | localhost:3306 |

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@admin.com`
- Password: `Admin123!`

## 📁 Project Structure

```
UniSphere/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React contexts (Auth, etc.)
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── styles/        # Global styles and theme
│   ├── Dockerfile
│   └── package.json
├── server/                # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── prisma.ts      # Prisma client instance
│   │   └── server.ts      # Express server setup
│   ├── prisma/
│   │   └── schema.prisma  # Database schema (EAV model)
│   ├── scripts/
│   │   └── create-admin.ts
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml     # Docker services configuration
├── setup.ps1             # Windows setup script
└── setup.sh              # Linux/macOS setup script
```

## 🗄️ Database Schema (EAV Pattern)

The system uses an **Entity-Attribute-Value (EAV)** pattern for maximum flexibility:

### Core Models:
- **Account**: User authentication (ADMIN, STAFF, STUDENT, FACULTY)
- **Entity**: Flexible entities (students, courses, departments, etc.)
- **Attribute**: Configurable attributes with validation
- **Value**: Dynamic attribute values
- **EntityRelation**: Many-to-many relationships between entities

### Supported Entity Types:
- STUDENT, FACULTY, STAFF
- COURSE, DEPARTMENT
- BUILDING, ROOM
- EVENT, ANNOUNCEMENT
- ENROLLMENT, GRADE, ATTENDANCE

## 🛠️ Available Scripts

### Server
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run create-admin # Create admin user
```

### Client
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Prisma
```bash
npx prisma studio              # Open Prisma Studio GUI
npx prisma generate            # Generate Prisma Client
npx prisma db push             # Push schema to database
npx prisma migrate dev         # Create a new migration
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# Stop all services
docker-compose down

# Rebuild services
docker-compose up --build

# View logs
docker-compose logs -f

# Stop and remove volumes (⚠️ removes database data)
docker-compose down -v
```

## 🔧 Environment Variables

### Server (.env)
```env
DATABASE_URL="mysql://root:root@localhost:3306/ums"
JWT_SECRET="your-secret-key-change-in-production"
PORT=4000
```

### Client (.env)
```env
VITE_API_URL=http://localhost:4000
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new account (admin only)
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/reset-password` - Reset user password

### Staff
- `GET /api/staff` - Get all staff
- `POST /api/staff` - Create staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

## 🎨 Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- CSS Modules

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JWT Authentication
- bcrypt

### Database
- MySQL 8.0
- Docker

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Docker Issues
```bash
# Restart Docker Desktop
# Then run:
docker-compose down
docker-compose up --build
```

### Prisma Issues
```bash
cd server
rm -rf node_modules/.prisma
npx prisma generate
npx prisma db push
```

### Port Already in Use
```bash
# Find and kill process on port 3306, 4000, or 5173
# Windows:
netstat -ano | findstr :3306
taskkill /PID <PID> /F

# Linux/macOS:
lsof -ti:3306 | xargs kill -9
```

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.
