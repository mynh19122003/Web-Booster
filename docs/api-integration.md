# API integration status

The public UI uses same-origin `/api/*` requests. Set `NEXT_PUBLIC_PUBLIC_DATA_SOURCE=api` or leave it unset. Any other value is rejected. Admin modules also accept only `api`.

Current local routes for authentication, profile, support requests, and chat hold data in server memory. They reset on restart and are suitable only for development. `/api/mock/*` returns 404, and the Socket.IO server does not allow demo authentication.

Checkout returns `503 payment-unavailable` until a payment provider is connected. Account inventory, verified reviews, employee workflows, and admin adapters have no live backend source yet. The legacy employee workflow adapter still contains local operations but starts with an empty store; it is not an API integration. Other unavailable features render an empty state or an error. Do not interpret an empty state as a successful API integration.

Before connecting a backend, define the base URL, endpoint paths, request and response schemas, authentication/session method, and error codes. Update the same-origin route handlers or the admin adapters to match that contract, then add integration tests against the test server.
