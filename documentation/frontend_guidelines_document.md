# Frontend Guideline Document

This document lays out how our frontend is built, why we’ve chosen certain tools and methods, and how everything fits together. It’s written in plain language so anyone—developers or non-technical team members—can understand how our web interface works.

## 1. Frontend Architecture

### 1.1 Overview of Frameworks and Libraries
- **Next.js**: Gives us server-side rendering, fast page loads, and a file-based router.
- **React**: Provides the UI building blocks with reusable components.
- **TypeScript**: Adds type safety, making our code more reliable and easier to maintain.
- **CSS Modules** (built into Next.js): Keeps styles scoped to components so we don’t have naming conflicts.

### 1.2 How It Supports Scalability, Maintainability, and Performance
- **Scalability**: File-based routing and component folders let us add pages and features without changing existing code.
- **Maintainability**: TypeScript catches errors early. CSS Modules keep styles local to components. A clear folder structure (pages/, components/, styles/) makes it easy to find and update code.
- **Performance**: Next.js handles code splitting automatically. Pages load quickly because only the code they need is sent to the browser.

---

## 2. Design Principles

### 2.1 Usability
- **Clear Navigation**: Menus and buttons are labeled in simple language (e.g., “Upload Document,” “View History”).
- **Minimal Steps**: Onboarding and common tasks happen in as few clicks as possible.

### 2.2 Accessibility
- **Keyboard Support**: All interactive elements can be reached and operated with the keyboard alone.
- **ARIA Labels**: We add appropriate ARIA attributes so screen readers can interpret buttons, forms, and dialogs.
- **Contrast Ratios**: Text and background colors meet WCAG AA standards for legibility.

### 2.3 Responsiveness
- **Mobile-First**: We design for small screens first, then add breakpoints for tablets and desktops.
- **Fluid Layouts**: Grids and flex layouts adjust to different screen sizes without horizontal scrolling.

---

## 3. Styling and Theming

### 3.1 Styling Approach
- **CSS Modules**: Each component has its own `.module.css` file. Class names are scoped automatically.
- **BEM Naming**: Within modules, we follow a simple BEM-like pattern: `.block`, `.block__element`, `.block--modifier`.

### 3.2 Theming
- We currently have one theme (light) with a neutral, modern look.
- If we add a dark mode or custom client branding in the future, we’ll use CSS custom properties (`:root { --primary-color: … }`) and switch them at runtime.

### 3.3 Visual Style
- **Flat & Modern**: No heavy shadows or skeuomorphic effects. Clean lines, simple icons, and subtle transitions.

### 3.4 Color Palette
- Primary Blue: #0066FF
- Secondary Blue: #004BB5
- Light Gray (Background): #F5F5F5
- Medium Gray (Borders): #CCCCCC
- Dark Gray (Text): #333333
- White: #FFFFFF

### 3.5 Typography
- **Font**: Inter, with a fallback to system sans-serif (e.g., `font-family: 'Inter', sans-serif;`).
- **Sizes**: Scale from 14px (body text) up to 32px (headers), using a consistent 4px or 8px step.

---

## 4. Component Structure

### 4.1 Organization
- `/components`: Reusable UI parts (Button, Modal, Table).
- `/layouts`: Page wrappers (DashboardLayout, AuthLayout).
- `/pages`: Routes (e.g., `index.tsx`, `onboarding.tsx`, `[docId].tsx`).
- `/styles`: Global styles and CSS variable definitions.

### 4.2 Reuse and Composition
- **Atomic Components** (e.g., Button, Input) have minimal responsibility.
- **Composite Components** (e.g., PDFUploader, ChatWindow) combine atomic parts and handle more complex logic.

### 4.3 Benefits of Component-Based Architecture
- **Consistency**: Buttons everywhere look and behave the same.
- **Maintainability**: Fix a bug in one Button component and it’s fixed everywhere.
- **Collaboration**: Teams can work on separate components without conflicts.

---

## 5. State Management

### 5.1 Local State
- For UI-only concerns (e.g., form input values, toggle states), we use React’s `useState` or `useReducer`.

### 5.2 Global State
- **React Context**: Holds authentication status, user profile, and theme settings.
- **Data Fetching & Caching**: We use SWR (or React Query) to fetch dashboard data, document lists, and billing info. This keeps data in sync across components and caches automatically.

### 5.3 Why This Approach
- No heavy Redux setup for a moderately complex app.
- SWR/React Query handles retries, caching, and background updates out of the box.

---

## 6. Routing and Navigation

### 6.1 Next.js File-Based Routing
- **Pages Folder**: Each file under `/pages` becomes a route.
  - `/pages/index.tsx` → `/`
  - `/pages/onboarding.tsx` → `/onboarding`
  - `/pages/docs/[docId].tsx` → `/docs/:docId`

### 6.2 Dynamic Routes
- Use bracket syntax (`[param]`) for pages that depend on IDs (documents, conversations).

### 6.3 Navigation Components
- **HeaderNav**: Top-level links (Dashboard, Billing, Settings).
- **SideNav**: Sub-sections (Uploads, History, User Management).
- **next/link** for client-side transitions and `useRouter` for programmatic navigation.

---

## 7. Performance Optimization

### 7.1 Code Splitting & Lazy Loading
- Next.js splits bundles by page automatically.
- For large components (e.g., PDF viewer), use `next/dynamic` to load them only when needed.

### 7.2 Asset Optimization
- **Images**: Serve via `next/image` for automatic resizing and modern formats (WebP).
- **Fonts**: Preload critical font files and host them locally to avoid third-party delays.

### 7.3 Caching and Pre-fetching
- Next.js prefetches linked pages on hover or when they appear in the viewport.
- SWR keeps data fresh with background revalidation.

---

## 8. Testing and Quality Assurance

### 8.1 Automated Tests
- **Unit Tests**: Jest + React Testing Library for component logic and rendering.
- **Integration Tests**: Test interactions between components (e.g., form submit → API call).
- **End-to-End Tests**: Cypress (or Playwright) to simulate user flows (sign-up, upload, chat).

### 8.2 Linting and Formatting
- **ESLint** with a shared config to catch code issues early.
- **Prettier** for consistent code style.
- **Husky + lint-staged** to run checks on pre-commit.

### 8.3 Type Checking
- TypeScript ensures component props and function signatures match expected shapes.
- CI pipeline blocks merges if any type errors remain.

---

## 9. Conclusion and Overall Frontend Summary

Our frontend uses Next.js, React, and TypeScript to deliver a fast, reliable, and scalable dashboard. We follow clear design principles—usability, accessibility, and responsiveness—to give users a smooth experience on any device. Scoped styling with CSS Modules and a flat, modern look keep our UI consistent and easy to update. Component-based structure, React Context, and SWR make the codebase maintainable and the data layer robust.

By adhering to these guidelines, we ensure:
- Quick page loads and sub-second acknowledgements.
- Secure, isolated views per client.
- A developer-friendly environment that scales as we grow.

Feel free to refer back to this document whenever you need clarity on why things are set up the way they are or how to add new features in line with our standards.