# Q-Sight Regulatory System - Design Guidelines

## Design Approach
**System Selected:** Carbon Design System (IBM) adapted for financial regulatory applications
**Rationale:** Enterprise data-heavy application requiring robust data visualization, complex forms, and professional government-sector credibility. Carbon excels at information-dense interfaces while maintaining clarity and usability.

## Core Design Principles
1. **Data Clarity First:** Financial data must be immediately comprehensible with clear visual hierarchy
2. **Professional Authority:** Design conveys trust, stability, and regulatory credibility
3. **Efficient Workflows:** Minimize clicks for frequently-used analyst tasks
4. **Contextual Intelligence:** Display relevant data summaries and alerts throughout the interface

## Color Palette

### Light Mode
- **Primary Brand:** 210 65% 45% (Professional regulatory blue)
- **Primary Hover:** 210 65% 38%
- **Secondary Accent:** 160 45% 42% (Success/compliant green)
- **Background:** 220 15% 98%
- **Surface:** 0 0% 100%
- **Border:** 220 15% 88%
- **Text Primary:** 220 25% 15%
- **Text Secondary:** 220 15% 45%

### Dark Mode
- **Primary Brand:** 210 70% 55%
- **Primary Hover:** 210 70% 62%
- **Secondary Accent:** 160 50% 48%
- **Background:** 220 20% 8%
- **Surface:** 220 18% 12%
- **Border:** 220 15% 20%
- **Text Primary:** 220 10% 95%
- **Text Secondary:** 220 10% 70%

### Status Colors (Both Modes)
- **Success/Compliant:** 160 50% 45% (Light) / 160 55% 52% (Dark)
- **Warning/Attention:** 35 85% 55% (Light) / 35 80% 60% (Dark)
- **Error/Critical:** 0 75% 50% (Light) / 0 70% 58% (Dark)
- **Info/Neutral:** 210 60% 52% (Light) / 210 65% 58% (Dark)

### CAMELS Rating Colors
- **Rating 1 (Strong):** 142 71% 45%
- **Rating 2 (Satisfactory):** 160 50% 48%
- **Rating 3 (Fair):** 45 93% 62%
- **Rating 4 (Marginal):** 28 80% 52%
- **Rating 5 (Unsatisfactory):** 0 72% 51%

## Typography
- **Primary Font:** Inter (via Google Fonts CDN)
- **Monospace Font:** JetBrains Mono (for financial figures, account numbers)

### Type Scale
- **Display Headings:** text-3xl font-semibold (30px, 600 weight)
- **Page Titles:** text-2xl font-semibold (24px, 600 weight)
- **Section Headers:** text-xl font-medium (20px, 500 weight)
- **Card Titles:** text-lg font-medium (18px, 500 weight)
- **Body Text:** text-base font-normal (16px, 400 weight)
- **Secondary Text:** text-sm font-normal (14px, 400 weight)
- **Caption/Labels:** text-xs font-medium (12px, 500 weight)
- **Financial Figures:** font-mono text-base font-medium

## Layout System
**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20 (e.g., p-4, m-8, gap-6)

### Application Shell
- **Sidebar Width:** 280px (w-70) - fixed left sidebar
- **Sidebar Collapsed:** 72px (w-18) - icon-only mode
- **Top Header Height:** 64px (h-16)
- **Content Max Width:** Full width with 32px padding (px-8)
- **Content Vertical Padding:** py-6

### Grid Systems
- **Dashboard Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- **Data Tables:** Full width with horizontal scroll on overflow
- **Form Layouts:** grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 for multi-column forms

## Component Library

### Navigation (Left Sidebar)
- **Header:** Corporation logo + system name
- **Main Navigation:** Icon + label format with active state highlighting (left border accent + background tint)
- **Module Groups:** Returns, Surveillance, Risk, Premiums, SCV, Reports, Settings
- **User Profile:** Bottom-pinned with avatar, name, role, logout
- **Collapse Toggle:** Icon button at bottom for space optimization

### Authentication
- **Login Screen:** Centered card (max-w-md) with corporation branding, Replit Auth buttons (Google, GitHub, Email), professional background with subtle gradient

### Dashboard Components
- **KPI Cards:** Elevated cards with large metric value, label, trend indicator (up/down arrow), and sparkline chart
- **Summary Tables:** Striped rows, sticky headers, sortable columns, row hover state, pagination controls
- **Chart Containers:** Cards with title, date range selector, chart legend, export button

### Data Tables
- **Structure:** Sticky header, alternating row backgrounds, fixed action column
- **Features:** Multi-sort, inline filters, row selection, bulk actions, pagination with page size selector
- **Density:** Compact mode for large datasets (py-2), comfortable mode for readability (py-3)

### Forms
- **Input Fields:** Labels above inputs, helper text below, error states with red border + message, required field indicators
- **File Upload:** Drag-and-drop zone with file type/size indicators, upload progress bars, validation feedback panel
- **Validation Feedback:** Real-time validation with icon indicators (checkmark/error), summary panel listing all issues

### CAMELS Display
- **Component Cards:** Six cards (C-A-M-E-L-S) in 2x3 or 3x2 grid, each showing rating badge (1-5 with color), score percentage, key metrics list
- **Composite Rating:** Prominent display with large rating number, risk grade label, visual indicator (gauge or progress ring)
- **Trend Charts:** Line charts showing rating changes over time periods

### Stress Testing Interface
- **Scenario Selector:** Dropdown with scenario type + severity level radio buttons (Mild/Moderate/Severe)
- **Parameters Panel:** Current vs. stressed values side-by-side comparison table
- **Impact Visualization:** Before/after bar charts, delta indicators (percentage change with color coding)
- **CAMELS Comparison:** Two column layout showing current vs. stressed ratings with deterioration highlights

### Reporting
- **Report Builder:** Left panel with data source selector + filters, center preview area, right panel with export options
- **Chart Types:** Line (trends), Bar (comparisons), Pie (composition), Area (cumulative), Heatmap (risk matrix)
- **Export Controls:** PDF/Excel buttons, date range selector, report template dropdown

## Visual Patterns

### Status Indicators
- **Badges:** Rounded pills (px-3 py-1 rounded-full text-xs font-medium) with appropriate status color
- **Icons:** Use Heroicons for consistent iconography throughout
- **Progress Indicators:** Linear progress bars for uploads/processing, circular for loading states

### Data Visualization
- **Library:** Recharts (via CDN) for all charts
- **Color Scheme:** Use primary brand color for single-series data, categorical palette for multi-series
- **Tooltips:** Always enabled with value formatting (currency, percentages, dates)

### Notifications
- **Toast Position:** Top-right corner, stacked
- **Types:** Success (green), Warning (orange), Error (red), Info (blue)
- **Duration:** 5 seconds auto-dismiss, persistent for errors until user dismisses

### Empty States
- **Content:** Icon + heading + description + primary action button
- **Usage:** Empty tables, no search results, incomplete setup states

## Accessibility & Interaction
- **Focus States:** 2px outline in primary brand color with 2px offset
- **Keyboard Navigation:** Full tab-order support, escape to close modals/dropdowns
- **Screen Reader:** Proper ARIA labels for all interactive elements
- **Animations:** Minimal - only for state transitions (200ms ease-in-out), no decorative animations

## Images
No hero images required. This is a data-driven enterprise application where all screen real estate is dedicated to functional content. Use:
- **Corporation logo** in login screen and sidebar header
- **User avatar** in profile section
- **Empty state illustrations** (simple line drawings) for empty tables/lists