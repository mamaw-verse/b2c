# Halal Marketplace Reference Screens & Asset Generation Specification

This document details the foundation fixes applied to the 15 reference screens, the full Philippine Halal marketplace adaptations, and a production-ready catalog of generative AI prompts for each image and vector placeholder.

---

## 1. Foundation Fixes Applied Across Screens

1. **Sticky Action Bar Geometry & Safe Areas (`pb-sticky-bar`)**:
   - Replaced arbitrary hardcoded padding (`pb-24`, `pb-28`) with the semantic `@utility pb-sticky-bar` (`calc(var(--sticky-bar-h) + env(safe-area-inset-bottom, 0px))`).
   - Applied to **Product Detail**, **Cart**, **Checkout**, and **Seller Product Form**, guaranteeing clearance on mobile viewports without clipping content under fixed sticky bars.
   - Synchronized cart bottom offset with `var(--tabbar-h)` and device safe area.

2. **Touch Targets (WCAG 2.2 AA Compliance ≥ 44px)**:
   - Elevated and hit-expanded all interactive links and buttons:
     - Certificate links (`a "View certificate"`) converted to `inline-flex min-h-touch items-center`.
     - Cart shop group header (`<h2>`) made `flex-wrap` with `min-w-touch` on the shop link so narrow table/grid cells do not crush hit areas below 44px.
     - Quantity stepper hit areas and OTP input autofill compatibility.

3. **High-Fidelity Media Placeholders**:
   - Enhanced `media()` in `sheets/ui/core.mjs` with subtle blueprint dot grid geometry (`bg-[radial-gradient(currentColor_1px,transparent_1px)] [background-size:12px_12px] opacity-15`), preserving icon semantics while exposing `data-placeholder-id` and `data-spec`.
   - Guaranteed full contrast and font-size accessibility across both **Default** and **Demo** brands.

4. **Zero Test Regressions**:
   - **924 of 924 test runs passed** with 0 overflow, 0 touch errors, 0 tiny text, 0 input font size issues, 0 axe accessibility violations, and 0 focus return failures.

---

## 2. Halal Marketplace Taxonomy & Context (PRD 02 Alignment)

- **Accreditation Bodies**: Recognized Philippine Halal certifiers integrated across data models:
  - **IDCP**: Islamic Da'wah Council of the Philippines
  - **HDIP**: Halal Development Institute of the Philippines
  - **HICCP**: Halal International Chamber of Commerce
  - **BMM**: Muslim Mindanao Halal Certification Board
- **Halal Logistics & Handling**:
  - Segregated Halal logistics badge & guarantee (zero cross-contamination with non-Halal cargo).
  - Temperature-controlled cold-chain shipping for fresh dressed native poultry and frozen beef cuts.
  - Tamper-evident Halal security seal applied at packing.
- **Merchant Accreditation**:
  - "Official Halal Store" and "IDCP Accredited Merchant" verification badges.
  - Seller product listing flow enforces Halal certification number, issuing body, validity date, and certificate document attachment.
- **Trust & Moderation**:
  - Moderation queue flags unverified Halal claims, certificate expiration, and prohibited ingredients.

---

## 3. High-Fidelity Generative AI Asset Prompts

Below are the detailed generative AI prompts (Midjourney / Imagen / DALL-E 3 / Vector tools) for every visual asset across the 15 screens.

---

### A. Storefront & Marketing Graphics

