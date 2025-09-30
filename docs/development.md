# Development Guide

This guide covers the development workflow, best practices, and architecture of the Jacky Tracker application.

## 🏗️ Project Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Custom hooks + Context API
- **Authentication**: JWT with OAuth providers

### Backend (Node.js + Express)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with user-specific data
- **Authentication**: Passport.js with JWT
- **Session Management**: Express sessions

## 🚀 Development Workflow

### Prerequisites
```bash
# Install dependencies
npm install

# Set up environment
cp env.example .env
# Edit .env with your configuration
```

### Running in Development

```bash
# Terminal 1: Backend server
npm run server

# Terminal 2: Frontend development server
npm run dev

# Terminal 3: Database (if using Docker)
docker-compose up postgres
```

### Available Scripts

```bash
# Development
npm run dev          # Start frontend dev server
npm run server       # Start backend server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run type-check   # TypeScript type checking
npm run lint         # ESLint (if configured)
npm run format       # Prettier (if configured)

# Database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with test data
```

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
│   ├── Header.tsx       # App header with auth
│   ├── SummaryCards.tsx # Expense summary cards
│   ├── ExpenseForm.tsx  # Add/edit expense form
│   ├── Filters.tsx      # Filter controls
│   ├── ExpenseTable.tsx # Expenses table
│   ├── CategoryBreakdown.tsx # Category analysis
│   ├── AuthButton.tsx   # Authentication button
│   └── ProtectedRoute.tsx # Route protection
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication context
├── hooks/               # Custom React hooks
│   ├── useExpenses.ts   # Main state management
│   └── useToast.ts      # Toast notifications
├── services/            # API services
│   └── api.ts           # API client with auth
├── types/               # TypeScript definitions
│   └── index.ts         # All type definitions
├── utils/               # Utility functions
│   └── index.ts         # Helper functions
├── App.tsx              # Main app component
├── main.tsx             # React entry point
└── index.css            # Global styles
```

## 🔧 Development Best Practices

### Code Organization

1. **Component Structure**
   ```typescript
   // Component file structure
   interface ComponentProps {
     // Props interface
   }
   
   export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
     // Hooks
     // Event handlers
     // Render
   };
   ```

2. **Custom Hooks**
   ```typescript
   // Custom hook structure
   export const useCustomHook = (param: string) => {
     // State
     // Effects
     // Handlers
     // Return values
   };
   ```

3. **API Services**
   ```typescript
   // API service structure
   export const apiService = {
     get: async (endpoint: string) => { /* ... */ },
     post: async (endpoint: string, data: any) => { /* ... */ },
     // ... other methods
   };
   ```

### TypeScript Best Practices

1. **Type Definitions**
   ```typescript
   // Define interfaces for all data structures
   interface Expense {
     id: number;
     amount: number;
     description: string;
     date: string;
     categoryId: number;
     userId: number;
   }
   
   // Use union types for variants
   type Theme = 'light' | 'dark';
   type SortOrder = 'asc' | 'desc';
   ```

2. **Component Props**
   ```typescript
   // Always define prop interfaces
   interface ButtonProps {
     variant: 'primary' | 'secondary';
     size: 'sm' | 'md' | 'lg';
     onClick: () => void;
     children: React.ReactNode;
   }
   ```

3. **API Responses**
   ```typescript
   // Define API response types
   interface ApiResponse<T> {
     data: T;
     message: string;
     success: boolean;
   }
   
   interface ExpensesResponse extends ApiResponse<Expense[]> {}
   ```

### State Management

1. **Local State**
   ```typescript
   // Use useState for component-local state
   const [isLoading, setIsLoading] = useState(false);
   const [expenses, setExpenses] = useState<Expense[]>([]);
   ```

2. **Global State**
   ```typescript
   // Use Context for global state
   const AuthContext = createContext<AuthContextType | null>(null);
   
   export const useAuth = () => {
     const context = useContext(AuthContext);
     if (!context) {
       throw new Error('useAuth must be used within AuthProvider');
     }
     return context;
   };
   ```

3. **Server State**
   ```typescript
   // Use custom hooks for server state
   export const useExpenses = () => {
     const [expenses, setExpenses] = useState<Expense[]>([]);
     const [loading, setLoading] = useState(true);
     
     // Fetch logic
     // Return state and actions
   };
   ```

### Error Handling

1. **API Errors**
   ```typescript
   try {
     const response = await api.get('/expenses');
     setExpenses(response.data);
   } catch (error) {
     console.error('Failed to fetch expenses:', error);
     showToast('Failed to load expenses', 'error');
   }
   ```

2. **Component Errors**
   ```typescript
   // Use Error Boundaries for component errors
   class ErrorBoundary extends React.Component {
     constructor(props) {
       super(props);
       this.state = { hasError: false };
     }
     
     static getDerivedStateFromError(error) {
       return { hasError: true };
     }
     
     render() {
       if (this.state.hasError) {
         return <ErrorFallback />;
       }
       return this.props.children;
     }
   }
   ```

### Performance Optimization

1. **Memoization**
   ```typescript
   // Memoize expensive calculations
   const expensiveValue = useMemo(() => {
     return calculateExpensiveValue(data);
   }, [data]);
   
   // Memoize callbacks
   const handleClick = useCallback(() => {
     doSomething();
   }, [dependency]);
   ```

2. **Lazy Loading**
   ```typescript
   // Lazy load components
   const LazyComponent = lazy(() => import('./LazyComponent'));
   
   // Use Suspense for loading states
   <Suspense fallback={<Loading />}>
     <LazyComponent />
   </Suspense>
   ```

3. **Virtual Scrolling**
   ```typescript
   // For large lists, use virtual scrolling
   import { FixedSizeList as List } from 'react-window';
   
   const VirtualizedList = ({ items }) => (
     <List
       height={600}
       itemCount={items.length}
       itemSize={50}
       itemData={items}
     >
       {Row}
     </List>
   );
   ```

## 🧪 Testing

### Unit Testing
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Integration Testing
```typescript
// API integration testing
import { api } from './api';

