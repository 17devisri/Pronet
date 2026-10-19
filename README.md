# 🌐 Pronet - Developer Collaboration & Project Showcase Platform

Pronet is a modern, full-stack collaborative platform designed for developers to showcase projects, discover open-source initiatives, recruit contributors, and connect with peers in the tech community.

Built with a **React 19 + Tailwind CSS** frontend and a robust **Django REST Framework** backend, Pronet bridges the gap between idea creators and passionate contributors.

---

## ✨ Key Features

### 🚀 Project Discovery & Showcase
- **Explore & Filter**: Browse developer projects by keyword, technology stack, and title with instant filtering.
- **Project Details**: Rich project pages showcasing project descriptions, GitHub repositories, live demo links, required team roles, and contributor rosters.
- **Interactive Engagement**:
  - **Star / Like**: One-like-per-user tracking with persistent database state.
  - **Fork**: Real fork counter and tracking.
  - **Project Discussions**: In-app comments and feedback directly on project cards and detail views.
  - **Project Management**: Owners can edit project titles, taglines, descriptions, GitHub links, and required roles on the fly.

### 🤝 Seamless Collaboration & Requests
- **Join as Contributor**: Request to collaborate on specific roles (e.g., Frontend, Backend, UI/UX).
- **Request Management**: Project owners can review incoming join requests, accept new team members, or decline requests.
- **Accepted Collaborators**: Accepted members are automatically added to the project's contributor roster.

### 💬 Developer Networking & Chat
- **Connection System**: Send, accept, or decline connection requests with fellow developers.
- **Direct Messaging / Chat**: Real-time integrated chat between connected developers with instant message history and notification badges.
- **Separated Request Queue**: Incoming connection requests are prioritized at the top of the network view for swift management.

### 👤 Developer Profiles & Analytics
- **Personalized Profile**: Customizable bio, avatar, location, title, and technical skills list.
- **Real-Time Stats**: Live indicators for Projects Posted, Total Connections, Contributions, and Collaborations Accepted.
- **Tabbed Projects**: Switch between *Posted Projects* and *Contributed Projects*.

### 🎨 Modern UI & Experience
- **Glassmorphic Design**: Clean glass card components, animated particle canvas background, and smooth page transitions powered by **Framer Motion**.
- **Dark & Light Mode**: Seamless theme switching with persistent local state.
- **Responsive Layout**: Designed for seamless usage across desktop, tablet, and mobile displays.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [Django](https://www.djangoproject.com/) & [Django REST Framework](https://www.django-rest-framework.org/)
- **Language**: Python 3.10+
- **Database**: MySQL / SQLite (configurable via `django_backend/settings.py`)
- **Authentication**: Custom token/session-based authentication with `make_password` hashing

---

## 📁 Project Structure

```text
Pronet/
├── django_backend/               # Django REST API backend
│   ├── api/                      # App containing models, views, serializers, urls
│   │   ├── models.py             # User, Project, Contributor, Request, Connection
│   │   ├── serializers.py        # Model serializers with nested relationships
│   │   ├── urls.py               # REST API endpoints
│   │   └── views.py              # API viewsets & action handlers
│   ├── django_backend/           # Django project configuration (settings, wsgi)
│   ├── manage.py
│   └── requirements.txt          # Python dependencies
│
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   │   ├── ChatModal.jsx         # Direct messaging modal
│   │   ├── EditProjectModal.jsx  # In-place project editing modal
│   │   ├── GlassCard.jsx         # Glassmorphism container
│   │   ├── Navbar.jsx            # Top navigation bar
│   │   ├── ProjectCard.jsx       # Interactive project feed card
│   │   └── ...
│   ├── context/                  # React Contexts (AuthContext, ThemeContext)
│   ├── pages/                    # Main route pages
│   │   ├── Auth.jsx              # Login & Registration
│   │   ├── Connections.jsx       # Connections list & pending requests
│   │   ├── CreateProject.jsx     # Post new project
│   │   ├── Feed.jsx              # Explore & search projects
│   │   ├── Landing.jsx           # Landing / hero page
│   │   ├── Profile.jsx           # User profile & contributed projects
│   │   ├── ProjectDetail.jsx     # Full project view & comments
│   │   └── Requests.jsx          # Received collaboration requests
│   ├── App.jsx                   # Application router & layout
│   └── main.jsx                  # React entry point
│
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- *(Optional)* **MySQL Server** (if running with MySQL instead of SQLite)

---

### 1. Backend Setup (Django)

1. Navigate to the backend directory:
   ```bash
   cd django_backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Apply database migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the backend development server on port `5000`:
   ```bash
   python manage.py runserver 5000
   ```

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to the project root:
   ```bash
   cd Pronet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## 📡 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new developer account |
| `POST` | `/api/auth/login/` | Authenticate user credentials |
| `GET` / `PUT` | `/api/auth/profile/` | Fetch or update user profile & skills |
| `GET` / `POST` | `/api/projects/` | List all projects or create a new project |
| `GET` / `PUT` / `DELETE` | `/api/projects/<id>/` | View, edit, or delete a project |
| `POST` | `/api/projects/<id>/like/` | Toggle like/star on a project (unique per user) |
| `POST` | `/api/projects/<id>/fork/` | Fork a project |
| `POST` | `/api/projects/<id>/comment/` | Add a comment to a project |
| `GET` / `POST` | `/api/requests/` | View or create collaboration requests |
| `POST` | `/api/requests/<id>/action/` | Accept or decline a collaboration request |
| `GET` / `POST` | `/api/connections/` | View connections or send a connection request |
| `POST` | `/api/connections/<id>/action/` | Accept or decline connection request |
| `GET` / `POST` | `/api/connections/<id>/chat/` | Fetch or send direct messages |

---

## 🤝 Contributing

Contributions are welcome! If you would like to contribute:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
