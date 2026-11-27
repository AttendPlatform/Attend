import DiscoverHub from "@/components/discover/DiscoverHub";
import {
  getActiveBannersForPlacement,
  getActiveFeaturedEvents,
} from "@/services/promotions.service";

export default async function DiscoverPage() {
  const [featuredEvents, discoverBanners] = await Promise.all([
    getActiveFeaturedEvents("discover"),
    getActiveBannersForPlacement("discover"),
  ]);

  return (
    <DiscoverHub
      initialFeaturedEvents={featuredEvents}
      initialBanners={discoverBanners}
    />
  );
}
