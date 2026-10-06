import { Be_Vietnam_Pro, Sora } from "next/font/google";
export const adminFont = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-admin",
});

// The employee preview retains its existing Sora font.
export const vietnameseAdminFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-admin",
});
