import DiscoverHub from "@/components/discover/DiscoverHub";
import { getActiveFeaturedEvents } from "@/services/promotions.service";

export default async function DiscoverPage() {
  const featuredEvents = await getActiveFeaturedEvents("discover");

  return <DiscoverHub initialFeaturedEvents={featuredEvents} />;
}
