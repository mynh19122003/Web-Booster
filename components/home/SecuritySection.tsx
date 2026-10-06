import {
  ShieldCheck,
  LockKeyhole,
  EyeOff,
  Fingerprint,
  Check,
} from "lucide-react";
export function SecuritySection() {
  return (
    <section className="section security-section">
      <div className="container split-section">
        <div className="security-diagram" aria-hidden="true">
          <div className="security-orbit orbit-one" />
          <div className="security-orbit orbit-two" />
          <div className="security-shield">
            <ShieldCheck size={75} strokeWidth={1} />
          </div>
          <span className="security-node node-1">
            <LockKeyhole /> ENCRYPTED
          </span>
          <span className="security-node node-2">
            <Fingerprint /> VERIFIED
          </span>
          <span className="security-node node-3">
            <EyeOff /> PRIVATE
          </span>
          <span className="security-node node-4">
            <ShieldCheck /> PROTECTED
          </span>
        </div>
        <div data-reveal>
          <p className="eyebrow">CONFIDENCE AT EVERY STEP</p>
          <h2>
            Your journey.
            <br />
            <span className="gradient-text">Your peace of mind.</span>
          </h2>
          <p>
            Clarity comes first. See your plan, understand the process,
            <br />
            and stay in control of your experience.
          </p>
          <ul className="security-list">
            <li>
              <Check /> SSL Encrypted payments & data
            </li>
            <li>
              <Check /> Dedicated regional VPN & offline presence
            </li>
            <li>
              <Check /> Zero credentials shared with third parties
            </li>
            <li>
              <Check /> 100% Money-back guarantee
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
