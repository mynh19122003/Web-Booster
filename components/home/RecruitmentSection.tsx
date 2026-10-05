import Link from "next/link";
import { ArrowUpRight, Trophy, Clock3, Users } from "lucide-react";
import { RecruitmentForm } from "@/components/careers/RecruitmentForm";
export function RecruitmentSection() {
  return (
    <section className="section recruitment-section" id="careers">
      <div className="container recruitment-layout">
        <div>
          <p className="eyebrow">PLAY WITH PURPOSE</p>
          <h2>
            Join the <span className="muted">Ascend team.</span>
          </h2>
          <p>
            Bring your experience in League of Legends, Valorant or TFT. Help
            players make their next breakthrough.
          </p>
          <ul className="recruitment-benefits">
            <li>
              <Trophy size={18} /> Players and coaches across LoL, Valorant and TFT
            </li>
            <li>
              <Clock3 size={18} /> Include your available hours and time zone
            </li>
            <li>
              <Users size={18} /> Share your rank and relevant experience
            </li>
          </ul>
          <p className="recruitment-context">No minimum rank or regional restrictions are published yet. This application is a local preview.</p>
          <Link className="text-link" href="/careers">
            View recruitment <ArrowUpRight size={17} />
          </Link>
        </div>
        <RecruitmentForm />
      </div>
    </section>
  );
}
