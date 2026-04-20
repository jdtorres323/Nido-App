# Design System Strategy: The Digital Hearth

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Digital Hearth."** Rather than treating household finance as a cold, spreadsheet-driven chore, this system frames expense management as a warm, communal, and tactile experience. 

The aesthetic moves away from "Standard Fintech" (sterile whites and sharp blues) toward a **High-End Editorial** feel. We achieve this through:
*   **Intentional Asymmetry:** Breaking the rigid vertical grid with overlapping avatars and staggered card layouts.
*   **Organic Brutalism:** Combining the softness of `xl` (3rem) corner radii with the authoritative, high-contrast presence of `epilogue` (Recoleta-equivalent) display type.
*   **Tactile Layering:** Using a palette of "Warm Creams" and "Terracotta" to mimic the feeling of physical ledger paper and clay, creating an environment that feels lived-in and trustworthy.

## 2. Colors: Tonal Architecture
The palette is rooted in earth tones to evoke stability and home. We leverage Material Design 3 naming conventions to ensure a systematic application of these custom hues.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the separation necessary.

### Surface Hierarchy & Nesting
Instead of a flat grid, treat the UI as stacked sheets of fine paper.
*   **Base Layer:** `background` (#fdfae7) for the primary screen real estate.
*   **Secondary Layer:** `surface-container` (#f1eedb) for grouped content areas.
*   **Interactive Layer:** `surface-container-lowest` (#ffffff) for high-priority interactive cards.
*   **Depth Strategy:** To move beyond "out-of-the-box" UI, use **Glassmorphism** for floating action buttons or sticky headers. Apply `surface` colors at 80% opacity with a `backdrop-filter: blur(20px)` to allow underlying terracotta or sage accents to bleed through.

### Signature Textures
Main CTAs and Hero sections should utilize a "Sunset Gradient." Transition from `primary` (#9a442d) to `primary_container` (#e07a5f) at a 135-degree angle. This provides a visual "soul" that a flat hex code cannot achieve.

## 3. Typography: The Editorial Voice
We utilize a high-contrast pairing: a sophisticated serif-style display face (`epilogue`) and a highly legible geometric sans (`beVietnamPro`).

*   **Display & Headline (Epilogue):** These are the "Editorial" moments. Use `display-lg` for monthly totals and `headline-md` for category headers. The goal is to make numbers feel like headlines in a premium magazine.
*   **Body & Labels (BeVietnamPro):** Used for all functional data. Use `body-lg` for expense descriptions and `label-sm` (all caps, tracked out +5%) for secondary metadata like timestamps.
*   **The Hierarchy Rule:** Never pair two fonts of the same size. If a Headline is 1.75rem, the sub-caption must drop significantly to 0.875rem to create the "editorial" tension between large and small.

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often a crutch for poor layout. In this system, we use **Tonal Layering** first.

*   **The Layering Principle:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f7f4e1) section. The slight shift in "warmth" creates a soft, natural lift.
*   **Ambient Shadows:** When a "floating" effect is required (e.g., a Bottom Sheet), use an extra-diffused shadow: `box-shadow: 0 12px 40px rgba(61, 64, 91, 0.06)`. Note the use of the Deep Navy (`on-surface`) for the shadow color rather than pure black; this mimics natural, ambient light.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` at 20% opacity. 100% opaque borders are strictly forbidden.

## 5. Components: Tactile Primitives

### Buttons
*   **Primary:** Uses the "Sunset Gradient" (Primary to Primary-Container). Radius: `full` (9999px) for a "pill" feel that invites touch.
*   **Secondary:** `secondary_container` background with `on_secondary_container` text. Radius: `md` (1.5rem).
*   **Tertiary:** No background. Text-only in `primary`.

### Cards & Lists
*   **The Anti-Divider Rule:** Forbid the use of horizontal rules (`<hr>`). Separate list items using 12px or 16px of vertical whitespace.
*   **Nido-Style Cards:** Use `xl` (3rem) corner radius. On household overview cards, allow the "Overlapping Avatar" pattern to break the card's padding, bleeding into the margin to create depth.

### Input Fields
*   **Style:** Minimalist. No bounding box. Use a `surface-container-highest` bottom-only highlight. 
*   **Focus State:** The bottom highlight transitions to `primary` (#9a442d) with a 2px weight.

### Contextual Components (The "Nido" Special)
*   **The Shared Ledger Chip:** A sage-green (`secondary`) chip indicating which household member paid.
*   **Overlapping Avatar Stack:** Avatars should have a 2px `surface` border to ensure they pop when stacked over multicolored terracotta backgrounds.

## 6. Do's and Don'ts

### Do
*   **Do** use generous whitespace. If you think there is enough padding, add 8px more.
*   **Do** use `epilogue` for all currency displays to give money a "weighted" importance.
*   **Do** utilize vertical layouts that prioritize the thumb-zone (bottom 60% of the screen).

### Don't
*   **Don't** use pure black (#000000) for anything. Use `on_surface` (#1c1c11) for maximum depth.
*   **Don't** use standard "Material Design" shadows. Keep them large, soft, and barely visible.
*   **Don't** use sharp corners. Every interactive element must have at least a `sm` (0.5rem) radius to maintain the "Soft Minimalism" feel.