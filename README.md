# Jacky Money Tracker

A modern, responsive money tracking application built with React, TypeScript, and Tailwind CSS with user authentication support.

## 🚀 Features

- **User Authentication**: Sign in with Google or LINE accounts
- **User-Specific Data**: Each user has their own expense data
- **Modern UI**: Built with React 18 and TypeScript for type safety
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Instant UI updates with optimistic updates
- **Data Export/Import**: JSON export and import functionality
- **Theme Support**: Light and dark theme toggle
- **Category Management**: Dynamic category creation and management
- **Advanced Filtering**: Date range, category, and text search filters
- **Inline Editing**: Edit expenses directly in the table
- **Toast Notifications**: User-friendly feedback system
- **Secure Backend**: JWT-based authentication with PostgreSQL

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Authentication**: Passport.js with JWT
- **OAuth Providers**: Google OAuth 2.0, LINE Login
- **Backend**: Express.js with session management
- **Database**: PostgreSQL with user-specific data

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Chip.tsx
│   │   ├── Badge.tsx
│   │   └── Toast.tsx
│   ├── Header.tsx
│   ├── SummaryCards.tsx
│   ├── ExpenseForm.tsx
│   ├── Filters.tsx
│   ├── ExpenseTable.tsx
│   ├── CategoryBreakdown.tsx
│   ├── AuthButton.tsx   # Authentication button
│   └── ProtectedRoute.tsx # Route protection
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication context
├── hooks/               # Custom React hooks
│   ├── useExpenses.ts   # Main state management
│   └── useToast.ts      # Toast notifications
├── services/            # API services
│   └── api.ts           # API client with auth
├── types/               # TypeScript type definitions
│   └── index.ts         # Including User and Auth types
├── utils/               # Utility functions
│   └── index.ts
├── App.tsx              # Main app component
├── main.tsx             # React entry point with AuthProvider
└── index.css            # Global styles with Tailwind
```

## 🎨 Design System

The application uses a custom design system built on top of Tailwind CSS:

- **Colors**: Custom color palette with dark/light theme support
- **Components**: Reusable UI components with consistent styling
- **Typography**: Inter font family with proper hierarchy
- **Spacing**: Consistent spacing scale
- **Animations**: Smooth transitions and micro-interactions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database
- Google OAuth 2.0 credentials
- LINE Login credentials (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env
```

3. Configure your `.env` file with:
   - Database connection string
   - JWT and session secrets
   - Google OAuth credentials
   - LINE Login credentials (optional)

4. Set up OAuth providers:
   
   **Google OAuth 2.0:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
   
   **LINE Login (Optional):**
   - Go to [LINE Developers Console](https://developers.line.biz/)
   - Create a new channel
   - Configure callback URL: `http://localhost:3001/api/auth/line/callback`

5. Start the development server:
```bash
npm run dev
```

6. Start the backend server (in another terminal):
```bash
npm run server
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run server` - Start backend server
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Tailwind CSS

The Tailwind configuration is in `tailwind.config.js` with custom:
- Color palette
- Font families
- Border radius values
- Box shadows
- Animations

### TypeScript

TypeScript configuration in `tsconfig.json` with:
- Strict mode enabled
- Path mapping for imports
- React JSX support

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px  
- Desktop: > 1024px

## 🎯 Key Improvements

### From Vanilla JS to React

1. **Component Architecture**: Modular, reusable components
2. **State Management**: Centralized state with custom hooks
3. **Type Safety**: Full TypeScript support
4. **Performance**: Optimized rendering with React
5. **Developer Experience**: Better debugging and development tools

### UI/UX Enhancements

1. **Modern Design**: Clean, professional interface
2. **Better Accessibility**: ARIA labels and keyboard navigation
3. **Improved Feedback**: Toast notifications and loading states
4. **Enhanced Forms**: Better validation and user experience
5. **Responsive Layout**: Works perfectly on all devices

## 🔄 Migration Notes

The original vanilla JavaScript application has been completely refactored to React while maintaining all functionality:

- ✅ All original features preserved
- ✅ Improved user experience
- ✅ Better code organization
- ✅ Enhanced maintainability
- ✅ Type safety added
- ✅ Modern development workflow

## 📄 License

ISC

