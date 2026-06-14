import { LiveHomepage } from "@/components/live-homepage";
import { getPlaylist } from "@/lib/playlist";

export const dynamic = "force-dynamic";

export default async function Home() {
  const channels = await getPlaylist();

  return <LiveHomepage channels={channels} />;
}
