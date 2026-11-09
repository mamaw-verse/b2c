# Seller Registration & Shop Onboarding Spec

## Background

Barakah Market currently has full seller functionality (dashboard, products, orders, settings, shipments) but no way for a buyer to become a seller. The `isSeller()` method on `User` checks `role === 'seller' || shop()->exists()`, but nothing in the application creates a `Shop` record for a user through any user-facing flow. This spec covers the seller registration / shop application flow, admin moderation integration, and the homepage "Sell to Barakah Market" link.

## Research: PH Marketplace Seller Onboarding (Shopee, Lazada)

Both Shopee PH and Lazada require:

- **Buyer account first** — email/phone verified before seller onboarding
- **Shop information** — shop name, product category, description
- **Pickup/return address** — city or full address
- **Identity verification** — government-issued ID (PhilSys, driver's license, passport, national ID), selfie
- **Business documents** — DTI business name registration / mayor's permit (optional for individual sellers, required for verified business shops)
- **Bank/payout account** — bank name, account name, account number for settlement
- **Admin review** — application goes to pending review, admin approves/rejects with reasons, re-application allowed after rejection

Barakah Market-specific additions: halal-only declaration (shop commits to selling only halal products), optional halal certificate at the shop level (product-level certificates already exist).

## Flow

```
Buyer (verified, no shop)
  → Visits "Sell to Barakah Market" link on homepage
  → Fills shop application form (shop info, ID, payout)
  → Shop created with status=pending
  → ModerationQueueItem created targeting the shop
  → Admin reviews in moderation queue
  → Approved → shop.status=approved, user.isSeller() returns true
  → Rejected → shop.status=rejected, user sees rejection reason, can reapply
```

## Constraints

- One shop per user (unique index on `shops.user_id`)
- User must be authenticated and email-verified (middleware)
- User must not already have a shop (form request authorize)
- Existing shops backfilled to `approved` status in migration
- Admin moderation uses the existing `ModerationQueueItem` / `ModerationEvent` system

---

## 1. Enums

### 1.1 New enum: `ShopStatus`

File: `app/Enums/ShopStatus.php`

```php
enum ShopStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending review',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
        };
    }
}
```

### 1.2 Update `ModerationItemType`

File: `app/Enums/ModerationItemType.php`

Add case:

```php
case ShopApplication = 'shop_application';
```

Add label:

```php
self::ShopApplication => 'Shop application',
```

### 1.3 Update `ModerationReason`

File: `app/Enums/ModerationReason.php`

Add cases:

```php
case InvalidIdDocument = 'invalid_id_document';
case IncompleteShopInfo = 'incomplete_shop_info';
case BusinessPermitRequired = 'business_permit_required';
case ProhibitedBusinessType = 'prohibited_business_type';
```

Add labels:

```php
self::InvalidIdDocument => 'Invalid or unreadable ID document',
self::IncompleteShopInfo => 'Incomplete shop information',
self::BusinessPermitRequired => 'Business permit required for this shop type',
self::ProhibitedBusinessType => 'Prohibited business type',
```

---

## 2. Database Migration

File: `database/migrations/2026_11_07_XXXXXX_add_seller_registration_fields_to_shops_table.php`

```php
public function up(): void
{
    Schema::table('shops', function (Blueprint $table) {
        $table->string('status')->default('approved')->after('suspended');
        $table->text('rejection_reason')->nullable()->after('status');
        $table->timestamp('submitted_at')->nullable()->after('rejection_reason');
        $table->timestamp('reviewed_at')->nullable()->after('submitted_at');
        $table->foreignUlid('reviewed_by')->nullable()
            ->index()->constrained('users')->nullOnDelete();
        $table->string('contact_number')->nullable()->after('reviewed_by');
        $table->string('id_type')->nullable()->after('contact_number');
        $table->string('id_number')->nullable()->after('id_type');
        $table->string('id_document_url')->nullable()->after('id_number');
        $table->string('selfie_url')->nullable()->after('id_document_url');
        $table->string('business_permit_url')->nullable()->after('selfie_url');
        $table->string('bank_account_name')->nullable()->after('business_permit_url');
        $table->string('bank_account_number')->nullable()->after('bank_account_name');
        $table->string('bank_name')->nullable()->after('bank_account_number');
        $table->boolean('agreed_to_terms')->default(false)->after('bank_name');
    });

    // Backfill existing shops to approved
    DB::table('shops')->whereNull('status')->orWhere('status', '')->update(['status' => 'approved']);

    // One shop per user
    DB::statement('CREATE UNIQUE INDEX shops_user_id_unique ON shops (user_id) WHERE user_id IS NOT NULL');
}
```

No `down()` method (project convention: migrations only go up).

### Add to `#[Fillable]` on Shop model

```php
#[Fillable([
    // existing fields...
    'status', 'rejection_reason', 'submitted_at', 'reviewed_at', 'reviewed_by',
    'contact_number', 'id_type', 'id_number', 'id_document_url', 'selfie_url',
    'business_permit_url', 'bank_account_name', 'bank_account_number',
    'bank_name', 'agreed_to_terms',
])]
```

---

## 3. Model Updates

### 3.1 Shop model

File: `app/Models/Shop.php`

- Add `status` cast to `ShopStatus` enum
- Add `reviewed_at`, `submitted_at` datetime casts
- Add `agreed_to_terms` boolean cast
- Add `reviewedBy` BelongsTo relation:

```php
/** @return BelongsTo<User, $this> */
public function reviewedBy(): BelongsTo
{
    return $this->belongsTo(User::class, 'reviewed_by');
}

public function isApproved(): bool
{
    return $this->status === ShopStatus::Approved;
}

public function isPending(): bool
{
    return $this->status === ShopStatus::Pending;
}
```

### 3.2 User model

File: `app/Models/User.php`

Update `isSeller()` to check shop is approved:

```php
public function isSeller(): bool
{
    return $this->role === 'seller'
        || ($this->shop()->exists() && $this->shop?->isApproved());
}
```

Existing shops are backfilled to `approved` in the migration, so this won't break current sellers.

---

## 4. Routes

File: `routes/web.php`

Add inside the `['auth', 'verified']` middleware group, before the existing `seller` prefix group:

```php
Route::get('seller/register', [App\Http\Controllers\Seller\ShopRegistrationController::class, 'create'])->name('seller.register');
Route::post('seller/register', [App\Http\Controllers\Seller\ShopRegistrationController::class, 'store'])->name('seller.register.store');
```

---

## 5. Form Request

File: `app/Http/Requests/Seller/CreateShopRegistrationRequest.php`

### `authorize()`

```php
public function authorize(): Response
{
    $user = $this->user();
    assert($user instanceof User);

    // Hide the route from users who already have a shop
    return !$user->shop()->exists() ? Response::allow() : Response::denyAsNotFound();
}
```

### `rules()`

Based on Shopee/Lazada PH requirements:

```php
public function rules(): array
{
    return [
        'shop_name'           => ['required', 'string', 'max:120', 'unique:shops,name'],
        'description'         => ['required', 'string', 'max:1000'],
        'location'            => ['required', 'string', 'max:255'],
        'contact_number'      => ['required', 'string', 'max:20'],
        'halal_only'          => ['boolean'],
        'id_type'             => ['required', 'string', 'in:philsys,drivers_license,passport,national_id'],
        'id_number'           => ['required', 'string', 'max:50'],
        'id_document_url'     => ['required', 'string', 'max:255'],
        'selfie_url'          => ['required', 'string', 'max:255'],
        'business_permit_url' => ['nullable', 'string', 'max:255'],
        'bank_account_name'   => ['required', 'string', 'max:120'],
        'bank_account_number' => ['required', 'string', 'max:50'],
        'bank_name'           => ['required', 'string', 'max:120'],
        'agreed_to_terms'     => ['accepted'],
    ];
}
```

### Input interpretation methods

```php
/** @return array<string, mixed> */
public function applicationData(): array
{
    return $this->only([
        'shop_name', 'description', 'location', 'contact_number', 'halal_only',
        'id_type', 'id_number', 'id_document_url', 'selfie_url',
        'business_permit_url', 'bank_account_name', 'bank_account_number',
        'bank_name',
    ]);
}
```

---

## 6. Action

File: `app/Actions/Seller/SubmitShopApplication.php`

```php
final readonly class SubmitShopApplication
{
    public function handle(User $user, array $data): Shop
    {
        return DB::transaction(function () use ($user, $data) {
            $shop = Shop::create([
                'user_id' => $user->id,
                'name' => $data['shop_name'],
                'slug' => Str::slug($data['shop_name']),
                'location' => $data['location'],
                'description' => $data['description'],
                'halal_only' => $data['halal_only'] ?? false,
                'status' => ShopStatus::Pending->value,
                'contact_number' => $data['contact_number'],
                'id_type' => $data['id_type'],
                'id_number' => $data['id_number'],
                'id_document_url' => $data['id_document_url'],
                'selfie_url' => $data['selfie_url'],
                'business_permit_url' => $data['business_permit_url'] ?? null,
                'bank_account_name' => $data['bank_account_name'],
                'bank_account_number' => $data['bank_account_number'],
                'bank_name' => $data['bank_name'],
                'agreed_to_terms' => true,
                'submitted_at' => now(),
            ]);

            ModerationQueueItem::create([
                'target_type' => Shop::class,
                'target_id' => $shop->id,
                'type' => ModerationItemType::ShopApplication->value,
                'state' => ModerationState::Pending->value,
                'flagged_by_type' => User::class,
                'flagged_by_id' => $user->id,
            ]);

            return $shop;
        });
    }
}
```

---

## 7. Controller

File: `app/Http/Controllers/Seller/ShopRegistrationController.php`

```php
final class ShopRegistrationController
{
    public function create(CreateShopRegistrationRequest $request): Response
    {
        return Inertia::render('seller/register');
    }

    public function store(
        CreateShopRegistrationRequest $request,
        SubmitShopApplication $action,
    ): RedirectResponse {
        $action->handle($request->user(), $request->applicationData());

        return redirect()->route('seller.register')
            ->with('status', 'application_submitted');
    }
}
```

---

## 8. Moderation Integration

### 8.1 ShowModerationItem — shop application preview

File: `app/Actions/Moderation/ShowModerationItem.php`

Add to `preview()` match:

```php
$target instanceof Shop && $item->type === ModerationItemType::ShopApplication->value
    => $this->shopApplicationPreview($item, $target),
```

Add method:

```php
/**
 * @return array{kind: string, snapshot: array<string, mixed>}
 */
private function shopApplicationPreview(ModerationQueueItem $item, Shop $shop): array
{
    return [
        'kind' => 'shop_application',
        'snapshot' => [
            'shop_name' => $shop->name,
            'description' => $shop->description,
            'location' => $shop->location,
            'contact_number' => $shop->contact_number,
            'halal_only' => $shop->halal_only,
            'id_type' => $shop->id_type,
            'id_number' => $shop->id_number,
            'id_document_url' => $shop->id_document_url,
            'selfie_url' => $shop->selfie_url,
            'business_permit_url' => $shop->business_permit_url,
            'bank_name' => $shop->bank_name,
            'bank_account_name' => $shop->bank_account_name,
            'applicant_name' => $shop->owner?->name,
            'applicant_email' => $shop->owner?->email,
            'submitted_at' => $shop->submitted_at?->toISOString(),
            'flag_notice' => $this->reasonLabel($item),
        ],
    ];
}
```

Also update the `morphWith` call to eager-load `owner` for `Shop::class` (already done in existing code).

### 8.2 ResolvesQueueItem — side effects

File: `app/Actions/Moderation/Concerns/ResolvesQueueItem.php`

Add to `applySideEffect()` match:

```php
$action === 'approved' && $target instanceof Shop
    && $target->status === ShopStatus::Pending->value
    => $target->update([
        'status' => ShopStatus::Approved->value,
        'reviewed_at' => now(),
    ]),
$action === 'rejected' && $target instanceof Shop
    && $target->status === ShopStatus::Pending->value
    => $target->update([
        'status' => ShopStatus::Rejected->value,
        'rejection_reason' => $reason,
        'reviewed_at' => now(),
    ]),
```

---

## 9. Frontend

### 9.1 Homepage link

File: `app/Http/Controllers/HomeController.php`

Add `canBecomeSeller` prop:

```php
'canBecomeSeller' => $request->user() && !$request->user()->shop()->exists(),
```

File: `resources/js/pages/home.tsx`

Add to props type:

```typescript
canBecomeSeller?: boolean;
```

Add a link in the hero section, alongside "Shop the fair":

```tsx
{
    canBecomeSeller && (
        <Button size="lg" variant="outline" href="/seller/register">
            Sell to {name}
        </Button>
    );
}
```

The `name` prop (app name) is already available via Inertia shared props.

For guests: show the link pointing to registration (buyer signup). Add a separate check:

```typescript
{!auth && (
    <Button size="lg" variant="outline" href="/register">
        Sell to {name}
    </Button>
)}
```

The `auth` prop is available via Inertia shared props (check existing shared data).

### 9.2 Seller registration page

File: `resources/js/pages/seller/register.tsx`

A form page using `AppLayout` (not `SellerLayout` — the user isn't a seller yet). Sections:

1. **Shop Information** — shop name, description, location (text input for city), halal-only toggle (switch)
2. **Contact Details** — contact number (phone input)
3. **Identity Verification** — ID type (select), ID number (text field), ID document (image uploader), selfie (image uploader)
4. **Business Documents** (optional) — business permit (image uploader)
5. **Payout Account** — bank name, account name, account number (text fields)
6. **Terms Agreement** — checkbox

Use existing components: `Form` from Inertia, `Button`, `Switch`, `TextField`, `TextArea`, `Select`, `Checkbox`, `ImageUploader`.

On submit success: show a confirmation state "Your application is under review. We'll notify you within 3 business days."

If the user already has a pending/rejected shop, show the current status instead of the form (but the `authorize()` in the form request hides the route for existing shops — for pending shops, redirect to a status page or show inline).

### 9.3 Admin moderation — shop application preview

File: `resources/js/pages/admin/moderation/show.tsx`

Handle `preview.kind === 'shop_application'` — render a `ShopApplicationPreview` component showing:

- Shop name, description, location, halal-only badge
- Applicant name and email
- ID type and number, ID document image, selfie image
- Business permit image (if provided)
- Bank details
- Submitted date

The existing `ContentPreview` component handles `kind: 'product' | 'review' | 'chat'`. Add `shop_application` as a new kind. The approve/reject buttons already work via `handleDecision`.

File: `resources/js/components/content-preview.tsx` — add a case for `shop_application`.

### 9.4 Admin moderation queue — type tab

File: `resources/js/pages/admin/moderation/index.tsx`

Add to `typeCounts` array:

```typescript
{ value: 'shop_application', label: 'Shop applications', count: counts.shop_application ?? 0 },
```

---

## 10. Factory Update

File: `database/factories/ShopFactory.php`

Add new fields to `definition()`:

```php
'status' => ShopStatus::Approved->value,
'contact_number' => fake()->numerify('09#########'),
'id_type' => fake()->randomElement(['philsys', 'drivers_license', 'passport', 'national_id']),
'id_number' => fake()->bothify('??#######'),
'bank_name' => fake()->randomElement(['BDO', 'BPI', 'Metrobank', 'GCash', 'Maya']),
'bank_account_name' => fake()->name(),
'bank_account_number' => fake()->numerify('####-####-####'),
'agreed_to_terms' => true,
```

Add a `pending()` state:

```php
public function pending(): static
{
    return $this->state(fn (array $attributes) => [
        'status' => ShopStatus::Pending->value,
        'submitted_at' => now(),
    ]);
}
```

---

## 11. Tests

### Feature tests (`tests/Feature/`)

1. **GuestCannotAccessSellerRegistrationTest** — GET `seller/register` redirects to login
2. **VerifiedBuyerCanAccessSellerRegistrationTest** — GET `seller/register` returns 200 with Inertia page
3. **BuyerWithExistingShopGetsNotFoundTest** — user with approved shop, GET `seller/register` returns 404
4. **SubmitShopApplicationTest** — POST `seller/register` with valid data creates Shop (pending) + ModerationQueueItem
5. **SubmitDuplicateApplicationTest** — user with pending shop, POST `seller/register` returns 404
6. **AdminSeesShopApplicationInQueueTest** — admin GET `admin/moderation?type=shop_application` sees the application
7. **AdminApprovesShopApplicationTest** — admin POST decision `approved` → shop status becomes `approved`, user `isSeller()` returns true
8. **AdminRejectsShopApplicationTest** — admin POST decision `rejected` → shop status becomes `rejected`, rejection_reason set, user `isSeller()` returns false
9. **RejectedSellerCanReapplyTest** — after rejection, user can submit a new application (old shop deleted or updated — depends on reapply strategy)

### Unit tests (`tests/Unit/`)

10. **IsSellerTest** — `isSeller()` returns false for pending shop, true for approved shop, false for rejected shop, true for role=seller

---

## 12. File Summary

### New files

```
app/Enums/ShopStatus.php
app/Actions/Seller/SubmitShopApplication.php
app/Http/Controllers/Seller/ShopRegistrationController.php
app/Http/Requests/Seller/CreateShopRegistrationRequest.php
resources/js/pages/seller/register.tsx
resources/js/components/shop-application-preview.tsx
database/migrations/2026_11_07_XXXXXX_add_seller_registration_fields_to_shops_table.php
```

### Modified files

```
app/Enums/ModerationItemType.php
app/Enums/ModerationReason.php
app/Models/Shop.php
app/Models/User.php
app/Actions/Moderation/ShowModerationItem.php
app/Actions/Moderation/Concerns/ResolvesQueueItem.php
app/Http/Controllers/HomeController.php
routes/web.php
resources/js/pages/home.tsx
resources/js/pages/admin/moderation/index.tsx
resources/js/pages/admin/moderation/show.tsx
resources/js/components/content-preview.tsx
database/factories/ShopFactory.php
```

---

## 13. Implementation Order

1. Enums (`ShopStatus`, update `ModerationItemType`, `ModerationReason`)
2. Migration (shops table columns + unique index)
3. Model updates (`Shop`, `User`)
4. Form request (`CreateShopRegistrationRequest`)
5. Action (`SubmitShopApplication`)
6. Controller (`ShopRegistrationController`)
7. Routes
8. Moderation integration (`ShowModerationItem`, `ResolvesQueueItem`)
9. Frontend: seller registration form page
10. Frontend: homepage link
11. Frontend: admin moderation shop application preview
12. Factory updates
13. Tests
14. Pint formatting (`vendor/bin/sail bin pint --dirty --format agent`)
15. Wayfinder regenerate (`vendor/bin/sail artisan wayfinder:generate`)

---

## 14. Open Questions

1. **Reapply strategy** — when a rejected user reapplies, do we delete the old shop and create a new one, or update the existing shop? Updating is simpler and preserves history; deleting loses the audit trail. Recommendation: update existing shop with new data and reset status to pending.

2. **File uploads** — how are `id_document_url`, `selfie_url`, `business_permit_url` uploaded? Check for existing upload endpoint or temporary upload pattern in the codebase. If none exists, a simple file upload endpoint is needed.

3. **Homepage link for guests** — should guests see "Sell to Barakah Market" linking to buyer registration? Or should the link only show for authenticated users? Recommendation: show for everyone, guests get redirected to login.

4. **Notification on approval/rejection** — should the user get a notification when their application is approved or rejected? The existing notification system (`NotificationController`) could be used. This can be a follow-up.
