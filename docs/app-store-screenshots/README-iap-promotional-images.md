# IAP promotional images (App Store Connect — guideline 2.3.2)

These are **not** the same as version screenshots. Configure them under:

**App Store Connect → Monetization → Subscriptions →** open each product → **Promotional Image**.

Products: `medvba_pro_monthly`, `medvba_pro_yearly`.

## Option A — fastest (recommended if not promoting IAP on the store)

Delete the promotional image on **both** subscription products. No app rebuild required.

## Option B — unique image per product

Upload a **different** image for each product. Do **not** use the app icon. Do **not** reuse the same file for monthly and yearly.

Ready-made assets in the repo (1024×1024):

| Product | Suggested file |
|---------|----------------|
| `medvba_pro_monthly` | [`assets/images/medvba-subscription-1024-lunar.png`](../../assets/images/medvba-subscription-1024-lunar.png) |
| `medvba_pro_yearly` | [`assets/images/medvba-subscription-1024-anual.png`](../../assets/images/medvba-subscription-1024-anual.png) |

Alternates (if you prefer a different look): `medvba-subscription-1024-visual.png`, `medvba-subscription-1024-combo.png`, `medvba-subscription-1024-simple.png`.

## Also check RevenueCat paywall template

RevenueCat dashboard → **Paywalls** → your template → add **Terms of Service** and **Privacy Policy** URLs (`https://medvba.app/privacy`).

## Related

- Version screenshots (paywall in top 3): [`README-upload-order.md`](README-upload-order.md)
- Metadata + review notes: [`../app-store-metadata-en.md`](../app-store-metadata-en.md)
