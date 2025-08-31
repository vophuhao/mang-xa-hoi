# Pixyy - Instagram Clone Frontend

A modern Instagram-like social media frontend built with React, Redux Toolkit, and Tailwind CSS.

## Features

- 🔐 Authentication (Login/Register)
- 🏠 Home Feed with posts
- 🔍 Search Users
- 🌟 Explore Posts
- 👤 User Profiles
- ❤️ Like Posts
- 💬 Comments (UI ready)
- 📱 Responsive Design
- 🌙 Dark Mode Support
- 🎨 Instagram-like UI/UX

## Technology Stack

- **Frontend Framework**: React 18
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS v4
- **UI Components**: Custom components with Headless UI patterns
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form ready
- **Icons**: Lucide React
- **Notifications**: React Toastify

## Project Structure

```
src/
├── components/
│   ├── feed/              # Feed related components
│   ├── layout/            # Layout components (Sidebar, Header)
│   ├── post/              # Post related components
│   ├── ui/                # Reusable UI components
│   └── user/              # User related components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and API client
├── pages/                 # Page components
├── store/                 # Redux store and slices
│   └── slices/            # Redux slices
└── assets/               # Static assets
```

## Key Components

### Layout Components
- `Layout` - Main app layout with sidebar
- `Sidebar` - Navigation sidebar (desktop/mobile)
- `MobileHeader` - Mobile header component

### UI Components
- `Button` - Customizable button component
- `Input` - Form input component
- `Avatar` - User avatar component
- `Card` - Card container component

### Feature Components
- `Post` - Individual post display
- `Feed` - Main feed container
- `CreatePost` - Post creation form
- `SuggestedUsers` - User suggestions sidebar

### Pages
- `HomePage` - Main feed page
- `LoginPage` - User authentication
- `RegisterPage` - User registration
- `ProfilePage` - User profile display
- `ExplorePage` - Explore/discover posts
- `SearchPage` - User search

## State Management

### Redux Slices

1. **Auth Slice** (`authSlice.js`)
   - User authentication state
   - Login/logout/register actions
   - Current user data

2. **Posts Slice** (`postSlice.js`)
   - Feed posts management
   - Explore posts
   - Post creation/deletion/likes

3. **Users Slice** (`userSlice.js`)
   - User profiles
   - User search
   - Follow/unfollow functionality
   - Suggested users

## API Integration

The frontend integrates with the backend API endpoints:

- **Auth**: `/api/auth/*` - Authentication endpoints
- **Posts**: `/api/posts/*` - Post management
- **Users**: `/api/users/*` - User operations
- **Sessions**: `/api/sessions/*` - Session management

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create `.env` file:
   ```env
   VITE_API_BASE_URL=http://localhost:4004
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Features Implementation

### ✅ Completed
- User Authentication (Login/Register)
- Home Feed Display
- Post Creation with Image Upload
- Post Interactions (Like/Unlike)
- User Profile Display
- User Search Functionality
- Explore Posts Grid
- Responsive Design
- Dark Mode Support
- Redux State Management

### 🚧 Ready for Implementation
- Comment System (UI completed)
- Real-time Notifications
- Direct Messaging
- Story Features
- Image Filters
- Push Notifications

## Best Practices Implemented

1. **Code Organization**
   - Feature-based folder structure
   - Separation of concerns
   - Reusable components

2. **Performance**
   - Lazy loading ready
   - Optimized re-renders with Redux
   - Image optimization support

3. **User Experience**
   - Loading states
   - Error handling
   - Responsive design
   - Accessibility considerations

4. **Development**
   - ESLint configuration
   - Prettier formatting
   - Git hooks ready
   - TypeScript ready structure

## Styling System

- **Design System**: Consistent color palette and spacing
- **Responsive**: Mobile-first approach with Tailwind breakpoints
- **Dark Mode**: System preference detection with manual toggle
- **Components**: Reusable styled components with variants
- **Icons**: Lucide React icon system

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Follow the existing code structure
2. Use TypeScript for new features when ready
3. Maintain responsive design principles
4. Follow accessibility guidelines
5. Write meaningful commit messages

## Performance Considerations

- Images are optimized for web delivery
- Redux state is normalized
- Components are optimized for re-renders
- Lazy loading implemented for routes
- Bundle splitting configured

---

This frontend provides a solid foundation for a modern social media application with Instagram-like functionality and can be easily extended with additional features.
