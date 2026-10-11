import Image from "next/image";
import { games } from "@/data/games";

export function GameIdentity({ game }: { game: string }) {
  const info = games.find(item => item.slug === game);
  if (!info) return null;
  return <span className="game-identity"><Image src={info.logo} alt="" width={36} height={36} /><strong>{info.name}</strong></span>;
}
