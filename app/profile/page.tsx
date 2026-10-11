import type { Metadata } from "next";
import { ProfileSettings } from "@/components/account/ProfileSettings";
export const metadata: Metadata = { title: "Profile settings", description: "Manage your ASCEND account profile and contact details." };
export default function ProfilePage() { return <div className="section profile-settings-page"><ProfileSettings /></div>; }
