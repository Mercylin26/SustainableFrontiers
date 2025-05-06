# Architecture Documentation: SustainableFrontiers

## Overview

SustainableFrontiers is a collaborative eco-strategy game for college management. It's a full-stack web application that allows faculty and students to manage events, timetables, and sustainability initiatives. The application follows a client-server architecture with a clear separation between frontend and backend.

The system is built using TypeScript throughout the stack for type safety and better developer experience. It leverages modern web technologies including React for the frontend, Express for the backend API, and PostgreSQL (via Neon's serverless offering) for data persistence.

## System Architecture

### High-Level Architecture

The application follows a traditional web application architecture with three primary layers:

1. **Presentation Layer** - A React-based Single Page Application (SPA)
2. **Application Layer** - Node.js with Express backend
3. **Data Layer** - PostgreSQL database with Drizzle ORM

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  Client Layer   │ ◄─────► │  Server Layer   │ ◄─────► │   Data Layer    │
│    (React)      │         │   (Express)     │         │  (PostgreSQL)   │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### Key Architectural Decisions

1. **Monorepo Structure**
   - The application uses a monorepo approach with client, server, and shared code in a single repository
   - This simplifies development, deployment, and sharing of types between frontend and backend

2. **Type Safety**
   - TypeScript is used throughout the entire stack
   - Schemas are defined once and shared between frontend and backend

3. **API Design**
   - RESTful API patterns with Express routes
   - API endpoints follow resource-based naming conventions

4. **Authentication**
   - Session-based authentication using Passport.js with local strategy
   - Development authentication bypass for easier testing

5. **Database Access**
   - Drizzle ORM for type-safe database access
   - Connection pooling for efficient database connections

6. **UI Component Architecture**
   - Component-based UI architecture with Shadcn UI components
   - Tailwind CSS for styling

## Key Components

### Frontend Components

1. **Client Application**
   - Located in `/client` directory
   - Built with React and Vite as the build tool
   - Uses React Query for data fetching, caching, and state management
   - Uses Wouter for client-side routing
   - TailwindCSS for styling with a customized design system

2. **UI Component Library**
   - Uses Shadcn UI, a collection of reusable components built on Radix UI
   - Centralized theme configuration via TailwindCSS
   - Design tokens defined in CSS variables for consistent theming

3. **Authentication Context**
   - Manages user authentication state
   - Handles login, signup, and logout operations
   - Stores user session data

4. **Role-Based Views**
   - Separate views for students and faculty
   - Role-specific dashboards, functionality, and navigation

### Backend Components

1. **API Server**
   - Express-based HTTP server
   - Structured routing for resource management
   - Middleware for authentication, logging, and error handling

2. **Authentication Service**
   - Passport.js for authentication strategies
   - Session management with PostgreSQL session store
   - Password hashing with scrypt for secure password storage

3. **Storage Service**
   - Abstraction layer for database operations
   - Implements repository pattern for data access

4. **Development Utilities**
   - Development authentication bypass for testing
   - Seeding scripts for database initialization

### Shared Components

1. **Database Schema**
   - Defined using Drizzle ORM schema definition
   - Located in `/shared/schema.ts`
   - Core entities: users, departments, subjects, timetable entries, etc.

2. **Type Definitions**
   - Shared types between frontend and backend
   - Zod schemas for validation

## Data Flow

### Authentication Flow

1. User submits login credentials via the login form
2. Server validates credentials against stored user data
3. On successful authentication, a session is created and stored in the database
4. Session ID is sent back to the client as a cookie
5. Subsequent requests include this cookie to maintain the authenticated session

### Resource Access Flow

1. Client makes API request with session cookie
2. Server validates the session and identifies the user
3. Server authorizes the request based on user role and permissions
4. Server processes the request, interacting with the database as needed
5. Server sends a response back to the client

### Development Authentication Bypass

For development purposes, the application includes a bypass mechanism that automatically authenticates requests to protected routes with a faculty account, simplifying testing and development.

## Database Schema

The application uses a relational database with the following key tables:

1. **users** - Stores user information including authentication details and role
2. **departments** - Academic departments
3. **subjects** - Academic subjects/courses
4. **timetableEntries** - Scheduling information for classes
5. **attendanceRecords** - Student attendance tracking
6. **events** - College events and activities
7. **notes** - Educational materials and resources

The schema supports role-based access with defined user roles (student, faculty, admin) and establishes relationships between entities (e.g., subjects belong to departments, faculty teach subjects).

## External Dependencies

### Frontend Dependencies

1. **React** - UI library
2. **TanStack Query** - Data fetching and state management
3. **Wouter** - Routing library
4. **Radix UI** - Accessible UI primitives
5. **TailwindCSS** - Utility-first CSS framework
6. **React Hook Form** - Form handling
7. **Zod** - Schema validation

### Backend Dependencies

1. **Express** - Web framework
2. **Passport** - Authentication middleware
3. **Drizzle ORM** - Database ORM
4. **Neon Database SDK** - PostgreSQL serverless client
5. **Connect-PG-Simple** - PostgreSQL session store

## Deployment Strategy

The application is configured to be deployed on Replit's platform with the following setup:

1. **Development Environment**
   - Replit workspace with Node.js, Web, and PostgreSQL modules
   - Hot-reloading development server via `npm run dev`

2. **Production Build**
   - Frontend assets built with Vite
   - Backend code bundled with esbuild
   - Combined into a single deployment package

3. **Runtime Configuration**
   - Environment variables for database connection and secrets
   - Production mode configuration with optimized settings

4. **Database Management**
   - Database schema migrations via Drizzle Kit
   - Database connection pooling for performance

The deployment process includes:
1. Building the frontend with Vite
2. Bundling the backend with esbuild
3. Running the built application with Node.js

## Development Workflow

1. **Local Development**
   - Run `npm run dev` to start the development server
   - Frontend changes are hot-reloaded
   - Backend changes trigger server restart

2. **Database Schema Changes**
   - Update schema definitions in `/shared/schema.ts`
   - Run `npm run db:push` to apply changes to the database

3. **Production Build**
   - Run `npm run build` to create production assets
   - Run `npm run start` to start the production server

## Security Considerations

1. **Authentication**
   - Password hashing with scrypt and salting
   - Timing-safe comparison for password verification
   - HTTP-only cookies for session storage

2. **Authorization**
   - Role-based access control
   - Route protection middleware

3. **Data Validation**
   - Input validation using Zod schemas
   - Error handling and sanitization

4. **Development vs Production**
   - Development authentication bypass only enabled in development mode
   - Separate configurations for development and production environments