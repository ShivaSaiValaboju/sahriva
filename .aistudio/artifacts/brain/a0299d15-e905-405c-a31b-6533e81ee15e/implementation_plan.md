# Navbar Alignment & Mobile Viewport Lock Plan

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following two key architectural and styling preferences in Phase 1:
> - **Sign In Placement & Styling**: In the navbar action cluster, the **Sign In** button will be positioned *before* the **Theme & Accent** selector. On compact mobile viewports, it will render as a full pill button with crisp text and compact padding (`px-3 py-1.5 text-xs font-semibold rounded-lg`), ensuring it stays strictly inside the navbar boundary without clipping or overflow.
> - **Horizontal Sliding Prevention**: The entire application root, HTML body, and page viewports will enforce strict horizontal overflow containment (`overflow-x-hidden`, `max-w-full`, and bounded flex child constraints), preventing any left-or-right swipe wobbles or empty white gutters on mobile devices.

---

## 1. Overview & Core Concept

- **Problem**: On narrow mobile viewports (e.g. 360px–390px screens), placing the Sign In button at the absolute far-right of the navbar cluster caused slight visual right-edge overflow. In addition, touch gestures could horizontally slide the homepage slightly off-center.
- **Solution**:
  1. **Navbar Action Cluster Re-ordering**: Swap the positions of the **Theme & Accent Palette** toggle and the **Sign In / User Account** button. The Sign In button sits to the left of the theme icon, anchoring the theme icon cleanly on the right padding edge.
  2. **Strict Viewport Containment**: Apply `overflow-x-hidden` across the document body, the root application wrapper (`#root`, main container), and inner hero/section grids. Eliminate any negative margins or unconstrained flex items that could push the DOM beyond `100vw`.
  3. **Adaptive Brand Text**: Ensure the top-left wordmark (`SAHRIVA Store By Shiva Sai Valaboju`) uses responsive truncation (`min-w-0`, `truncate`, and responsive font scaling) so the right-side action buttons always have guaranteed padding and never collide with the viewport edge.

---

## 2. User Experience & Visual Design

### Mobile Navbar Layout (`< 640px`)
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] SAHRIVA Store          [Search] [Sign In] [Theme ☼] │
│        By Shiva Sai Valaboju                                │
└─────────────────────────────────────────────────────────────┘
```

- **Touch Ergonomics & Bounds**:
  - The navbar action cluster uses `flex items-center gap-1.5 sm:gap-2.5 shrink-0`.
  - The **Sign In** pill button uses compact padding (`px-2.5 py-1.5 text-xs`) to maintain an accessible touch target while freeing up horizontal real estate.
  - The **Theme & Accent selector** button sits comfortably at the far right with `p-1.5 sm:p-2`, displaying the active sun/moon icon alongside the color palette dot.
  - When authenticated, the user profile avatar pill (`name.charAt(0) + truncated name`) seamlessly occupies the same slot.

### Zero-Slop Viewport Lock
- Both `html` and `body` in `src/index.css` enforce `overflow-x-hidden` and `width: 100%`.
- The top header container uses `w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8` with `box-sizing: border-box`.
- Main carousel tracks (like Trending Right Now) retain smooth horizontal scroll inside their isolated overflow boundaries (`overflow-x-auto`) while strictly preventing the parent page from shifting horizontally.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Swap Theme and Sign In order**:
  - *Chosen Approach*: Move Sign In immediately after the Search button, placing the Theme button as the rightmost item.
  - *Why*: The Theme button is a square icon trigger (`~36px`), which has a fixed, predictable footprint on the far right margin, whereas the Sign In button contains text that previously expanded past the right margin on narrow screens.
  - *Trade-Off*: User expects Sign In in a prominent position; placing it adjacent to Search keeps it front-and-center, while the Theme icon stays cleanly anchored.

- **Decision 2: Mobile Brand Header Density**:
  - *Chosen Approach*: Add `min-w-0 flex-shrink` to the logo container so that if an ultra-narrow screen (like 320px) opens the store, the brand title gently truncates rather than pushing action buttons off-screen.
  - *Why*: Prevents layout breakage and horizontal scrollbars on all device sizes.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                           Navbar.tsx                             │
├────────────────────────────────┬─────────────────────────────────┤
│ Left Brand Zone                │ Right Actions Cluster           │
│ - SVG Icon                     │ - Search Trigger (⌘K)          │
│ - "SAHRIVA Store" Title        │ - Sign In / User Profile Pill  │
│ - "By Shiva Sai Valaboju" Sub  │ - Theme & Accent Dropdown (☼/☾)│
└────────────────────────────────┴─────────────────────────────────┘
                                 │
                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Global Viewport Guard                       │
├──────────────────────────────────────────────────────────────────┤
│ index.css: html, body { overflow-x: hidden; width: 100%; }       │
│ App.tsx: <div className="min-h-screen w-full overflow-x-hidden"> │
└──────────────────────────────────────────────────────────────────┘
```

### Component Modification Targets
1. **`src/components/layout/Navbar.tsx`**:
   - Reorder the action cluster JSX so the User Profile / Sign In component renders *before* the Theme & Accent selector.
   - Adjust mobile padding and flex gap classes (`gap-1.5 xs:gap-2 sm:gap-2.5`).
   - Add bounds checking to prevent dropdown menus from creating temporary scrollbars.
2. **`src/index.css` & `src/App.tsx`**:
   - Add explicit `overflow-x: hidden` to root layout wrappers.
   - Verify all carousel negative margins (`-mx-4 px-4 sm:mx-0`) are constrained within their parent overflow-hidden wrappers.
