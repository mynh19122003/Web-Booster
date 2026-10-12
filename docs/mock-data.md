# Frontend demo data

The public customer interface defaults to `NEXT_PUBLIC_PUBLIC_DATA_SOURCE=mock`.
Profile, avatar uploads, sign-in, checkout, support conversations, coaches, Riot
statistics, reviews and currency data use `services/public.ts` in the browser.
No backend requests or real payments occur in this mode. Customer data is stored
under `ascend-public-mock-v1`; passwords and Riot credentials are never persisted.

A fresh browser starts signed in as Minh Anh (`minhanh@ascend.demo`) with sample
conversations, four coaches and a coaching item in the cart. Sign out to test
the login UI. In demo mode, any valid email and password of at least eight
characters can be used. This is a preview, not authentication. Profile password
changes validate the form only and do not create credentials.

Cart and completed demo orders use the existing `ascend-cart-v1` and
`ascend-orders-mock-v1` keys. Existing saved data is preserved. To reset the demo,
remove these three keys from browser storage and reload.

Admin and employee portals retain main's existing mock services and fixtures,
including the Sofia demo flow. Public support conversations are isolated from
the portal's operations fixtures.

When connecting the API, set `NEXT_PUBLIC_PUBLIC_DATA_SOURCE=api` and rebuild.
This selects the existing API routes explicitly; failures do not fall back to
mock data. Configure authentication, Riot and payment integration separately
before treating the application as a production service.
