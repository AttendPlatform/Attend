export type DateFilterOption =
  | "all"
  | "today"
  | "this_weekend"
  | "this_week"
  | "this_month";

export type LocationFilterMode = "all" | "near_me" | "online" | "city";

export type DiscoverSortOption = "upcoming" | "popular" | "nearest";

export interface DiscoverDateRange {
  start: string;
  end: string;
}

export interface DiscoverCategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface DiscoverFilters {
  search?: string;
  dateFilter?: DateFilterOption;
  city?: string;
  isOnline?: boolean;
  categoryId?: string;
  nearMe?: boolean;
  userCoordinates?: {
    latitude: number;
    longitude: number;
  } | null;
  sortBy?: DiscoverSortOption;
}

export interface DiscoverFilterBarProps {
  filters: DiscoverFilters;
  onFiltersChange: (nextFilters: DiscoverFilters) => void;
  categories?: DiscoverCategoryItem[];
  availableCities?: string[];
  isPending?: boolean;
  className?: string;
}

export const NIGERIAN_DISCOVER_CITIES: readonly string[] = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
  "Enugu",
  "Benin City",
  "Kano",
  "Kaduna",
];

export const DATE_FILTER_OPTIONS: readonly {
  value: DateFilterOption;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "this_weekend", label: "This Weekend" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
];

export function resolveDateFilterRange(
  filter?: DateFilterOption,
  referenceDate: Date = new Date()
): DiscoverDateRange | null {
  if (!filter || filter === "all") {
    return null;
  }

  const now = new Date(referenceDate.getTime());

  switch (filter) {
    case "today": {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }

    case "this_weekend": {
      const day = now.getDay();
      let diffToFriday = 0;

      if (day === 0) {
        diffToFriday = -2;
      } else if (day === 6) {
        diffToFriday = -1;
      } else if (day === 5) {
        diffToFriday = 0;
      } else {
        diffToFriday = 5 - day;
      }

      const friday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + diffToFriday,
        0,
        0,
        0,
        0
      );

      const sunday = new Date(
        friday.getFullYear(),
        friday.getMonth(),
        friday.getDate() + 2,
        23,
        59,
        59,
        999
      );

      return {
        start: friday.toISOString(),
        end: sunday.toISOString(),
      };
    }

    case "this_week": {
      const day = now.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const monday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + diffToMonday,
        0,
        0,
        0,
        0
      );

      const sunday = new Date(
        monday.getFullYear(),
        monday.getMonth(),
        monday.getDate() + 6,
        23,
        59,
        59,
        999
      );

      return {
        start: monday.toISOString(),
        end: sunday.toISOString(),
      };
    }

    case "this_month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      };
    }

    default:
      return null;
  }
}

export function parseDiscoverFiltersFromSearchParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): DiscoverFilters {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    const val = searchParams[key];
    if (Array.isArray(val)) {
      return val[0];
    }
    return val || undefined;
  };

  const rawSearch = getParam("q") || getParam("search");
  const rawCity = getParam("city");
  const rawDate = getParam("date");
  const rawCategory = getParam("category") || getParam("categoryId");
  const rawOnline = getParam("online") || getParam("isOnline");
  const rawNearMe = getParam("near_me") || getParam("nearMe");
  const rawSort = getParam("sort") || getParam("sortBy");

  const validDateFilters: DateFilterOption[] = [
    "all",
    "today",
    "this_weekend",
    "this_week",
    "this_month",
  ];

  const validSortOptions: DiscoverSortOption[] = ["upcoming", "popular", "nearest"];

  const dateFilter = validDateFilters.includes(rawDate as DateFilterOption)
    ? (rawDate as DateFilterOption)
    : undefined;

  const sortBy = validSortOptions.includes(rawSort as DiscoverSortOption)
    ? (rawSort as DiscoverSortOption)
    : undefined;

  const isOnline = rawOnline !== undefined ? rawOnline === "true" || rawOnline === "1" : undefined;
  const nearMe = rawNearMe !== undefined ? rawNearMe === "true" || rawNearMe === "1" : undefined;

  return {
    search: rawSearch?.trim() ? rawSearch.trim() : undefined,
    city: rawCity?.trim() ? rawCity.trim() : undefined,
    dateFilter,
    categoryId: rawCategory?.trim() ? rawCategory.trim() : undefined,
    isOnline,
    nearMe,
    sortBy,
  };
}

export function serializeDiscoverFiltersToSearchParams(
  filters: DiscoverFilters
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search && filters.search.trim()) {
    params.set("q", filters.search.trim());
  }

  if (filters.city && filters.city.trim()) {
    params.set("city", filters.city.trim());
  }

  if (filters.dateFilter && filters.dateFilter !== "all") {
    params.set("date", filters.dateFilter);
  }

  if (filters.categoryId && filters.categoryId.trim()) {
    params.set("category", filters.categoryId.trim());
  }

  if (typeof filters.isOnline === "boolean") {
    params.set("online", filters.isOnline ? "true" : "false");
  }

  if (typeof filters.nearMe === "boolean" && filters.nearMe) {
    params.set("near_me", "true");
  }

  if (filters.sortBy && filters.sortBy !== "upcoming") {
    params.set("sort", filters.sortBy);
  }

  return params;
}
