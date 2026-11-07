# Components

## Actions
- [Button](button.md): Triggers an action in place: submit, add to cart, confirm, delete.
- [IconButton](icon-button.md): A square button that shows only an icon: cart, chat, close, more.
- [Link](link.md): Navigates to another page or section.
- [StickyActionBar](sticky-action-bar.md): Keeps the main actions within thumb reach on phone: product detail (Shop | Chat | Add to cart | Buy now), checkout (total + Place order), seller forms (Save).

## Forms
- [FormField](form-field.md): Wrapper that gives every control a label, optional help, an error slot and a required/optional marker, wired with `aria-describedby`.
- [TextField](text-field.md): Single-line text input with optional prefix/suffix (₱, unit, reveal password, clear).
- [TextArea](text-area.md): Multi-line text with optional character counter (reviews, product descriptions, report details).
- [SearchInput](search-input.md): Search field with suggestions (ARIA combobox).
- [Select](select.md): Native single choice from a short list (region, province, sort order).
- [Combobox](combobox.md): Type-to-filter single choice for long lists: city/municipality, barangay, category, courier.
- [Checkbox](checkbox.md): Independent on/off choices and multi-select (cart items, filters, bulk select).
- [Radio](radio.md): One choice from a small set, all options visible (payment method, shipping option, report reason).
- [Switch](switch.md): Immediate on/off setting (notifications, vacation mode, show sold count).
- [QuantityStepper](quantity-stepper.md): Change a quantity with − / + or by typing (cart item, variation sheet).
- [PhoneInput](phone-input.md): Philippine mobile number with fixed +63 prefix, formatted as 9XX XXX XXXX.
- [OTP input](otp-input.md): Six-digit verification code from SMS/email, with autofill support.
- [ImageUploader](image-uploader.md): Multi-image upload for listings, reviews and reports: cover, reorder, remove, progress, per-file errors.
- [RatingInput](rating-input.md): 1–5 star rating for reviews; native radios underneath.
- [AddressForm (PH)](address-form.md): Philippine address group: name, mobile, Region → Province → City/Municipality → Barangay, street, postal code, landmark, label, default.

## Feedback
- [Toast](toast.md): Short, transient confirmation of something the user just did (“Added to cart”).
- [Banner / Alert](banner.md): Persistent inline message about a page or form: account status, shipping delays, form summary errors.
- [Skeleton](skeleton.md): Placeholder shapes while content loads, matching the final layout to avoid shifts.
- [Spinner](spinner.md): Indeterminate progress for short waits where layout is unknown (payment redirect, infinite scroll).
- [ProgressSteps](progress-steps.md): Shows position in a multi-step flow (seller onboarding, return request).
- [EmptyState](empty-state.md): Explains why a list or page is empty and offers the next action.
- [ErrorState](error-state.md): Replaces content that failed to load, with a retry.
- [ConfirmDialog](confirm-dialog.md): Asks for confirmation before destructive or irreversible actions.

## Overlays
- [Modal → BottomSheet](modal.md): One dialog component that is a bottom sheet on phone and a centered modal from `md:` up.
- [BottomSheet](bottom-sheet.md): Phone-first sheet that stays a sheet on every tier (variation picker, share, action sheet).
- [Drawer](drawer.md): Side panel for navigation on phone (seller/admin menu) and secondary panels.
- [Popover / Dropdown](popover.md): Small menu anchored to a trigger (more actions, sort).
- [Tooltip](tooltip.md): Supplementary label on hover (pointer) or keyboard focus.

## Navigation
- [BottomTabBar](bottom-tab-bar.md): Primary storefront navigation on phone and tablet: Home, Categories, Chat, Notifications, Me.
- [Header](header.md): Storefront header: compact search row on phone/tablet; announcement bar + logo + wide search + account + category nav on desktop.
- [Sidebar](sidebar.md): Section navigation for account, seller and admin shells: drawer on phone, collapsed icon rail on tablet, full sidebar on desktop.
- [Breadcrumb](breadcrumb.md): Shows the category path on listing and product pages (desktop/tablet); scrolls horizontally on phone.
- [Tabs](tabs.md): Switch between views of the same object: order status tabs, shop page tabs, product details/reviews.
- [SegmentedControl](segmented-control.md): Exclusive choice among 2–4 short options that changes a view (grid/list, period).
- [Pagination & infinite scroll](pagination.md): Pagination for tables and desktop search; infinite scroll with a “Load more” fallback for phone feeds.
- [SiteFooter](footer.md): Storefront footer: trust strip (halal verification promise, accepted payments, couriers), five link groups + brand block with tagline/socials/contact, and a legal bar.

## Data display
- [Badge / Chip / Tag](badge.md): Badge: non-interactive status or label.
- [Avatar](avatar.md): User or shop identity with initials fallback and optional presence dot.
- [Card / Panel](card.md): Surface containers.
- [Accordion](accordion.md): Progressive disclosure using native `<details>`: FAQs, product specs, filter groups.
- [Carousel / Gallery](carousel.md): Swipeable media gallery with thumbnails, counter and full-screen zoom.
- [Rating](rating.md): Read-only star rating with numeric value and count.
- [StatCard](stat-card.md): One metric with label, value and change (seller/admin dashboards).
- [KeyValueList](key-value-list.md): Label/value pairs for order details, product specs, applicant info.
- [Timeline / OrderTracker](timeline.md): Chronological events with done / current / to-do states (order tracking, audit history).
- [DataTable](data-table.md): Sortable, selectable table for seller/admin lists that becomes a card list on phone.

