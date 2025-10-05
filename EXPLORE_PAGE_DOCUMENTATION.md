# Instagram-Style Explore Page

## 🌟 Overview

Complete implementation of Instagram 2025-style Explore page with modern UI/UX and best practices.

## ✨ Features

### 🔍 **Smart Search**

- Real-time search with debouncing (300ms)
- Autocomplete for users and hashtags
- Search suggestions dropdown
- Support for @mentions and #hashtags
- Click-outside to close functionality

### 📱 **Responsive Design**

- **Mobile**: 3-column grid layout
- **Tablet**: 2-column grid layout
- **Desktop**: 3-column masonry layout with varied sizes
- Adaptive stories and quick actions

### 🎭 **Story Categories**

- Horizontal scrolling story highlights
- Gradient-bordered story rings
- Smooth scroll with navigation arrows
- Auto-hide navigation based on scroll position

### ⚡ **Quick Actions**

- Instagram-style circular action buttons
- Gradient backgrounds with hover effects
- Categories: Create, Search, People, Trending, Reels

### #️⃣ **Trending Hashtags**

- Grid of popular hashtags
- Real-time post counts
- "HOT" trending indicators
- Interactive hashtag cards

### 🖼️ **Posts Grid**

- Infinite scroll with intersection observer
- Masonry layout for desktop (varied sizes)
- Hover overlays showing like/comment counts
- Video indicators and multi-image badges
- Lazy loading with skeleton states

### 🔄 **Advanced Interactions**

- Post modal integration
- Search filtering by username/hashtag/caption
- Optimized caching with React Query
- Smooth animations and transitions

## 🏗️ Architecture

### **Components Structure**

```
pages/Explore.jsx                 # Main page component
├── components/explore/
│   ├── ExploreHeader.jsx         # Search bar + trending tags
│   ├── ExploreStories.jsx        # Story highlights section
│   ├── ExploreQuickActions.jsx   # Action buttons
│   ├── ExploreSuggestions.jsx    # Hashtag suggestions
│   └── ExploreGrid.jsx           # Posts masonry grid
```

### **Custom Hooks**

- `useTrendingPosts()` - Infinite scroll posts with React Query
- `useSearchUsers()` - User search with debouncing
- `useDebounce()` - Generic debouncing utility

### **API Endpoints**

- `GET /posts/trending?page=1&limit=20` - Paginated trending posts
- `GET /users/search?q={query}` - User search
- `GET /posts/{id}` - Individual post details

## 🎨 Design Patterns

### **Responsive Breakpoints**

- `md:hidden` - Mobile only (< 768px)
- `hidden md:block lg:hidden` - Tablet only (768px - 1024px)
- `hidden lg:block` - Desktop only (> 1024px)

### **Color System**

- Gradient backgrounds for visual hierarchy
- Dark mode support throughout
- Consistent hover states and transitions

### **Performance Optimizations**

- Image lazy loading with skeleton states
- Intersection observer for infinite scroll
- React Query caching with 5-minute stale time
- Debounced search to reduce API calls

## 🚀 Usage

```jsx
import Explore from "@/pages/Explore";

// Basic usage
<Explore />;
```

### **Key Props & Events**

```jsx
// ExploreHeader component
<ExploreHeader
  onSearch={(query) => handleSearch(query)}
/>

// ExploreGrid component
<ExploreGrid
  searchQuery={searchQuery}
  onPostClick={(post) => openPostModal(post)}
/>
```

## 🛠️ Technical Implementation

### **Search Functionality**

```javascript
const debouncedQuery = useDebounce(query, 300);
const { data: searchResults } = useSearchUsers(
  debouncedQuery.trim() ? debouncedQuery : null
);
```

### **Infinite Scroll**

```javascript
const { ref, inView } = useInView({ threshold: 0, rootMargin: "200px" });

useEffect(() => {
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
```

### **Masonry Grid Pattern**

```javascript
const getGridItemClass = (index) => {
  const patterns = [
    "col-span-1 row-span-1", // Small square
    "col-span-1 row-span-2", // Tall rectangle
    "col-span-2 row-span-1", // Wide rectangle
  ];
  return patterns[index % patterns.length];
};
```

## 🎯 Instagram 2025 Features

### ✅ **Implemented**

- Modern search with autocomplete
- Story highlights with smooth scrolling
- Masonry grid layout
- Quick action buttons
- Trending hashtag suggestions
- Dark mode support
- Responsive design
- Infinite scroll
- Post previews with hover effects

### 🔮 **Future Enhancements**

- Video autoplay on hover
- Advanced filters (date, location)
- Saved collections
- AI-powered content recommendations
- Voice search
- AR story previews

## 📱 Mobile Experience

- Touch-optimized interactions
- Swipe navigation for stories
- Bottom sheet modals
- Gesture-based actions
- Optimized image loading

## 🎨 Visual Design

- Instagram-inspired gradient backgrounds
- Smooth micro-animations
- Consistent spacing with Tailwind
- Modern glass-morphism effects
- Accessible color contrasts

## 🧪 Testing

Test the Explore page functionality:

1. **Search**: Try searching users with @username
2. **Hashtags**: Click trending hashtags
3. **Stories**: Scroll through story categories
4. **Grid**: Test infinite scroll and post clicks
5. **Responsive**: Check mobile/tablet/desktop layouts

## 📊 Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3s

Built with ⚛️ React + ⚡ Vite + 🎨 Tailwind CSS
