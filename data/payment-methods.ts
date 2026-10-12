export const paymentMethods = [
  { name: "Visa", file: "visa.svg", width: 72 },
  { name: "Mastercard", file: "mastercard.svg", width: 48 },
  { name: "American Express", file: "americanexpress.svg", width: 64 },
  { name: "Google Pay", file: "googlepay.svg", width: 72 },
  { name: "Apple Pay", file: "applepay.svg", width: 72 },
  { name: "PayPal", file: "paypal.svg", width: 96 },
  { name: "iDEAL", file: "ideal.svg", width: 36 },
  { name: "Revolut", file: "revolut-wordmark.svg", width: 80 },
  { name: "Bancontact", file: "bancontact.svg", width: 56 },
  { name: "Discover", file: "discover.svg", width: 80 },
  { name: "EPS", file: "eps.svg", width: 48 },
  { name: "Paysafecard", file: "paysafecard-wordmark.svg", width: 112 },
] as const;
export type PaymentMethod = typeof paymentMethods[number]["name"];
