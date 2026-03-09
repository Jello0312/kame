# Kame Architecture Update v3: FINAL — All Decisions Locked

> Decision Date: March 2026
> Status: APPROVED — ready for Claude Code implementation

---

## Summary of ALL Finalized Decisions

1. **Hybrid outfit approach**: Dresses solo (1 FASHN call), tops+bottoms paired (2 FASHN calls)
2. **Gender-filtered feed**: Users set gender during onboarding (M/W), only see matching + unisex outfits
3. **Swipe saves individual products**: Not outfits — cleaner for "Buy Now" monetization
4. **outfitGroupId links paired items**: UUID on SwipeAction connecting items liked from same swipe
5. **Pre-generation cap**: 20 outfits for women, 15 outfits for men per user
6. **Personalized try-on for MVP**: Full per-user generation (best demo experience)
7. **Option C migration planned for v1.2**: Shared models in feed + personalize on like (85% cost reduction)
8. **FeedService abstraction layer**: getTryOnImageForFeed() method — swap implementation without frontend changes
9. **Product catalog: 84+ real products** with real images and real product page URLs
10. **Affiliate URLs deferred to v1.1**: Field exists (nullable), not populated in MVP

---

## Cost Model

### MVP (20 beta users)
| User Gender | Outfits Pre-Generated | FASHN API Calls | Cost per User |
|-------------|----------------------|-----------------|---------------|
| Female | 14 outfit pairs + 6 dresses = 20 | (14 × 2) + (6 × 1) = 34 | $2.55 |
| Male | 15 outfit pairs = 15 | 15 × 2 = 30 | $2.25 |

Assuming 10 female + 10 male beta users: (10 × $2.55) + (10 × $2.25) = **~$48 total for beta**

### Scale Migration (v1.2, 1000+ users)
Switch to Option C: shared model try-ons in feed, personalize only on like.
- One-time shared model generation: ~$75
- Per-user session cost: ~$0.75 (only liked items get personalized)
- Migration effort: 2-3 days, no frontend changes

---

## Schema Changes for Claude Code

### UserProfile — add gender
```prisma
model UserProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  heightCm        Float?
  weightKg        Float?
  waistCm         Float?
  bodyShape       String?  // "athletic" | "curvy" | "slim" | "average"
  measurementUnit String   @default("metric") // "metric" | "imperial"
  gender          String   // "M" | "W" — REQUIRED, set during onboarding

  user            User     @relation(fields: [userId], references: [id])
}
```

### OutfitPairing — curated top+bottom combos for the feed
```prisma
model OutfitPairing {
  id              String    @id @default(cuid())
  topProductId    String
  bottomProductId String
  gender          String    // "M", "W", or "U"
  styleTags       String[]
  createdAt       DateTime  @default(now())

  topProduct      Product   @relation("OutfitTop", fields: [topProductId], references: [id])
  bottomProduct   Product   @relation("OutfitBottom", fields: [bottomProductId], references: [id])
  tryOnResults    TryOnResult[]
}
```

### SwipeAction — add outfitGroupId
```prisma
model SwipeAction {
  id              String    @id @default(cuid())
  userId          String
  productId       String
  action          String    // "like" | "dislike"
  outfitGroupId   String?   // UUID linking paired items from same swipe
  createdAt       DateTime  @default(now())

  user            User      @relation(fields: [userId], references: [id])
  product         Product   @relation(fields: [productId], references: [id])
}
```

### TryOnResult — add outfit context
```prisma
model TryOnResult {
  id               String    @id @default(cuid())
  userId           String
  productId        String?   // null for combined outfit result
  outfitPairingId  String?   // links to outfit this belongs to
  resultImageUrl   String
  status           String    @default("queued") // "queued"|"processing"|"ready"|"failed"
  layer            String?   // "top"|"bottom"|"solo"|"combined"
  createdAt        DateTime  @default(now())

  user             User      @relation(fields: [userId], references: [id])
  product          Product?  @relation(fields: [productId], references: [id])
  outfitPairing    OutfitPairing? @relation(fields: [outfitPairingId], references: [id])
}
```

### Product — add outfit relations
```prisma
model Product {
  // ... all existing fields ...
  outfitTops      OutfitPairing[] @relation("OutfitTop")
  outfitBottoms   OutfitPairing[] @relation("OutfitBottom")
}
```

---

## Product Catalog Requirements (84+ products)

### Distribution
| Category | Women (W) | Men (M) | Unisex (U) | Total |
|----------|-----------|---------|------------|-------|
| Tops     | 18        | 16      | 10         | 44    |
| Bottoms  | 12        | 10      | 6          | 28    |
| Dresses  | 12        | 0       | 0          | 12    |
| **Total**| **42**    | **26**  | **16**     | **84**|

### Outfit Pairings to Seed
| Gender | Pairs | Source |
|--------|-------|--------|
| Women (W) | ~14 | Women's top + Women's bottom |
| Men (M) | ~12 | Men's top + Men's bottom |
| Unisex (U) | ~6 | Unisex top + Unisex bottom |
| **Total pairs** | **~32** | |
| Women's dresses (solo) | 12 | No pairing needed |
| **Total outfit cards** | **~44** | |

### Per-User Feed Size (after gender filter)
- **Female user**: 14 women's pairs + 6 unisex pairs + 12 dresses = 32 available (cap at 20)
- **Male user**: 12 men's pairs + 6 unisex pairs = 18 available (cap at 15)