#### 1. Hero Fiesta Banner
- **Placeholder ID**: `hero-halal-fiesta-banner`
- **Location**: Screen 1 — Home (Hero Section)
- **Dimensions**: `1200 × 440 px` (Aspect Ratio: `30:11`)
- **Format**: WebP / PNG
- **Background**: **Non-transparent** (Opaque festive deep emerald green and warm gold gradient)
- **Prompt**:
  > *Ultra-wide commercial hero promotional banner for a Philippine Halal Food Festival. Warm, modern aesthetic featuring an elegant deep emerald green gradient backdrop with intricate, subtle Islamic geometric filigree motifs etched in shimmering gold lines. On the right, an appetizing spread of Southeast Asian Halal delicacies: a bowl of slow-simmered rich caramelized beef rendang garnished with fresh kaffir lime leaves, a traditional clay plate of golden yellow turmeric rice, fresh native chicken skewers, and a bowl of glossy black Ajwa dates. Professional studio food photography, soft cinematic top-down warm lighting, steam rising gently, clean minimalist composition with ample negative copy space on the left. Commercial food photography, 8k resolution, photorealistic.*

#### 2. Shop Banner — Al-Barakah Halal Mart
- **Placeholder ID**: `shop-albarakah-banner`
- **Location**: Screen 11 — Shop Profile
- **Dimensions**: `1200 × 320 px` (Aspect Ratio: `15:4`)
- **Format**: WebP / PNG
- **Background**: **Non-transparent** (Subtle warm cream backdrop with Mindanao okir Islamic geometric border)
- **Prompt**:
  > *Header banner for a premium Halal grocery marketplace store called Al-Barakah Halal Mart. Clean minimalist studio flatlay on a warm neutral linen surface. Elegant arrangement of raw organic spices: star anise, cinnamon quills, fresh lemongrass stalks, galangal slices, and a small glass jar of golden wild honey. Soft diffused daylight, subtle traditional Southern Philippine Muslim wood-carving (okir) patterns watermarked in the background. High-end culinary branding, shallow depth of field, photorealistic, 8k.*

---

### B. Product Packshots & Gallery Assets

#### 3. Halal Beef Rendang Cook-in-Paste 250g (Cover / Packshot)
- **Placeholder ID**: `prod-rendang-paste`
- **Location**: Screen 1 (Grid), Screen 2 (Search), Screen 3 (Category), Screen 4 (PDP Slide 1), Screen 5 (Cart), Screen 6 (Checkout)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Alpha channel, pure cutout with realistic soft ground contact shadow)
- **Prompt**:
  > *Studio packshot of a premium Halal Beef Rendang Cook-in-Paste in a 250g matte pouch packaging standing upright. Clean modern graphic label design with "100% Halal Certified" green circular trust emblem, gold typography, and an illustration of rich simmered beef rendang. Matte foil pouch texture, tamper-evident tear notch at the top, perfectly centered studio lighting with crisp soft contact shadow underneath. Pure transparent background, isolated product shot, 8k, commercial e-commerce packaging.*

#### 4. Cooked Beef Rendang with Steamed Rice (Culinary Serving)
- **Placeholder ID**: `pd-rendang-cooked-serving`
- **Location**: Screen 4 — Product Detail (Gallery Slide 2)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: WebP / JPEG
- **Background**: **Non-transparent** (Warm slate table surface)
- **Prompt**:
  > *Overhead 45-degree angle mouthwatering culinary food photograph of freshly cooked Beef Rendang made from the paste. Rich, deep mahogany caramelized coconut sauce coating tender beef chunks, garnished with thin fresh kaffir lime leaf chiffonade and a sliced red bird's eye chili. Served in a shallow dark ceramic bowl alongside a small dome of fragrant steaming jasmine rice and fresh cucumber slices on a dark slate tabletop. Natural window lighting, mouth-watering reflections, appetizing food photography, Michelin-guide presentation style.*

