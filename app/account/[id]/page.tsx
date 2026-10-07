import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { demoShopAccounts, type ShopAccount } from "@/data/shop-accounts";
import { BoostRoyalAccountView } from "@/components/account/BoostRoyalAccountView";

type Props = { params: Promise<{ id: string }> };
const referenceAccount: ShopAccount = {
  id: "109084", game: "league-of-legends", title: "Mid lane collection", rank: "Diamond", division: "I", server: "NA", level: 146,
  champions: 29, skins: 3, essence: 2990, points: 350,
  ownedChampions: ["Ahri", "Amumu", "Anivia", "Annie", "Ashe", "Brand", "Caitlyn", "Darius", "Ekko", "Ezreal", "Garen", "Jarvan IV", "Kindred", "Kog'Maw", "Lee Sin", "Lillia", "Lux", "Master Yi", "Miss Fortune", "Nocturne", "Nunu & Willump", "Riven", "Samira", "Sejuani", "Thresh", "Tryndamere", "Vi", "Xin Zhao", "Ziggs"],
  cosmetics: ["Victorious Tryndamere", "Victorious Kog'Maw", "Victorious Anivia"], lpGain: 23, price: 343.99, tags: ["Mid", "Collection"], items: ["Tryndamere", "Kog'Maw", "Anivia"],
};
function getAccount(id: string) {
  return demoShopAccounts.find((account) => account.id === id) ?? (id === referenceAccount.id ? referenceAccount : undefined);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const account = getAccount(id);
  const gameName = account?.game === "valorant" ? "Valorant" : account?.game === "teamfight-tactics" ? "Teamfight Tactics" : "League of Legends";
  return { title: account ? `${gameName} Account #${account.id}` : "Account not found" };
}

export default async function AccountListingPage({ params }: Props) {
  const { id } = await params;
  const account = getAccount(id);
  if (!account) notFound();
  return (
    <Suspense fallback={null}>
      <BoostRoyalAccountView account={account} />
    </Suspense>
  );
}
