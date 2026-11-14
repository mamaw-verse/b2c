# Task Implementation Plan

### Module: Catalogue & Products

#### Task 1.1: Product images aren't saved or shown

- **Source Reference:** #6
- **Target Files:**
    - `resources/js/pages/seller/products/form.tsx`
    - `resources/js/components/image-uploader.tsx`
    - `app/Http/Requests/Seller/CreateSellerProductRequest.php`
    - `app/Http/Requests/Seller/UpdateSellerProductRequest.php`
    - `app/Actions/Seller/CreateSellerProduct.php`
    - `app/Actions/Seller/UpdateSellerProduct.php`
    - `app/Http/Controllers/Seller/ProductController.php`
    - `app/Actions/Seller/ListSellerProducts.php`
    - `resources/js/pages/seller/products/index.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - `form.tsx` keeps picked photos in `useState<File[]>`, but nothing ever submits them. There is no `images[]` input and no `transform`.
        - `CreateSellerProduct` therefore always falls into the `else` branch and creates an empty placeholder row with `url => ''`.
        - Even with files, the rule is just `'images' => ['nullable','array']`, and the action stores `(string) $img`, not a file.
        - `edit()` returns images as `{name, icon}` only, with no URL. The seller index only receives `icon`.
    - **Exact Code Changes:**
        1. `form.tsx`: add `transform` and `forceFormData` to the Inertia `<Form>`. Also track the existing images.
            ```tsx
            <Form transform={(data) => ({
                ...data,
                images: imageFiles,
                keep_image_ids: keptImageIds,
                option1_name: hasVariations ? option1Name : null,   // see Task 1.2
                option2_name: hasVariations ? option2Name : null,
            })} forceFormData ...>
            ```
        2. `ImageUploader`: add optional props `existing?: {id:string;url:string}[]` and `onRemoveExisting?: (id:string)=>void`. Render those thumbnails before the new `files`, and count both against `max`.
        3. Both request classes:
            ```php
            'images' => ['nullable','array','max:9'],
            'images.*' => ['file','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'keep_image_ids' => ['nullable','array'],
            'keep_image_ids.*' => ['string'],
            ```
        4. Create action: replace the images block.
            ```php
            $files = $data['images'] ?? [];
            foreach (array_values($files) as $i => $file) {
                $product->images()->create([
                    'url' => Storage::disk('public')->url($file->store('product-images','public')),
                    'icon' => 'package', 'sort_order' => $i,
                ]);
            }
            if ($files === []) { /* keep the existing placeholder row */ }
            ```
        5. Update action: delete images whose id is not in `keep_image_ids`, but only if the key was submitted. Append the new files with `sort_order` after the kept ones. Delete the stored files for removed rows.
        6. `ProductController::edit`: map images to `['id'=>$img->id,'url'=>$img->url,'icon'=>$img->icon]`.
        7. `ListSellerProducts`: add `'image_url' => $p->images->firstWhere('url','!=','')?->url`. In `index.tsx`, render `<Media src={p.image_url} icon={p.icon}>` instead of the icon only.
        8. Verify `public/storage` exists with `php artisan storage:link`.
        9. Verify the PDP gallery (`product.tsx` ~L139, `slides={p.images.map(...)}`) passes `img.url` as the image `src`. Fix it if it only uses `icon`.
- **Verification:** Create a product with 2 photos. Confirm 2 `product_images` rows have URLs. Confirm the photos show on the seller list, edit page, PDP, listing cards and cart. On edit, remove one and add one, then save and recheck. Add a Pest test with `Storage::fake('public')` and `UploadedFile::fake()->image()`.

#### Task 1.2: Variations can't be selected on the product page

- **Source Reference:** #5
- **Target Files:**
    - `resources/js/pages/seller/products/form.tsx`
    - `resources/js/pages/product.tsx`
    - `resources/js/components/variation-picker.tsx`
    - `app/Models/Product.php`
    - new migration `database/migrations/xxxx_backfill_product_option_names.php`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - In `form.tsx`, the "Option 1 name" and "Option 2 name" `<Input>`s have no `name` attribute, so `option1_name` and `option2_name` are never posted. Products with variations are saved with `option1_name = null`.
        - `product.tsx` `buyAction()` only opens the picker when `p.option1_name` is set, so it skips the picker and adds with `variationId = null`.
        - The picker also hides all option chips via `hasOptions = product.option1_name != null`.
        - The Variation row on the PDP always shows `p.variations[0]` and never reflects a choice.
    - **Exact Code Changes:**
        1. Task 1.1's `transform` already posts the names. Also add `name="option1_name"` and `name="option2_name"` on the two inputs.
        2. Backfill migration:
            ```php
            DB::table('products')->whereNull('option1_name')
              ->whereExists(fn($q)=>$q->select(DB::raw(1))->from('product_variations')->whereColumn('product_variations.product_id','products.id'))
              ->update(['option1_name'=>'Option']);
            ```
            Set `option2_name = 'Option 2'` where any variation has a non-null `option2_value`.
        3. `product.tsx`: gate on variations, not names.
            ```tsx
            const hasVariations = p.variations.length > 0;
            const buyAction = (buyNow: boolean) =>
                hasVariations
                    ? setPickerOpen(true)
                    : addToCart(null, qty, buyNow);
            ```
            Keep `selectedVariation` in page state, default to the first in-stock variation. The picker's `onConfirm` sets it. The "Variation:" row, price, stock and quantity max all read from it.
        4. `variation-picker.tsx`:
            - Set `hasOptions = product.variations.length > 0`.
            - Fall back to labels "Option" and "Option 2".
            - Initialise `option1` to the first in-stock value.
            - When option 1 changes, pick the first in-stock option 2.
            - Disable the add and buy buttons when the selected combination is out of stock.
- **Verification:** Create a product with Size x Colour variations. Open the PDP. Pick a different variation and confirm the label and price update, and the cart line carries the chosen `product_variation_id`. Open an old product and confirm the migration made the chips appear.

#### Task 1.3: Sale price on products and variations

- **Source Reference:** #9
- **Target Files:**
    - new migration `add_was_price_to_product_variations_table.php`
    - `app/Models/ProductVariation.php`
    - `app/Http/Requests/Seller/CreateSellerProductRequest.php`
    - `app/Http/Requests/Seller/UpdateSellerProductRequest.php`
    - `app/Actions/Seller/CreateSellerProduct.php`
    - `app/Actions/Seller/UpdateSellerProduct.php`
    - `app/Http/Controllers/Seller/ProductController.php`
    - `resources/js/pages/seller/products/form.tsx`
    - `resources/js/components/variant-matrix.tsx`
    - `app/Models/Product.php`
    - `app/Http/Controllers/CartController.php`
    - `resources/js/components/variation-picker.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `products.was_price` already exists but has no form field, and `CreateSellerProductRequest` has `was_price gt:price`. Variations have no was-price at all. Checkout and cart use `price` as the amount charged.
    - **Exact Code Changes:** Keep the storage semantics (`price` = what the buyer pays, `was_price` = struck-through original). Only the form changes.
        1. Migration: `$table->unsignedInteger('was_price')->nullable()->after('price')`. Add `was_price` to the `#[Fillable]` attributes.
        2. Form labels: "Regular price" and "Sale price (optional)" for both the single-price form and each `VariantMatrix` row. On submit, if `sale_price` is set, post `price = sale_price` and `was_price = regular`. Otherwise post `price = regular` and `was_price = null`. On edit, reverse the mapping: when `was_price` is set, regular = `was_price` and sale = `price`.
        3. Rules: `'sale_price' => ['nullable','numeric','min:1','lt:price']`, and the same `lt:variations.*.price` per row. Drop `was_price gt:price`.
        4. Actions: store `variations.*.was_price` (pesos x 100). For products with variations, set product `price` and `was_price` from the cheapest variation (not the first).
        5. `Product::toDetail` variations: add `'was_price'`. `CartController`: `'was_price' => $variation->was_price ?? $product->was_price`. The picker's `PriceBlock` uses `selected?.was_price ?? product.was_price`.
- **Verification:** Set regular 100 and sale 80. Confirm the PDP, card, cart and picker show 80 with 100 struck through, and checkout charges 80. Test the same on a variation row. Test that sale >= regular fails validation.

---

### Module: Cart

#### Task 2.1: Change variation from the cart

- **Source Reference:** #7
- **Target Files:**
    - `resources/js/components/cart-shop-group.tsx`
    - `resources/js/pages/cart.tsx`
    - `resources/js/components/variation-picker.tsx`
    - `app/Http/Controllers/CartController.php`
    - `app/Http/Requests/UpdateCartItemRequest.php`
    - new `app/Actions/Cart/UpdateCartItemVariation.php`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `CartItem` supports an `onVariation` callback and renders the chip button. `CartShopGroup` never passes it, and `cart.tsx` has no handler. The backend `update` only accepts `qty`.
    - **Exact Code Changes:**
        1. `CartController::index` item payload: add `option1_name`, `option2_name` and `variations: [{id, option1_value, option2_value, price, was_price, stock}]` (load `product.variations`). Change the label to `trim(option1.' · '.option2)`.
        2. `UpdateCartItemRequest` rules:
            ```php
            'qty' => ['required_without:product_variation_id','integer','min:1','max:99'],
            'product_variation_id' => ['sometimes','string',
                Rule::exists('product_variations','id')->where('product_id', $this->route('cart')->product_id)],
            ```
        3. `UpdateCartItemVariation::handle(User $user, CartItem $item, ProductVariation $new)`:
            - Throw a `ValidationException` if `$new->stock < 1`.
            - In a transaction, find another cart row for the same user, product and variation.
            - If one exists, add `qty` to it (clamped to stock) and delete the current row. Otherwise update `product_variation_id` and clamp `qty` to `$new->stock`.
        4. `CartController::update`: when `product_variation_id` is present, call the new action, otherwise `UpdateCartItemQty`.
        5. Front end:
            - Thread `onVariationItem(itemId)` through `CartShopGroup` to `<CartItem onVariation>`.
            - In `cart.tsx`, hold `editingItem` in state and render `<VariationPicker mode="edit" initial={{option1,option2}} confirmLabel="Update" ...>`.
            - On confirm: `router.put('/cart/'+id, {product_variation_id}, {preserveScroll:true})`.
            - Add `mode`, `initial` and `confirmLabel` props to the picker. In edit mode, show a single confirm button and no quantity or Buy now.
- **Verification:** Add a variation to the cart, tap the chip, switch to another variation, and confirm the line updates and totals recompute. Switch to a variation already in the cart and confirm the lines merge. Confirm sold-out variations are disabled. Add a Pest test in `tests/Feature/Cart`.

---

### Module: Seller Onboarding & Moderation

#### Task 3.1: Prominent "changes requested" banner

- **Source Reference:** #3
- **Target Files:**
    - `resources/js/components/ui/alert.tsx`
    - `resources/js/pages/seller/register.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** The notice is a standard low-emphasis `Banner tone="warning"`, the same weight as other helper text.
    - **Exact Code Changes:**
        1. Add `prominent?: boolean` to `Banner` in `alert.tsx`. When set: solid warning-soft background, `border-l-4`, larger heading (`text-h3`), larger icon, and `role="alert"`.
        2. In `register.tsx`, use `<Banner tone="warning" prominent live ...>` for `changes_requested` and `tone="danger" prominent` for `rejected`. Render `rejection_reason` as a distinct quoted block labelled "Admin's note".
        3. Add a ref and `useEffect(() => ref.current?.scrollIntoView({block:'center'}), [])` so it is visible on load.
- **Verification:** As an admin, request changes. As the seller, open `/seller/register` and confirm the banner is clearly the most prominent element at 375px and desktop, in light and dark themes.

#### Task 3.2: Onboarding fields reset on change request or rejection

- **Source Reference:** #4
- **Target Files:**
    - `app/Http/Controllers/Seller/ShopRegistrationController.php`
    - `app/Http/Requests/Seller/CreateShopRegistrationRequest.php`
    - `app/Actions/Seller/SubmitShopApplication.php`
    - new migration `add_psgc_codes_and_halal_only_to_shops` (if the shop doesn't already store the codes)
    - `resources/js/components/file-field.tsx`
    - `resources/js/pages/seller/register.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - The `application` payload returned by `create()` omits `logo_url`, `business_permit_url`, certificate `document_url`s, `halal_only` and the PSGC codes.
        - `register.tsx` initialises `logo`, `businessPermit`, the four PSGC code states and `halalOnly` to empty.
        - The request makes `business_permit` and every `certificates.*.document` `required`.
        - `SubmitShopApplication` also deletes all `halalCertifications()` on resubmit, so the seller must re-upload everything.
    - **Exact Code Changes:**
        1. Migration: nullable `region_code`, `province_code`, `city_code`, `barangay_code` on `shops`. Save them from the form in `applicationData()`.
        2. `ShopRegistrationController::create`: add `logo_url`, `business_permit_url`, `halal_only`, the four codes, and each certificate's `id` and `document_url`.
        3. Request rules:
            ```php
            $hasPermit = filled($this->user()->shop?->business_permit_url);
            'business_permit' => [$hasPermit ? 'nullable' : 'required','file','mimes:jpg,jpeg,png,pdf','max:5120'],
            'certificates.*.id' => ['nullable','string'],
            'certificates.*.document' => ['nullable','required_without:certificates.*.id','file','mimes:jpg,jpeg,png,pdf','max:5120'],
            ```
        4. `SubmitShopApplication`:
            - Keep the existing `business_permit_url` and `logo_url` when no new file is sent.
            - Replace the `delete()` with a sync: update certificates by `id`, keeping the old `document_path` when no new file; create rows without an `id`; delete rows missing from the submission.
        5. `FileField`: add `existingUrl?: string|null` and `existingLabel?`. When `value` is null and `existingUrl` is set, show "Current file" with a view link and a Replace button. The `optional` flag stays unaffected.
        6. `register.tsx`:
            - Initialise state from `application` (codes, `halal_only`, certificate `id` and `document_url`).
            - Skip the client-side "missing document" errors when an existing file is present.
            - Change the rejected-banner copy "Documents must be uploaded again" to "Your previous documents are kept. Replace any that need updating."
            - Verify that the PSGC selects load options for the preselected parent codes on mount.
- **Verification:** Submit a full application. As an admin, request changes. Reopen `/seller/register` and confirm the logo, permit, certificates (with expiry, number and file), address selects, postal code and halal-only toggle are all prefilled. Submit unchanged and confirm it succeeds without re-uploading. Repeat for a rejected application.

#### Task 3.3: Clearer onboarding review page for admins

- **Source Reference:** #21
- **Target Files:**
    - `resources/js/components/content-preview.tsx` (the `shop_application` branch)
    - `resources/js/components/moderation-detail-pane.tsx`
    - `resources/js/components/audit-log-list.tsx`
    - `app/Actions/Moderation/ShowModerationItem.php`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - The pane's heading says "Reported content" for a shop application.
        - The applicant, flag notice, address, terms, certificates and permit tiles run together at text-caption size.
        - Certificates show the same label twice with no number or file name.
        - History shows raw action keys like `changes_requested` and `certificate_requested`.
    - **Exact Code Changes:**
        1. `moderation-detail-pane.tsx`: show "Shop application" as the title when `preview.kind === 'shop_application'`.
        2. Rewrite the `shop_application` preview as stacked sections, each with an `h3`:
            - **Applicant:** logo, shop name, owner name, email, submitted date.
            - **Shop details:** `<dl>` with a consistent label column (Description, Address, Halal-only, Seller terms version and accepted date).
            - **Documents:** a table or list with one row per item. The business permit row gets a "View" link. Each certificate row shows `certifying_body · No. {number}`, a "Valid until {date}" `StatusPill` (certified, expiring or expired) and a "View file" link.
            - **Flags:** the flag notice moves to a top callout, shown only when present.
        3. `AuditLogList`/history: map action keys to labels ("Changes requested", "Certificate requested", "Approved", "Rejected"). Show the admin name, the reason as body text and a timestamp.
        4. `ShopApplicationPreview` in `ShowModerationItem.php`: add `halal_only`, `submitted_at`, `terms_version` and `terms_accepted_at` if not already included.
- **Verification:** Open an item from the moderation queue with 2 certificates plus a permit and 2 history entries. Confirm every section is distinguishable and every document is identifiable and opens. Test in dark mode and on mobile.

---

### Module: Email & Notifications

#### Task 4.1: Branded email templates

- **Source Reference:** #1
- **Target Files:**
    - `resources/views/vendor/mail/html/header.blade.php`
    - `resources/views/vendor/mail/html/themes/default.css`
    - `resources/views/vendor/mail/text/header.blade.php`
    - `config/mail.php`
    - `.env.example`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** There are no published mail views, so emails use Laravel's default logo and colours. Only Fortify's verification and reset emails exist today. The new notifications below will also use this theme.
    - **Exact Code Changes:**
        1. Run `php artisan vendor:publish --tag=laravel-mail`.
        2. `header.blade.php`: replace the default logo with `<img src="{{ asset('images/brand/logo.png') }}" alt="{{ config('app.name') }}" height="40">`.
        3. `themes/default.css`: set `a`, the primary button and the header background from the app brand tokens (`--brand-600: #17643c`, hover `#10452d` from `resources/css/app.css`). Email CSS can't use CSS variables, so hard-code the hex values.
        4. Confirm `config/mail.php` `markdown.theme` is `default` and that `APP_URL` is publicly reachable so the logo loads in real inboxes.
- **Verification:** In tinker, run `(new \Illuminate\Auth\Notifications\VerifyEmail)->toMail($user)->render()` and open the HTML. Send a real test through Mailpit or Mailtrap and check Gmail and Outlook rendering.

#### Task 4.2: Notify applicant when changes are requested or the application is rejected

- **Source Reference:** #2
- **Target Files:**
    - new `app/Notifications/ShopApplicationReviewedNotification.php`
    - `app/Actions/Moderation/Concerns/ResolvesQueueItem.php`
    - `app/Actions/Moderation/RequestModerationChanges.php`
    - `app/Http/Controllers/Admin/ModerationDecisionController.php` (verify only)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** The shop status changes in three places: `requestShopRevision()` and the `rejected` branch in `ResolvesQueueItem`, plus the `Shop`/`Pending` branch in `RequestModerationChanges`. None of them notify the owner.
    - **Exact Code Changes:**
        1. New notification, `implements ShouldQueue`, `via` = `['database','mail']`.
            ```php
            public function __construct(public Shop $shop, public string $outcome, public ?string $reason) {}
            public function toArray($n): array {
                return ['type'=>'shop_application','workspace'=>'buyer',
                    'title'=> $this->outcome==='rejected' ? 'Application rejected' : 'Changes requested on your application',
                    'text'=> $this->reason, 'url'=> route('seller.register')];
            }
            public function toMail($n): MailMessage {
                return (new MailMessage)->subject(...)->greeting("Hi {$n->name},")
                    ->line(...)->line("Admin's note: {$this->reason}")
                    ->action('Update your application', route('seller.register'));
            }
            ```
        2. Call `$shop->owner->notify(...)` inside `requestShopRevision()` (outcome `changes_requested`), the `rejected` shop branch (outcome `rejected`), and the Shop branch of `RequestModerationChanges`. Wrap the call in `DB::afterCommit(fn() => ...)` so a rolled-back decision never sends mail.
        3. The payload `workspace` is `buyer` because applicants don't have a seller workspace until approved. Verify that `Workspace::allowedFor` agrees.
- **Verification:** `Notification::fake()` in a Pest test. Request changes and reject, then assert the notification was sent to the shop owner with the right outcome. Manually confirm the bell shows it and the email renders.

#### Task 4.3: Notify seller when an order is created, received and completed

- **Source Reference:** #12
- **Target Files:**
    - new `app/Notifications/SellerOrderNotification.php`
    - `app/Actions/Cart/PlaceOrder.php`
    - `app/Actions/Order/MarkOrderReceived.php`
    - `app/Actions/Order/CompleteOrder.php`
    - `app/Actions/Order/AutoCompleteOrders.php` (verify)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `OrderStatusNotification` is buyer-only. It is `database` only and its URL is always `route('orders.show')`. No seller-workspace notification exists.
    - **Exact Code Changes:**
        1. `SellerOrderNotification(Order $order, string $event)`: `ShouldQueue`, `via` = `['database','mail']`, payload `workspace => 'seller'`, `url => route('seller.orders.show', $order)`. Event copy: `created` "New order", `received` "Buyer confirmed receipt", `completed` "Order completed".
        2. `PlaceOrder`, right after the buyer notification: `$order->shop->user->notify(new SellerOrderNotification($order,'created'))`.
        3. `MarkOrderReceived`: send `received` after the status check, before calling `CompleteOrder`.
        4. `CompleteOrder`: send `completed` inside the same transaction path (use `DB::afterCommit`).
    - **Open decision:** a manual receive triggers `received` and `completed` back to back, because `MarkOrderReceived` calls `CompleteOrder`. Recommendation: keep both in-app and send one email for each, or collapse them into a single email if you'd rather not send two within seconds.
- **Verification:** Place an order and confirm the seller gets an in-app and email notification. Mark it received as the buyer and confirm the seller gets the other two. Check that the seller bell badge counts only seller-workspace items and that the link opens the seller order. Test the auto-complete path.

---

### Module: Storefront (Shop, Directory, Marketing)

#### Task 5.1: Link to the seller's profile page

- **Source Reference:** #8
- **Target Files:**
    - `resources/js/components/shop-header.tsx`
    - `resources/js/pages/product.tsx`
    - `resources/js/pages/shop.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `ShopHeader` (shown on the PDP) renders the shop name and logo as plain text. The shop page itself uses the same component.
    - **Exact Code Changes:**
        1. Add a `profileHref?: string` prop to `ShopHeader`. When set, wrap the logo and `<h1>` text in `<Link href={profileHref}>` and add an outlined "View shop" `Button` next to Chat and Follow.
        2. In `product.tsx`: `<ShopHeader shop={p.shop} profileHref={shopShow.url(p.shop.slug)} />`. `shop.tsx` doesn't pass it.
        3. Audit other places that print a shop name (checkout, `account/order.tsx`, orders table, chat thread) and link where it's a buyer-facing view. `cart-shop-group.tsx` already links.
- **Verification:** Open a PDP, click the shop name and logo, and confirm you land on `/shops/{slug}`. Confirm the shop page itself has no self-link. Test keyboard focus.

#### Task 5.2: Seller directory page

- **Source Reference:** #10
- **Target Files:**
    - `routes/web.php`
    - new `app/Http/Controllers/ShopDirectoryController.php`
    - new `app/Actions/Catalogue/ListShops.php`
    - new `resources/js/pages/sellers.tsx`
    - `resources/js/components/site-header.tsx`
    - `resources/js/components/site-footer.tsx` and `config/marketplace.php`
    - new `tests/Feature/ShopDirectoryTest.php`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** There is no listing of shops. `ShopCard` exists, so the card UI can be reused.
    - **Exact Code Changes:**
        1. Route: `Route::get('sellers', ShopDirectoryController::class)->name('shops.index');` (public, near the other public routes).
        2. `ListShops`: `Shop::query()->where('status', ShopStatus::Approved)->where('suspended', false)`. Support `q` (name ilike), `halal_only`, and `sort` (`followers`|`rating`|`newest`). Paginate with `Inertia::scroll`, matching the shop page. Map to the same shape `ShopController` builds for `ShopData`.
        3. `sellers.tsx` (default `PublicLayout`): `SearchInput`, `SortControl`, a halal-only filter chip and a `ShopCard` grid. Include an `EmptyState`.
        4. Add a "Sellers" link in the header nav, the footer and, where helpful, the home page.
- **Verification:** Visit `/sellers`. Confirm only approved, unsuspended shops appear, and test search, sort, filters and infinite scroll. Click a card and confirm it opens the shop page. Add a Pest feature test for the visibility rules.

#### Task 5.3: Make "Why Choose Our Marketplace?" stand out, with a CTA per benefit

- **Source Reference:** #11
- **Target Files:**
    - `resources/js/components/home-benefits.tsx` (the `compact` variant)
    - `resources/js/content/home-benefits.ts`
    - `resources/js/pages/home.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** The compact variant is four small white cards on the page background, with a tiny "Details" text link as the only action. `renderCta()` already builds the full CTA per audience (Start Shopping, Start Selling, certification, B2B) but only the full variant uses it.
    - **Exact Code Changes:**
        1. Wrap the compact section in a branded surface (the dark `surface-inverse` with the `pattern-geo` already used in `ShopHeader`, or a `primary-soft` band) with larger heading and intro text.
        2. Make each card bigger: icon in a coloured tile, `eyebrow`, `title`, `summary`, and one-line bullets drawn from the first two items of `bullets`.
        3. Replace the "Details" link with `renderCta(audience)` as the primary button, and keep a smaller "Learn more" link to `/why-choose-us#{id}`.
        4. Keep the existing `canBecomeSeller`, `halalCertificationUrl` and `b2bUrl` gating so a CTA is hidden or falls back to its link when unavailable.
- **Verification:** Check the home page at 375, 768 and 1280px in light and dark mode. Confirm each CTA goes to the right place: shopping to `/`, selling to register or dashboard by role, certification and B2B to their URLs. Confirm contrast on the dark band.

#### Task 5.4: Rename "Sell on ..." to "Start selling"

- **Source Reference:** #20
- **Target Files:**
    - `resources/js/components/site-header.tsx` (~L260)
    - `config/marketplace.php` (~L148)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** Two hard-coded labels: `Sell on {name}` in the header nav and `'Sell on {brand}'` in the footer config.
    - **Exact Code Changes:** Change the header text to `Start selling`. In the config, change the label to `'Start selling'`. Leave the sentence in `seller-terms.ts` ("To sell on {entity_name} you must…") alone, because it is legal copy, not a link label.
- **Verification:** `grep -rni "sell on" resources config tests` should show only the terms copy. Check the header and footer, and update any e2e tests that look for the old label.

---

### Module: Seller Centre - Orders & Layout

#### Task 6.1: "View shop" outlined button on all seller centre pages

- **Source Reference:** #13
- **Target Files:**
    - `resources/js/layouts/seller-layout.tsx`
    - `app/Http/Middleware/HandleInertiaRequests.php`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** `SellerLayout` only renders "View shop" when a `shop` prop is passed, but `app.tsx` returns the layout with no props, so it is effectively never shown. The link is also a ghost button, `hidden lg:inline-flex`, and opens in the same tab.
    - **Exact Code Changes:**
        1. Add `'shop_slug' => $shop->slug` to the shared `seller` array in `HandleInertiaRequests`.
        2. In `SellerLayout`, read `seller` from `usePage().props`. Render when `seller?.status === 'approved' && !seller.suspended`:
            ```tsx
            <Button asChild variant="outline" size="sm">
                <a
                    href={`/shops/${seller.shop_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    View shop <ExternalLink aria-hidden className="size-4" />
                </a>
            </Button>
            ```
            Drop `hidden lg:inline-flex` (or collapse it to icon-only on small screens).
        3. `chat.tsx` and `notifications.tsx` use `SellerLayout` directly, so they get the button too.
- **Verification:** Open the dashboard, products, orders, customers, finance, vouchers, chat, notifications and settings pages. Confirm the outlined button shows on each and opens the shop in a new tab. Confirm it is hidden for suspended shops.

#### Task 6.2: Customer information on the seller order page

- **Source Reference:** #14
- **Target Files:**
    - `app/Actions/Seller/GetSellerOrder.php`
    - `resources/js/pages/seller/orders/show.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** The payload already has `buyer {id,name,email}` but the page only uses it in passing. There is no customer section and no link to the seller customer profile route (`seller.customers.show`).
    - **Exact Code Changes:**
        1. Add `buyer.phone` (from the shipping address) and `buyer.orders_count` for this shop.
        2. Add a "Customer" panel above the shipping address, in the same column: avatar, name as `<Link href={customerShow(order.buyer.id).url}>`, email, phone, and a "View profile" link.
        3. Verify `ShowSellerCustomerRequest` allows the customer for any shop with an order from them, and confirm the Wayfinder import path (`@/routes/seller/customers`).
- **Verification:** Open an order and confirm the name and link open `/seller/customers/{id}` and the profile loads. Try it with a customer of another shop and confirm it is blocked.

#### Task 6.3: Correct product images in fulfilment cards

- **Source Reference:** #15
- **Target Files:**
    - `app/Models/Product.php`
    - `app/Actions/Seller/GetSellerOrder.php`
    - `app/Actions/Order/GetOrder.php`
    - `app/Actions/Seller/ListSellerOrders.php`
    - `app/Actions/Seller/GetSellerDashboard.php`
    - `resources/js/pages/seller/orders/show.tsx`
    - `resources/js/pages/account/order.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** These payloads only send `thumbnail_icon`. `FulfillmentCard` already renders `line.thumbnail` when provided, but nothing sets it. The unfulfilled mapping (~L127) and the parcel mapping (~L304) in `show.tsx` also pass only the icon. (Depends on Task 1.1 for real URLs.)
    - **Exact Code Changes:**
        1. Add `Product::thumbnailUrl(): ?string` returning `$this->images->firstWhere('url','!=','')?->url`, and use `thumbnail_icon` only as the fallback.
        2. In the payloads above, add `'thumbnail' => $item->product?->thumbnailUrl()` to items and parcel lines.
        3. In `show.tsx` and `account/order.tsx`, pass `thumbnail: line.thumbnail` alongside `thumbnail_icon`.
        4. Eager-load `images` where missing (`GetSellerOrder` loads `items.product.images`, but the parcel lines read the same relation, so no extra queries).
- **Verification:** Create an order for a product with an uploaded photo. Confirm the Unfulfilled card, Parcel cards, buyer order page, and seller order list and dashboard show the real image. Confirm the icon fallback still works for products without a photo.

#### Task 6.4: Remove the per-parcel "Confirm received" buttons

- **Source Reference:** #16
- **Target Files:**
    - `resources/js/pages/account/order.tsx` (~L593-604)
    - tests under `tests/` or `tests/e2e` that click "Confirm received"
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** Each `FulfillmentCard` gets a `footer` with a "Confirm received" button, in addition to the order-level "Order received" button. Both call the same `handleMarkReceived`, which completes the whole order.
    - **Exact Code Changes:** Delete the `footer={...}` prop from the buyer's `FulfillmentCard`. Keep the full-width "Order received" button in the action row.
- **Verification:** Open a `to_receive` order with 2 parcels. Confirm only "Order received" remains and it still completes the order. Run `grep -rn "Confirm received" resources tests` and update any matches.

#### Task 6.5: Fixed "Print waybill" bar covers the timeline

- **Source Reference:** #17
- **Target Files:**
    - `resources/js/pages/seller/orders/show.tsx` (~L201 and ~L467)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** The content wrapper is `pb-24 lg:pb-0`, but the action bar is `fixed ... md:bottom-0`, so on desktop it overlays the last content with no reserved space.
    - **Exact Code Changes:** Change the wrapper to `pb-28` with no `lg:pb-0`. Optionally add `scroll-pb-28` on the scroll container. Check whether the buyer order page's sticky bar has the same pattern.
- **Verification:** Open a seller order with a long timeline on mobile and desktop. Scroll to the bottom and confirm the last timeline entry is fully visible above the bar.

---

### Module: Refunds

#### Task 7.1: Partial refunds for sellers

- **Source Reference:** #18
- **Target Files:**
    - new migration `create_order_refunds_tables`
    - new `app/Models/OrderRefund.php`, `app/Models/OrderRefundItem.php`
    - `app/Models/Order.php`, `app/Models/OrderItem.php`
    - `app/Actions/Order/RequestReturn.php`
    - `app/Actions/Order/ResolveReturn.php`
    - `app/Http/Controllers/Seller/OrderReturnController.php`
    - `app/Http/Requests/Seller/ResolveOrderReturnRequest.php`
    - `app/Http/Requests/Account/*` (buyer return request)
    - `app/Actions/Seller/GetSellerOrder.php`
    - `app/Actions/Order/GetOrder.php`
    - `resources/js/pages/seller/orders/show.tsx`
    - `resources/js/pages/account/order.tsx`
- **Solution & Implementation Details:**
    - **Root Cause / Logic:**
        - `ResolveReturn` has only `approve` and `reject`. Approve always sets the order to `Refunded` and debits the ledger for the whole `subtotal - voucher_discount`.
        - The buyer's return request is a free-text reason with no items, which is why the timeline contains entries like "refund one item".
        - There is no table to record what was refunded.
    - **Exact Code Changes:**
        1. Migration: `order_refunds` (`id` ulid, `order_id`, `amount` matching the ledger's unit, `reason` nullable, `resolved_by`, timestamps) and `order_refund_items` (`order_refund_id`, `order_item_id`, `qty`). Add `Order::refunds()` and `OrderItem::refundedQuantity()`.
        2. `RequestReturn`: accept optional `items: [{order_item_id, qty}]` along with the reason. Store the request as the `OrderEvent` metadata (the event table already has a `metadata` column).
        3. `ResolveOrderReturnRequest` rules:
            ```php
            'decision' => ['required','in:approve,reject'],
            'items' => ['required_if:decision,approve','array','min:1'],
            'items.*.order_item_id' => ['required','string'],
            'items.*.qty' => ['required','integer','min:1'],
            ```
        4. `ResolveReturn` on approve:
            - Validate each `qty <= item.qty - refundedQuantity`.
            - Compute `amount = sum(unit_price x qty)`, less a proportional share of `voucher_discount`.
            - Create the refund and item rows, write a negative ledger entry for that `amount`, and add an event "Partial refund approved" or "Refund approved".
            - Set the status to `Refunded` only if every unit is refunded, otherwise back to `Completed` so a further request is possible.
            - Notify the buyer with the amount.
        5. Keep the ledger's existing unit and conversion. The current line casts to `(int)` from decimal order columns, so verify `LedgerEntry.amount` is whole pesos or centavos before writing the new amount.
        6. UI:
            - Seller `show.tsx`: in the Return/refund panel, list each item with a checkbox and a qty stepper, preselected from the buyer's request (or all items). Show a live "Refund total", with the primary button reading "Approve full refund" or "Approve partial refund" depending on the selection.
            - Buyer return modal in `account/order.tsx`: add item checkboxes with quantities.
- **Verification:** Order with 3 items. Buyer requests 1. Seller approves a partial refund. Confirm the order returns to `Completed`, the ledger shows one negative entry for the right amount, and the timeline shows "Partial refund approved". Then refund the rest and confirm the order becomes `Refunded`. Also test over-refunding, decline, and the full-refund path. Add Pest tests under `tests/Feature/Order`.

#### Task 7.2: Link refund timeline entries to refund information

- **Source Reference:** #19
- **Target Files:**
    - `app/Actions/Order/GetOrder.php`
    - `app/Actions/Seller/GetSellerOrder.php`
    - `resources/js/components/timeline.tsx`
    - `resources/js/pages/seller/orders/show.tsx` (its inline timeline)
    - `config/marketplace.php` (`pages.returns`)
- **Solution & Implementation Details:**
    - **Root Cause / Logic:** Refund events ("Refund approved", "Return/refund requested", "Return/refund declined") are plain text. A `/pages/returns` content page exists but nothing links to it.
    - **Exact Code Changes:**
        1. In both order payloads, add `help_url => route('pages.show','returns')` to timeline events whose title starts with `Return/refund` or `Refund`.
        2. `timeline.tsx`: add an optional `help_url` to `TimelineEvent` and render a small "How refunds work" link under the event. The seller `show.tsx` timeline renders the same link.
        3. Extend the `returns` page sections in `config/marketplace.php` to cover partial refunds, the review timeline, declined requests and disputes. The page was chosen over a popup because the content page already exists. For a popup, reuse the same sections inside a `Dialog`.
- **Verification:** Open an order with refund events on both buyer and seller sides. Click the link and confirm it opens `/pages/returns` with the new sections.

---

### Step-by-Step Execution Checklist

1. [x] **Task 4.1:** Publish mail views and apply logo and theme colours (`resources/views/vendor/mail/*`)
2. [x] **Task 1.1:** Wire product image upload, storage and display (`form.tsx`, requests, create/update actions, `ProductController`, `ListSellerProducts`)
3. [x] **Task 1.2:** Submit option names, backfill, and fix PDP and picker selection (`form.tsx`, `product.tsx`, `variation-picker.tsx`, migration)
4. [x] **Task 1.3:** Add sale price to products and variations (migration, requests, actions, form, `variant-matrix.tsx`)
5. [x] **Task 2.1:** Change variation from the cart (`CartController`, `UpdateCartItemRequest`, `UpdateCartItemVariation`, cart UI)
6. [x] **Task 3.1:** Make the change-request banner prominent (`alert.tsx`, `register.tsx`)
7. [x] **Task 3.2:** Keep onboarding data and files on resubmission (migration, controller, request, `SubmitShopApplication`, `file-field.tsx`, `register.tsx`)
8. [x] **Task 3.3:** Redesign the admin application review layout (`content-preview.tsx`, `moderation-detail-pane.tsx`, `audit-log-list.tsx`)
9. [x] **Task 4.2:** Notify applicants on changes requested or rejected (new notification, `ResolvesQueueItem`, `RequestModerationChanges`)
10. [x] **Task 4.3:** Notify sellers on order created, received and completed (new notification, `PlaceOrder`, `MarkOrderReceived`, `CompleteOrder`)
11. [x] **Task 5.1:** Link the shop header on the PDP to the shop profile (`shop-header.tsx`, `product.tsx`)
12. [x] **Task 5.2:** Build the seller directory (`routes/web.php`, `ShopDirectoryController`, `ListShops`, `sellers.tsx`, nav links)
13. [x] **Task 5.3:** Redesign the home benefits section with a CTA per benefit (`home-benefits.tsx`)
14. [x] **Task 5.4:** Rename "Sell on …" to "Start selling" (`site-header.tsx`, `config/marketplace.php`)
15. [x] **Task 6.1:** Add the outlined, new-tab "View shop" button to all seller pages (`seller-layout.tsx`, `HandleInertiaRequests.php`)
16. [x] **Task 6.2:** Add the customer panel with profile link to the seller order page (`GetSellerOrder.php`, `seller/orders/show.tsx`)
17. [x] **Task 6.3:** Pass real thumbnails to fulfilment components (`Product.php`, order payload actions, both order pages)
18. [x] **Task 6.4:** Remove per-parcel "Confirm received" buttons (`account/order.tsx`)
19. [x] **Task 6.5:** Reserve space for the fixed Print waybill bar (`seller/orders/show.tsx`)
20. [x] **Task 7.1:** Implement partial refunds end to end (migration, models, `RequestReturn`, `ResolveReturn`, request classes, both order pages)
21. [x] **Task 7.2:** Link refund timeline events to refund information (`timeline.tsx`, order payload actions, `config/marketplace.php`)
22. [x] **Final pass:** Run `php artisan test`, `vendor/bin/pint`, `vendor/bin/phpstan` and the front-end lint/typecheck. Then smoke-test buyer, seller and admin flows once.
