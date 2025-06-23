# MySchool Mobile App - Project Brief

## Overview
MySchool is a comprehensive educational management system built using Expo/React Native, designed to facilitate seamless interaction between students, staff, and administrators.

## Tech Stack
- **Frontend Framework**: Expo/React Native
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript
- **Build Tool**: Vite
- **Package Manager**: npm/bun

## Project Structure
```
myschool-official-client/
├── src/
│   ├── adminDashboard/     # Admin-specific components and logic
│   ├── studentDashboard/   # Student-specific components and logic
│   ├── staffDashboard/     # Staff-specific components and logic
│   ├── components/         # Shared UI components
│   ├── authentication/     # Auth-related components and logic
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and shared logic
│   ├── pages/             # Main application pages
│   └── routes/            # Navigation and routing logic
├── public/                # Static assets
└── dist/                  # Build output
```

## Key Features
1. **Multi-User System**
   - Student Portal
   - Staff Portal
   - Admin Dashboard

2. **Authentication System**
   - Secure login/logout
   - Role-based access control
   - Session management

3. **Dashboard Features**
   - Personalized views for each user type
   - Real-time updates
   - Interactive UI components

## Development Guidelines
1. **Code Organization**
   - Follow component-based architecture
   - Maintain separation of concerns
   - Use TypeScript for type safety

2. **Styling**
   - Utilize Tailwind CSS for consistent styling
   - Follow mobile-first design principles
   - Maintain responsive layouts

3. **State Management**
   - Use React Context for global state
   - Implement custom hooks for reusable logic
   - Follow unidirectional data flow

## Build & Deployment
- Development: `npm run dev` or `bun dev`
- Production: `npm run build` or `bun build`
- Testing: `npm test` or `bun test`

## Dependencies
Key dependencies include:
- expo
- react-native
- tailwindcss
- typescript
- vite
- Various UI and utility libraries

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install` or `bun install`
3. Start development server: `npm run dev` or `bun dev`
4. Run on mobile: `expo start`