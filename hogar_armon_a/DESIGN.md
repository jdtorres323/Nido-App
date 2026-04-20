# Design System Strategy: The Financial Hearth

## 1. Overview & Creative North Star
The North Star for this design system is **"The Domestic Archivist."** 

Standard financial apps are often cold, blue, and sterile—feeling more like a bank vault than a home. This system breaks that template by treating family expense tracking as a warm, editorial experience. We combine the soul of a high-end interior design magazine with the precision of a data-driven analytical tool.

By utilizing **intentional asymmetry** (e.g., placing large display titles off-center) and **tonal layering**, we move away from the "rigid grid" look. The mobile experience should feel like flipping through a beautifully bound ledger where every entry is treated with care.

---

## 2. Colors & Surface Philosophy
The palette is grounded in earth tones—Terracotta, Sage, and Warm Cream—designed to reduce the "financial anxiety" often associated with expense tracking.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts or subtle tonal transitions. 
*   **Action:** Use `surface_container_low` for section backgrounds sitting on a `surface` base. 

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like heavy cardstock sheets stacked on a wooden table.
*   **Level 0 (Base):** `surface` (#fdfae7) – The foundational desk.
*   **Level 1 (Sections):** `surface_container` (#f1eedb) – Broad content groupings.
*   **Level 2 (Active Cards):** `surface_container_lowest` (#ffffff) – High-priority interactive elements.

### The "Glass & Gradient" Rule
To add "soul," use subtle gradients on primary actions. Instead of a flat `#9a442d`, use a linear gradient from `primary` (#9a442d) to `primary_container` (#e07a5f) at a 135-degree angle. For floating overlays (like bottom sheets), use `surface_bright` with a 85% opacity and a `24px` backdrop blur to create a frosted-glass effect that feels premium and integrated.

---

## 3. Typography
We pair the organic, serif curves of **notoSerif** (as our editorial stand-in for Recoleta) with the functional clarity of **manrope** (representing DM Sans).

*   **Display & Headlines (notoSerif):** Used for "The Narrative." This is where the app talks to the user ("Good morning, Elena," or "Your monthly summary"). The high-contrast serif conveys authority and warmth.
*   **Body & Titles (manrope):** Used for "The Data." Manrope provides the analytical backbone. Its geometric nature ensures that numbers and expense categories are legible at a glance, even on small mobile screens.
*   **Hierarchy Note:** Always lead with a `display-md` or `headline-lg` for screen headers to establish an editorial "storytelling" feel before diving into the data lists.

---

## 4. Elevation & Depth
We eschew traditional Material shadows for **Tonal Layering.**

*   **The Layering Principle:** Depth is achieved by "stacking." A card containing a transaction should be `surface_container_lowest` (#ffffff) sitting on a `surface_container` (#f1eedb) background. This creates a soft, natural lift.
*   **Ambient Shadows:** If a floating action button (FAB) or high-priority modal requires a shadow, it must be an "Ambient Glow": 
    *   **Blur:** 40px
    *   **Opacity:** 6% 
    *   **Color:** Derived from `on_surface` (#1c1c11). 
*   **The Ghost Border:** For accessibility in high-glare environments, use a 1px border using `outline_variant` (#dbc1ba) at **15% opacity**. This provides a "suggestion" of a boundary without breaking the organic flow.

---

## 5. Components

### Buttons & Interaction
*   **Primary Action:** Rounded at `full` (9999px) or `xl` (3rem). Uses the Terracotta gradient. No shadow; use a 2px `outline` of the same color if placed on dark backgrounds.
*   **Secondary/Sage:** Uses `tertiary` (#386753) for "Save" or "Add" actions. It signifies growth and positive movement.

### Cards & Transaction Lists
*   **Forbid Dividers:** Do not use lines between transactions. Use `0.5rem` of vertical whitespace and a subtle shift to `surface_container_low` on every other item if a zebra-stripe is needed for readability.
*   **Analytical Chips:** Use `secondary_container` (#dcddff) for category tags (e.g., "Groceries," "Rent"). The roundness must be `md` (1.5rem) to echo the friendly brand voice.

### Input Fields
*   **The "Soft Field":** Fields should not be boxes. They should be `surface_variant` (#e6e3d0) backgrounds with a `24px` (1.5rem) corner radius. The label sits in `title-sm` (manrope) above the field, never inside as placeholder text.

### Custom Component: The "Spending Hearth"
*   A hero-area visualization (e.g., a donut chart) that uses `primary`, `tertiary`, and `secondary` tokens. The chart should not have sharp edges; stroke ends should be rounded to match the system's 24px philosophy.

---

## 6. Do's and Don'ts

### Do
*   **Do** embrace white space. If a screen feels "full," increase the margins. This is an analytical tool; it needs room to breathe.
*   **Do** use asymmetrical margins. Try a 24px margin on the left and a 16px margin on the right for headline elements to create an editorial look.
*   **Do** use `on_surface_variant` for secondary data (dates, timestamps) to keep the visual hierarchy clear.

### Don't
*   **Don't** use pure black (#000000). Always use `on_background` (#1c1c11) to maintain the warmth of the "Cream" canvas.
*   **Don't** use standard "Information Blue." If you need to highlight a neutral notification, use the Sage Green (`tertiary`).
*   **Don't** use sharp corners. Every interactive element must adhere to the `DEFAULT` (1rem) or `xl` (3rem) corner radius. Sharp corners are forbidden.