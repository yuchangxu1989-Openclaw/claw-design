# Dark Sci-Fi — Design System Package

## 1. Visual Theme
Deep purple/pink futuristic aesthetic with neon accents. Dark backgrounds create depth while vibrant accent colors draw attention to interactive elements and key information. The overall mood is high-tech, immersive, and forward-looking.

Primary background: #0b0612 (near-black with purple undertone)
Secondary background: #25105c (deep purple)
Panel surfaces use semi-transparent white overlays for layering.

## 2. Color Palette
- Background: #0b0612
- Background Secondary: #25105c
- Accent A (Pink): #ec4899
- Accent B (Sky Blue): #7dd3fc
- Accent C (Yellow): #facc15
- Ink (Primary Text): #f8fbff
- Muted Text: #b7c4d9
- Soft Text: #8ea1bd
- Line/Border: rgba(255,255,255,.14)
- Panel: rgba(255,255,255,.075)
- Panel Secondary: rgba(255,255,255,.12)
- Warm Accent: #ffd166

## 3. Typography
Font Family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
Used for both headings and body text.

Size Scale:
- xs: 11px
- sm: 12px
- base: 14px
- md: 15px
- lg: 16px
- xl: 21px
- 2xl: 25px
- 3xl: clamp(28px, 3.4vw, 44px)
- 4xl: clamp(42px, 5.1vw, 68px)

Weights: normal (400), medium (500)
Line Heights: tight (1.02), snug (1.12), normal (1.42), relaxed (1.62), loose (1.68)

## 4. Component Stylings
Cards: 1px solid border with line color, gradient background from panel2 to panel, xl border-radius, lg padding.
Primary Button: gradient background from accent-a to accent-b at 110deg, dark text, md border-radius.
Ghost Button: semi-transparent white background (6%), 1px border at 16% opacity, md border-radius.
Pill: 1px border at 16% opacity, dark semi-transparent background, full border-radius, sm font-size.
Section: xl vertical padding.
Eyebrow: sm font-size, 0.18em letter-spacing, uppercase.
Gradient Text: 110deg gradient from white through accent-a to accent-b, background-clip text.

## 5. Layout Principles
Base spacing unit: 8px
Spacing scale: xs(4px), sm(8px), md(14px), lg(20px), xl(28px), 2xl(34px), 3xl(42px)
Border radius scale: sm(10px), md(15px), lg(19px), xl(24px), 2xl(26px), 3xl(30px), full(999px)
Max content width: 1168px with 22px horizontal padding.

## 6. Imagery
No external image dependencies. Visual interest created through:
- CSS gradients (linear, radial)
- Semi-transparent overlays
- Neon glow effects via box-shadow with accent colors
- SVG icons and geometric shapes
- Color-mix functions for dynamic transparency

## 7. Animation
Subtle transitions preferred. No heavy animations.
- Hover states: smooth color/opacity transitions
- Glow effects: box-shadow with accent color at 20% opacity
- Card shadows: 34px blur, 92px spread at 42% opacity for depth

## 8. Accessibility
- High contrast ratio between ink (#f8fbff) and background (#0b0612)
- Muted text (#b7c4d9) maintains readable contrast on dark backgrounds
- Interactive elements have visible focus states via accent colors
- No reliance on color alone for information — structure and typography reinforce hierarchy

## 9. Brand Voice
Technical, confident, forward-looking. The design communicates precision and innovation without being cold. Neon accents add energy while the dark palette keeps things grounded and professional.