#### 5. Rendang Nutrition & IDCP Halal Certificate Panel
- **Placeholder ID**: `pd-rendang-nutrition-cert`
- **Location**: Screen 4 — Product Detail (Gallery Slide 3)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Clean isolated flatlay)
- **Prompt**:
  > *Back-of-pack macro studio shot of the food packaging showing the official nutrition facts label, clean ingredient list (No pork, no lard, no alcohol), and prominent embossed green-and-gold IDCP (Islamic Da'wah Council of the Philippines) Halal certified stamp and barcode. Crisp macro typography, clean lighting, isolated on transparent background.*

#### 6. Fresh Traditional Aromatics & Ingredients
- **Placeholder ID**: `pd-rendang-spices-in-use`
- **Location**: Screen 4 — Product Detail (Gallery Slide 4)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: WebP / JPEG
- **Background**: **Non-transparent** (Rustic teak cutting board)
- **Prompt**:
  > *Top-down flatlay composition of fresh raw Halal Rendang ingredients on a handcrafted teak butcher block: bruised fresh lemongrass stalks, sliced aromatic galangal rhizome, fresh turmeric roots with vibrant orange interior, toasted golden coconut kerisik in a small wooden bowl, and whole red bird's eye chilies. Soft morning sunlight, rustic artisanal kitchen atmosphere, culinary documentary photography.*

#### 7. Modest Silk-Chiffon Instant Hijab (Sage Green)
- **Placeholder ID**: `prod-chiffon-hijab`
- **Location**: Screen 1 (Grid), Screen 3 (Category), Screen 7 (Orders)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Isolated with soft contact shadow)
- **Prompt**:
  > *Commercial studio product photography of a premium modest silk-chiffon instant double-loop hijab folded neatly in an elegant presentation drape. Color: soft dusty sage green. Fluid, airy fabric texture with subtle translucent sheen, delicate clean baby-hem stitching along the edges, folded with gentle organic ripples. Clean soft studio flash, transparent background, isolated product.*

#### 8. Raw Wild Mindanao Forest Honey 500g
- **Placeholder ID**: `prod-wild-honey`
- **Location**: Screen 1 (Grid), Screen 3 (Category)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Isolated glass packshot)
- **Prompt**:
  > *Hexagonal 500g glass jar filled with rich dark amber wild forest honey harvested from Basilan, Mindanao. Kraft paper neck tag tied with natural jute twine reading "100% Raw Wild Honey - Halal Certified". Golden light shining through the honey creating luminous warm amber refraction. Next to the jar is a carved wooden honey dipper with a golden honey drip. Isolated on transparent background with soft shadow.*

#### 9. Halal Water-Permeable Breathable Nail Polish (Wudu-Friendly)
- **Placeholder ID**: `prod-halal-nailpolish`
- **Location**: Screen 1 (Grid), Screen 3 (Category)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (High-end luxury beauty packshot)
- **Prompt**:
  > *Luxury cosmetic product packshot of a square glass bottle of Halal water-permeable breathable nail polish. Shade: elegant warm dusty nude rose. Frosted glass finish with gold foil lettering reading "Wudu-Friendly Halal Breathable". White matte cap with glass dropper wand resting alongside with a single glossy drop. Soft diffused beauty cosmetic studio lighting, crisp caustics, isolated on transparent background.*

#### 10. Halal Fresh Native Dressed Chicken 1.2kg
- **Placeholder ID**: `prod-halal-chicken`
- **Location**: Screen 1 (Grid), Screen 3 (Category)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Clean food-grade vacuum packshot)
- **Prompt**:
  > *Fresh whole dressed Philippine native chicken sealed in heavy-duty food-grade vacuum packaging, resting on crushed ice. Transparent shrink wrap showcasing yellow-tinted free-range skin, clean Halal inspection label with prominent green HDIP Halal slaughter certification seal and traceability QR code. Cold-chain mist effect, clean sanitary refrigerated studio lighting, transparent background.*

#### 11. Saudi Ajwa Dates (Al-Madinah) 500g Luxury Box
- **Placeholder ID**: `prod-ajwa-dates`
- **Location**: Screen 1 (Grid), Screen 3 (Category)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Luxury confectionery packaging)
- **Prompt**:
  > *Luxury rigid presentation gift box of authentic Saudi Ajwa dates from Al-Madinah Al-Munawwarah. Premium emerald green box with gold foil Islamic geometric lattice and embossed calligraphy. Box is open showing 500g of plump, glossy, wrinkled black Ajwa dates arranged in neat rows within individual gold paper cups. High-end e-commerce gift photography, transparent background with soft drop shadow.*

