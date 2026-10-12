import { CartPage } from "@/components/account/Cart";
import { privateRobots } from "@/lib/seo";
export const metadata = { title: "Your cart", robots: privateRobots };
export default function Page() { return <CartPage />; }
