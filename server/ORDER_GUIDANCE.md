# Order guidance

Published sources checked on 22 September 2026:

- https://tech-tailor.com/ advertises free worldwide DHL delivery and measurement options.
- https://tech-tailor.com/terms-of-service advises approximately three weeks for production and delivery; the recipient pays customs/import charges. It mentions credit cards but does not explicitly establish US-issued card acceptance or supported networks.
- https://tech-tailor.com/locate-us?schedule-tech=false is the published contact page.

The stylist links customers to these pages and asks them to confirm their address and payment method before checkout. It does not treat a saved delivery preference as a shipping booking. Optional server environment variables `STYLIST_PAYMENT_POLICY` and `STYLIST_SHIPPING_POLICY` override chat answers when confirmed business policies change. Update the linked help panel in `client/src/features/stylist/OrderHelp.tsx` at the same time.

Detailed requests are stored with the existing in-memory chat session and checkpoints. They are included in the order summary, but the external commerce site does not receive them automatically. Customers must confirm them on Tech-Tailor before payment. Measurements from the external scan are not automatically imported, and selecting a technician method does not book an appointment.

Run regression checks with `npm test` in the server directory.
