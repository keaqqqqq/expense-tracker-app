# ExpenseHive Documentation

## Table of Contents
- [1. Overview](#1-overview)
- [2. Architecture](#2-architecture)
- [3. Setup and Installation](#3-setup-and-installation)
- [4. Core Features](#4-core-features)
- [5. Development Guide](#5-development-guide)
- [6. Deployment](#6-deployment)
- [7. Maintenance](#7-maintenance)

## 1. Overview

### Purpose
An expense tracker application that allows users to track expenses, split bills, and manage balances with friends and groups.

### Tech Stack
- Frontend: Next.js 13 (App Router), TypeScript
- Backend Services: Firebase
- UI: shadcn/ui components, Tailwind CSS
- State Management: React Context
- Form Validation: Zod
- Testing: Jest, Postman API
- CI/CD: GitHub Actions
- Container: GitHub Container Registry
- Deployment: Vercel

## 2. Architecture

### Project Structure
```
expense-tracker-app/
├── app/                       # App Router
│   ├── page.tsx              # Root page
│   ├── layout.tsx            # Root layout
│   ├── (auth)/               # Authentication routes
│   ├── (root)/               # Protected routes
│   │   ├── expense/        
│   │   ├── friends/        
│   │   ├── groups/          
│   │   ├── home/           
│   │   ├── settings/         
│   │   ├── stats/           
│   │   └── invite/          
│   └── api/                 
│       └── notification/     # Notification endpoints
│           └── send/        
│               └── route.ts
├── components/                 # React components
│   ├── ui/                    # Reusable UI components from shadcn
│   ├── Balances/            
│   ├── Friends/             
│   ├── Groups/            
│   ├── HomePage/            
│   ├── ManageExpense/       
│   ├── Pay/                
│   ├── Split/
        └── _tests_/
            └── EqualSplit.test.tsx
        └── EqualSplit.tsx                
│   ├── Stats/             
│   ├── Transaction/         
│   └── UserProfile/
├── lib/                     
│   └── actions/                   # Business logic and API calls
│       ├── email.ts            
│       ├── file.action.ts     
│       ├── notification.ts     
│       ├── statistic.action.ts
│       ├── user.action.ts    
│       ├── friend.action.ts   
│       ├── group.action.ts   
│       ├── expense.action.ts  
│       ├── transaction.action.ts
│       └── balance.action.ts
├── context/                    # React Context providers for state management
│   ├── AuthContext.tsx        
│   ├── BalanceContext.tsx     
│   ├── ExpenseContext.tsx     
│   ├── ExpenseListContext.tsx 
│   ├── FriendsContext.tsx     
│   ├── HomeBalanceContext.tsx 
│   ├── NotificationContext.tsx 
│   └── TransactionContext.tsx 
├── types/                        # TypeScript type definitions
│   ├── Balance.ts              
│   ├── ChartData.ts           
│   ├── Expense.ts              
│   ├── ExpenseCategories.ts   
│   ├── ExpenseList.ts         
│   ├── ExpenseSplit.ts        
│   ├── Friend.ts             
│   ├── Group.ts              
│   ├── SplitFriend.ts       
│   ├── SplitInterface.ts    
│   ├── Toast.ts               
│   ├── Transaction.ts        
│   └── User.ts                     
├── .github/
│   └── ci-cd.yml                    # GitHub Actions workflow for CI/CD
├── Dockerfile                       # Container configuration for Docker
├── public/                         # Static files
│   ├── icons/                     # App icons for PWA
│   ├── firebase-messaging-sw.js    # Service worker for push notifications
│   └── manifest.json              # PWA configuration
├── functions/                      # Firebase Cloud Functions for invitation email
│   └── src/
│       └── index.ts           
├── firebase/
│   └── config.ts                  # Firebase configuration and initialization
├── validation/                  # Form and data validation
│   └── expense-form.ts    
├── eslint.config.ts            # ESLint configuration
   └── jest.config.ts           # Jest testing configuration
```

## 3. Setup and Installation

### Prerequisites
- Node.js v18+
- npm or yarn
- Firebase project
- Git

### Environment Setup
1. Clone repository:
```bash
git clone https://github.com/keaqqqqq/expense-tracker-app.git
cd expense-tracker-app
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Firebase Setup
1. Create Firebase project
2. Enable services:
   - Authentication
   - Firestore
   - Storage
   - Functions
   - Cloud Messaging
3. Set up security rules
4. Configure Firebase in application

## 4. Core Features

### Authentication
- Email/password authentication
- Protected routes
- Auth context provider
- User profile management

### Expense Management
Components:
- ExpenseForm
- ExpenseList
- ExpenseDetails
- Categories management

Actions:
- Create expense
- Update expense
- Delete expense
- Split expense

### Friends and Groups
Features:
- Friend requests
- Group creation
- Member management
- Expense sharing

### Balance Tracking
Features:
- Real-time balance updates
- Settlement suggestions
- Transaction history
- Balance statistics

## 5. Development Guide

### Code Style
- Follow TypeScript best practices
- Use functional components
- Implement proper error handling
- Document complex functions
- Follow naming conventions

### Git Workflow
1. Create feature branch
2. Make changes
3. Run tests
4. Create PR
5. Code review
6. Merge to main

## 5. Testing

### Jest Configuration
```typescript
// jest.config.ts
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}
```

### Writing Tests
```typescript
// Example test
describe('ExpenseForm', () => {
  it('submits expense data correctly', async () => {
    // Test implementation
  });
});
```

## 6. Deployment

### CI/CD Pipeline
1. GitHub Actions workflow:
   - Lint code
   - Run tests
   - Build application
   - Deploy to Vercel

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

## 7. Maintenance

### Monitoring
- Error tracking
- Performance monitoring
- User analytics

### Updates
- Regular dependency updates
- Security patches
- Feature updates

### Backup
- Database backup
- Configuration backup
- Recovery procedures
