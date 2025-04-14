# VehicAI Frontend

A modern React application for vehicle listings and AI-powered advisory.

## 🚀 Quick Start

### Prerequisites

- Node.js 16.x or higher
- npm 8.x or higher

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/vehicai.git
   cd vehicai/frontend
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Setup environment variables
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` with your Firebase configuration and other settings.

4. Start the development server
   ```bash
   npm run dev
   ```

The application will open at [http://localhost:3000](http://localhost:3000).

## 📁 Project Structure

```
frontend/
├── public/              # Static files
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable components
│   │   └── auth/        # Authentication components
│   ├── context/         # React context providers
│   ├── pages/           # Page components
│   ├── utils/           # Utility functions
│   │   ├── firebase/    # Firebase configuration
│   │   └── api.js       # API utilities
│   ├── App.jsx          # Application root component
│   └── main.jsx         # Entry point
├── .env.example         # Example environment variables
├── jsconfig.json        # JavaScript configuration
├── vite.config.js       # Vite configuration
└── README.md            # Project documentation
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint the codebase

## 🧪 Development Guidelines

### Code Style

- Use functional components with hooks
- Use named exports for components
- Keep components small and focused
- Use the BEM naming convention for CSS classes

### State Management

- Use React Context for global state
- Use local state for component-specific state
- Use React Query for server state management

### Imports

We use path aliases to make imports cleaner:

```jsx
// Instead of this:
import Button from '../../components/Button';

// Use this:
import Button from '@components/Button';
```

Available aliases:
- `@` - `src/`
- `@components` - `src/components/`
- `@pages` - `src/pages/`
- `@utils` - `src/utils/`
- `@context` - `src/context/`
- `@assets` - `src/assets/`

## 📚 Technologies

- [React](https://reactjs.org/) - UI library
- [React Router](https://reactrouter.com/) - Routing
- [Firebase](https://firebase.google.com/) - Authentication & Firestore
- [Axios](https://axios-http.com/) - HTTP client
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Vite](https://vitejs.dev/) - Build tool

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