## Commerce
- [ProductCard](product-card.md): The dense, scannable product tile: image, 2-line title, price, discount, rating, “N sold”, location, verified badge.
- [PriceBlock](price-block.md): Formats price in ₱ with tabular numerals: current, original (struck), discount %, ranges.
- [SoldCount](sold-count.md): Social proof “N sold” in compact notation.
- [VerifiedBadge](verified-badge.md): Generic, configurable trust badge for verified/official/preferred shops.
- [ShopCard](shop-card.md): Shop summary in search results and “Shops you follow”.
- [ShopHeader](shop-header.md): Top of the shop page: cover, avatar, name + badge, location/activity, Follow and Chat, stats.
- [CategoryTile](category-tile.md): Icon + label shortcut to a category; grid of 10 on home.
- [ProductGallery](product-gallery.md): Product detail photos: Carousel with thumbnails, counter and zoom, edge-to-edge on phone.
- [VariationPicker](variation-picker.md): Bottom sheet for choosing variation (color, size) and quantity before Add to cart / Buy now.
- [VoucherCard](voucher-card.md): Ticket-style voucher: issuer stub, value, condition, expiry, Claim/Use/Applied.
- [VoucherPicker](voucher-picker.md): Modal → sheet to apply shop/platform/shipping vouchers and codes at checkout.
- [CartItem](cart-item.md): One cart line: select, thumbnail, title, variation (opens VariationPicker), price, stepper, stock notes.
- [CartShopGroup](cart-shop-group.md): Cart section per shop with select-all, shop link, chat, items and shop voucher.
- [OrderSummary / PriceBreakdown](order-summary.md): Itemised totals: subtotal, shipping, discounts, vouchers, total payment.
- [AddressCard & picker](address-card.md): Delivery address display at checkout and radio-card picker in the address book.
- [ShippingOptionPicker](shipping-option-picker.md): Choose delivery speed per shop: name, ETA, fee; unavailable options disabled with reason.
- [PaymentMethodPicker](payment-method-picker.md): Choose e-wallet, card, online banking or Cash on Delivery.
- [OrderCard](order-card.md): Order in My Purchases: shop, status badge, tracking note, items, total, actions for the current status.
- [OrderStatusTabs](order-status-tabs.md): Tabs for To Pay / To Ship / To Receive / Completed / Cancelled / Return-Refund with counts.
- [ReviewCard](review-card.md): Buyer review with stars, variation, text, photos, helpful, report and seller response.
- [ReviewForm](review-form.md): Rate a completed order item: stars, text, photos, anonymous.

## Chat & notifications
- [ChatList](chat-list.md): Conversation list: avatar with presence, name, last message, time, unread count.
- [ChatThread](chat-thread.md): Message thread with day dividers, bubbles, product/order cards, safety notice and composer.
- [ChatBubble](chat-bubble.md): A single text message: incoming (surface) or outgoing (primary), with time and delivery status.
- [ChatComposer](chat-composer.md): Message input: attach (photo, product, order), auto-growing textarea, send.
- [ChatProductCard / ChatOrderCard](chat-cards.md): Rich message cards for a product being asked about and an order reference.
- [NotificationItem](notification-item.md): Activity and order updates in the Notifications tab.
- [ReportDialog](report-dialog.md): Report a listing, review, chat, user or shop: reason (required), details, evidence.

## Seller
- [TaskCard](task-card.md): Seller dashboard to-do: a count and a label that deep-links to the filtered list.
- [OrderRow / OrderActionBar](order-row.md): Seller order list row (card on phone, row on md+) and the order-detail action bar (sticky on phone).
- [ProductForm sections](product-form.md): Seller listing editor as titled panels: Basic info, Media, Sales, Shipping; sticky Save draft / Publish.
- [VariantMatrix editor](variant-matrix.md): Define up to two variation types, then edit price, stock and SKU for every combination.
- [StockInput](stock-input.md): Numeric stock field with unit and low-stock hint.
- [SalesChart](sales-chart.md): Simple accessible bar chart with a summary line and a data-table alternative.
- [ShopSettings sections](shop-settings.md): Shop profile, status switches (vacation mode, auto-reply) and shipping channels as panels.

## Moderation
- [StatusPill (moderation)](status-pill.md): Item state in the moderation console: pending, flagged, hidden, suspended, resolved.
- [ModerationQueueItem](moderation-queue-item.md): Queue row: type icon, title, excerpt, StatusPill, age/SLA, reporter count, priority.
- [QueueFilterBar](queue-filter-bar.md): Search + quick-type chips inline on tablet/desktop; phone gets a “Filters” bottom sheet.
- [ModerationDetailPane](moderation-detail-pane.md): The item being reviewed: reported content, report reasons, history, and the action bar.
- [ReasonPicker](reason-picker.md): Decision reason: template radios + free text to the seller.
- [ModerationActionBar](moderation-action-bar.md): Decisions on the open item: Approve, Reject always visible; secondary actions behind More on phone.
- [BulkActionBar](bulk-action-bar.md): Actions on selected queue items; appears when checkboxes are ticked.
- [AuditLogList](audit-log.md): Chronological who/what/when of decisions, auto-flags and seller edits.
- [ContentPreview (slots)](content-preview.md): The reported content rendered read-only: product listing, review, or chat excerpt with context only.

## Halal
- [HalalBadge](halal-badge.md): One vocabulary for halal status across storefront, seller centre and moderation: certified, under review, expiring, expired, missing and Muslim-friendly (non-food, no certificate needed).
- [HalalCertificateCard](halal-certificate-card.md): What the platform verified about a halal claim: who certified it, which number, until when, and what it covers.
- [HalalFacts](halal-facts.md): Three scannable facts above the fold on product detail: status, certifier, valid-to.
- [HalalVerificationChecklist](halal-verification-checklist.md): Reviewer checklist for halal checks in the moderation console.