test('fetches expenses from API', async () => {
  const mockExpenses = [{ id: 1, amount: 100, description: 'Test' }];
  jest.spyOn(api, 'get').mockResolvedValue({ data: mockExpenses });
  
  const expenses = await api.get('/expenses');
  expect(expenses.data).toEqual(mockExpenses);
});
```

### E2E Testing
```typescript
// End-to-end testing with Cypress
describe('Expense Management', () => {
  it('should add a new expense', () => {
    cy.visit('/');
    cy.get('[data-testid="add-expense-button"]').click();
    cy.get('[data-testid="amount-input"]').type('100');
    cy.get('[data-testid="description-input"]').type('Test expense');
    cy.get('[data-testid="save-button"]').click();
    cy.get('[data-testid="expense-table"]').should('contain', 'Test expense');
  });
});
```

## 🔍 Debugging

### Browser DevTools
1. **React DevTools**: Install browser extension
2. **Network Tab**: Monitor API calls
3. **Console**: Check for errors and logs
4. **Sources**: Set breakpoints in code

### VS Code Debugging
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Frontend",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src"
    },
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server.js",
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Logging
```typescript
// Use console.log for development
console.log('Debug info:', data);

// Use proper logging in production
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 📦 Build and Deployment

### Development Build
```bash
# Build frontend
npm run build

# Build backend (if needed)
npm run build:server
```

### Production Build
```bash
# Build for production
NODE_ENV=production npm run build

# Start production server
NODE_ENV=production npm start
```

### Docker Build
```dockerfile
# Dockerfile for production
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

## 🔄 Git Workflow

### Branch Strategy
```bash
# Main branches
main          # Production-ready code
develop       # Integration branch

# Feature branches
feature/add-expense-filter
feature/user-authentication
feature/dark-mode

# Bug fix branches
bugfix/fix-login-error
bugfix/resolve-memory-leak
```

### Commit Convention
```bash
# Commit message format
<type>(<scope>): <description>

# Examples
feat(auth): add Google OAuth integration
fix(expenses): resolve date filtering issue
docs(readme): update installation instructions
style(ui): improve button hover effects
refactor(api): simplify expense creation logic
```

### Pull Request Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR
4. Request code review
5. Address feedback
6. Merge to `develop`
7. Deploy to staging
8. Merge to `main` for production

## 📚 Related Documentation

- [Quick Start Guide](./quick-start.md) - Get started quickly
- [Complete Setup Guide](./setup.md) - Full setup instructions
- [Environment Configuration](./environment.md) - Environment variables
- [API Documentation](./api.md) - Backend API reference
- [Component Guide](./components.md) - Frontend components
- [Troubleshooting Guide](./troubleshooting.md) - Common issues

---

**Happy coding! 🚀**
