# Dead links / unimplemented navigation

Audit note from the dummy-data cleanup: production data is now seeder/config/DB driven, but a few navigation affordances still point nowhere (`href="#"`) or use query params the chat index ignores. Implement the real route/page or hide the control until it exists — do not leave `href="#"` in production components.

## Header

| Surface                      | Current code                                      | Intended target                                                                          | Work needed                                                                                                                                            |
| ---------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Sell on {name}" desktop nav | `resources/js/components/site-header.tsx:165-170` | Public seller onboarding/landing route (e.g. `/sell`) or hide until seller signup exists | Add route + page with requirements/CTA to register/login, then use Wayfinder. If sellers are provisioned only, link to `login` with a seller redirect. |
| "Help" desktop nav           | `resources/js/components/site-header.tsx:171-176` | Help centre page or configured external support URL                                      | Add `help` page or `config('app.support.help_url')`; hide the link if neither exists.                                                                  |

## Footer

`resources/js/components/site-footer.tsx:3-10,29-36` renders all footer links as `href="#"`.

| Group   | Links                     | Intended target                                            | Work needed                                                                              |
| ------- | ------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Shop    | Categories                | Home categories section anchor or a categories index route | Only `categories/{slug}` exists today; add an index/anchor or remove the link.           |
| Shop    | Vouchers                  | Public promo/voucher page or home voucher section anchor   | No public voucher route exists; create one or point to the seeded home vouchers section. |
| Shop    | Sell                      | Same as header "Sell on {name}"                            | Share the seller onboarding route/decision.                                              |
| Support | Help centre               | Same as header "Help"                                      | Share the help destination/decision.                                                     |
| Support | Returns                   | Returns policy page                                        | Add static/content page or config-driven link.                                           |
| Support | Contact us                | Contact page or configured support email/URL               | Add page or `config('app.support.contact')`.                                             |
| Support | Halal verification policy | Halal/certification explainer page                         | Can be built from `docs/halal.md` and certifier checklist content.                       |
| Company | About, Terms, Privacy     | Static legal/info pages                                    | Add pages or config-driven footer links once content exists.                             |

## Chat entry points

| Surface                        | Current code                                                                             | Intended target                           | Work needed                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cart shop group chat icon      | `resources/js/components/cart-shop-group.tsx:97-103` (`<a href="#">`)                    | Start/open buyer↔shop conversation        | Backend exists: `POST /chat` (`chat.store`) accepts `shop_id`, optional `product_id`, `initial_message`; `StartConversation` first-creates by `user_id + shop_id` and redirects to `chat.show`. Use Wayfinder `store`/`show` from `@/routes/chat`; for the cart group, POST `{ shop_id: group.shop.id }`. For product pages, include `product_id` and optionally `initial_message`.                                                          |
| Seller order "Chat with buyer" | `resources/js/pages/seller/orders/show.tsx:211-215` uses `/chat?buyer=${order.buyer_id}` | Open the existing buyer↔shop conversation | Chat index ignores `buyer`, so this only opens the list. Conversations are keyed by buyer `user_id` + `shop_id`. Add `conversation_id`/`chat_url` to `GetSellerOrder` by finding `Conversation` where `user_id = order.user_id` and `shop_id = order.shop_id`, then link with Wayfinder `show`/`index` from `@/routes/chat`. Decide behavior when no conversation exists (link to `chat.index` or add a seller-initiated conversation path). |

## Related cleanup while touching chat

- `resources/js/pages/chat.tsx` still uses literal `/chat`, `/chat/${id}`, and `/chat/${id}/messages`. Replace with Wayfinder `index`, `show`, and `messages.store` from `@/routes/chat` when updating the chat links above.