### Product Data Requirements (EVERY product must have)
- **Real product page URL**: Amazon (https://www.amazon.com/dp/{ASIN}) or SHEIN search URL
- **Real garment image URL**: Amazon CDN or SHEIN CDN — must show actual garment
- **Correct fashnCategory**: "tops", "bottoms", or "one-pieces" — must match garment type
- **Gender tag**: "M", "W", or "U"
- **Price**: $10-50 USD range
- **Available sizes**: Real size arrays per product
- **Style tags**: At least 2 from: casual, streetwear, formal, bohemian, sporty, minimalist
- **affiliateUrl**: null (intentional — deferred to v1.1)

### Image Requirements for FASHN AI
- Minimum resolution: 576×864px
- Clear frontal view of garment
- Clean/white/neutral background preferred
- On-model photos work best, flat-lay acceptable
- Single garment per image (not multiple items)
- No heavy watermarks or text overlays

---

## Try-On Pipeline

### Pre-Generation Flow (triggered after onboarding)
```
1. User completes onboarding → gender + preferences saved
2. Backend selects outfits for this user:
   - Query OutfitPairings matching gender (user.gender + "U")
   - Filter by style preference overlap
   - Cap at 20 (female) or 15 (male)
   - Also select dresses if female (up to 6)
3. Queue BullMQ jobs for each outfit:
   - For pairs: generate-tryon-outfit { userId, outfitPairingId }
   - For dresses: generate-tryon-solo { userId, productId }
4. Each job runs FASHN API calls:
   - Pairs: call 1 (top on user body) → call 2 (bottom on call 1 result) → upload to S3
   - Dresses: call 1 (dress on user body) → upload to S3
5. Save TryOnResult with status="ready" and resultImageUrl
```

### FeedService Abstraction (for future Option C migration)
```typescript
class FeedService {
  // MVP: returns personalized try-on URL
  // v1.2: change to return shared model try-on URL
  async getTryOnImageForFeed(userId: string, outfitPairingId: string): Promise<string> {
    // MVP implementation:
    const result = await prisma.tryOnResult.findFirst({
      where: { userId, outfitPairingId, status: "ready", layer: "combined" }
    });
    return result?.resultImageUrl ?? null;

    // FUTURE v1.2 implementation (commented out):
    // const shared = await prisma.sharedTryOn.findFirst({
    //   where: { outfitPairingId, modelId: user.selectedModelId }
    // });
    // return shared?.resultImageUrl ?? null;
  }
}
```

---

## Feed API

### GET /api/feed?cursor=X
```
1. Get user gender from UserProfile
2. Get user style preferences from StylePreference
3. Query OutfitPairings WHERE (gender = user.gender OR gender = "U")
4. Filter by style tag overlap with user preferences
5. Exclude outfits where user has already swiped both products
6. Cap results at batch of 10
7. For each outfit, call getTryOnImageForFeed() for the try-on URL
8. Also query solo dresses (if female) with same filters
9. Mix outfit cards and dress cards, shuffle
10. Return cards with: outfitPairingId, tryOnImageUrl, topProduct, bottomProduct, totalPrice
```

---

## Swipe Behavior

### Swipe RIGHT on outfit pair:
```
outfitGroupId = generateUUID()
POST /api/swipe { productId: top.id, action: "like", outfitGroupId }
POST /api/swipe { productId: bottom.id, action: "like", outfitGroupId }
```

### Swipe RIGHT on dress:
```
POST /api/swipe { productId: dress.id, action: "like", outfitGroupId: null }
```

### Swipe LEFT (dislike):
Same pattern but action: "dislike"

---

## Favorites (GET /api/favorites)
- Query SwipeActions WHERE action = "like" for this user
- Join with Products for full details
- Return as FLAT LIST of individual products (not grouped by outfit)
- Each product shows: name, price, individual try-on thumbnail, "Buy Now" link to productPageUrl

---

## Onboarding Update
Step 1 of the measurement screen adds gender selection at the top:
- "I'm shopping for:" → "Women's Fashion" / "Men's Fashion"
- Sets UserProfile.gender = "W" or "M"
- Drives all downstream feed filtering

---

## Card UI

### Outfit Card (pair):
```
┌──────────────────────────┐
│                          │
│  [Combined try-on image: │
│   user wearing top +     │
│   bottom together]       │
│                          │
│  ┌────────────────────┐  │
│  │ White Linen Blouse │  │
│  │ $24.90             │  │
│  │ ──────────────     │  │
│  │ Wide Leg Trousers  │  │
│  │ $27.50             │  │
│  │ Total: $52.40      │  │
│  └────────────────────┘  │
│                          │
│   (✗)    (↺)    (♥)     │
└──────────────────────────┘
```

### Dress Card (solo):
```
┌──────────────────────────┐
│                          │
│  [Try-on image: user     │
│   wearing dress]         │
│                          │
│  ┌────────────────────┐  │
│  │ Floral Midi Dress  │  │
│  │ $18.99             │  │
│  └────────────────────┘  │
│                          │
│   (✗)    (↺)    (♥)     │
└──────────────────────────┘
```

---

## MVP Scope Guard Reminders
- ❌ No affiliate links (deferred to v1.1, field is nullable by design)
- ❌ No cart (favorites + "Buy Now" link only)
- ❌ No social login (email/password only)
- ❌ No ML recommendations (style filter + random shuffle)
- ❌ No push notifications
- ❌ Tabs are: explore / favorites / profile (NO cart tab)
- ✅ Gender filtering on feed
- ✅ Outfit pairing (top+bottom)
- ✅ Pre-generation cap: 20 female / 15 male
- ✅ FeedService abstraction for future Option C migration
- ✅ Click tracking on "Buy Now" (POST /api/analytics/click) from day 1
