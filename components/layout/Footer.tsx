import Image from "next/image";

const paymentLogos = [
  ["Visa", "visa.svg", 42],
  ["Mastercard", "mastercard.svg", 36],
  ["American Express", "americanexpress.svg", 48],
  ["Google Pay", "googlepay.svg", 44],
  ["Apple Pay", "applepay.svg", 44],
  ["Bitcoin", "bitcoin.svg", 24],
  ["PayPal", "paypal.svg", 52],
  ["JCB", "jcb.svg", 24],
  ["Revolut", "revolut-wordmark.svg", 52],
  ["Bancontact", "bancontact.svg", 34],
  ["Discover", "discover.svg", 50],
  ["eps", "eps.svg", 22],
  ["paysafecard", "paysafecard-wordmark.svg", 58],
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="payment-methods" aria-label="Payment method logos">
        {paymentLogos.map(([name, file, width]) => (
          <span className="payment-logo" key={name} title={name}>
            <Image
              src={`/images/payments/${file}`}
              alt={name}
              width={width}
              height={24}
            />
          </span>
        ))}
      </div>
    </footer>
  );
}
