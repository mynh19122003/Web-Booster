export function HowItWorks() {
  return (
    <section className="section steps">
      <div className="container">
        <p className="eyebrow">LESS FRICTION. MORE PROGRESSION.</p>
        <h2>
          Three steps. <span className="muted">One direction.</span>
        </h2>
        <div className="steps-grid">
          <div className="step-line" />
          {[
            [
              "01",
              "Choose your arena",
              "Find your game. Discover what’s possible.",
            ],
            [
              "02",
              "Make it personal",
              "Choose your ranks, region, and the way you play.",
            ],
            [
              "03",
              "Enjoy the climb",
              "Save your demo plan and explore the tracking experience.",
            ],
          ].map(([n, title, text]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