#### 12. Organic Cold-Pressed Black Seed Oil (Habbatussauda) 100ml
- **Placeholder ID**: `prod-blackseed-oil`
- **Location**: Screen 1 (Grid), Screen 3 (Category)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Apothecary wellness bottle)
- **Prompt**:
  > *Apothecary-style 100ml amber glass dropper bottle of pure cold-pressed Black Seed Oil (Nigella Sativa / Habbatussauda). Elegant botanical minimalist label with gold foil accents and Halal logo. A small scattering of tiny black nigella seeds around the base of the bottle. Clean wellness product photography, backlight glowing through amber bottle, transparent background.*

#### 13. Crispy Fried Anchovies with Garlic & Sambal 200g
- **Placeholder ID**: `prod-crispy-anchovies`
- **Location**: Screen 1 (Grid), Screen 5 (Cart), Screen 6 (Checkout), Screen 8 (Order Detail)
- **Dimensions**: `800 × 800 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background**
- **Background**: **Transparent** (Stand-up snack pouch)
- **Prompt**:
  > *Resealable kraft matte stand-up pouch packaging for crispy fried anchovies with toasted garlic flakes and spicy sambal chili. Clear oval viewing window on the pouch showing golden crispy dried anchovies and red chili flakes. Certified Halal logo printed on top right. Crisp e-commerce packshot, transparent background.*

---

### C. Merchant Emblems & Moderation Assets

#### 14. Al-Barakah Halal Mart Store Emblem Logo
- **Placeholder ID**: `shop-albarakah-logo`
- **Location**: Screens 1, 4, 5, 6, 8, 9, 11, 12 (Store Avatar / Header)
- **Dimensions**: `400 × 400 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background** / SVG
- **Background**: **Transparent**
- **Prompt**:
  > *Minimalist vector logo emblem for "Al-Barakah Halal Mart". An elegant symmetrical geometric icon combining an Islamic 8-pointed star (Khatam) with a modern stylized green leaf and crescent moon. Color palette: emerald forest green (#1A6B48) and warm metallic gold. Flat vector design, clean lines, scalable icon, transparent background.*

#### 15. Noor Modest & Lifestyle Store Emblem Logo
- **Placeholder ID**: `shop-noor-logo`
- **Location**: Screens 1, 5, 7, 11 (Store Avatar)
- **Dimensions**: `400 × 400 px` (Aspect Ratio: `1:1`)
- **Format**: PNG with **Transparent Background** / SVG
- **Background**: **Transparent**
- **Prompt**:
  > *Modern aesthetic logo for "Noor Modest Wear". Minimalist continuous single-line Arabic monogram forming the word "Noor" (Light) integrated with an organic botanical lotus petal. Color: warm terracotta and champagne gold. Luxury fashion boutique identity, flat vector icon, transparent background.*

#### 16. Admin Moderation Flagged Listing — Uninspected Frozen Cuts
- **Placeholder ID**: `admin-flagged-meat-1`, `admin-flagged-meat-2`, `admin-flagged-meat-3`
- **Location**: Screen 14 — Admin Moderation Queue (Detail Pane)
- **Dimensions**: `600 × 600 px` (Aspect Ratio: `1:1`)
- **Format**: WebP / JPEG
- **Background**: **Non-transparent** (Inspection table)
- **Prompt**:
  > *Realistic warehouse inspection photo of imported frozen beef ribeye cuts packaged in unlabelled plastic with a suspicious generic printed sticker reading "100% Halal AAA". Harsh fluorescent inspection lighting, stainless steel inspection table, realistic evidence photo style for e-commerce compliance audit.*
