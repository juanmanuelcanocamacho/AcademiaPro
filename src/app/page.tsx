import { auth } from "@/../auth";
import LandingClient from "@/components/landing/LandingClient";

export default async function Home() {
  const session = await auth();

  return <LandingClient session={session} />;
}
