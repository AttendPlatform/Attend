"use client";

import { useEffect, useState } from "react";
import {
  Briefcase,
  Calendar,
  ChevronDown,
  Church,
  Cpu,
  GraduationCap,
  LoaderCircle,
  MapPin,
  Music,
  Search,
  Trophy,
} from "lucide-react";
import {
  DATE_FILTER_OPTIONS,
  NIGERIAN_DISCOVER_CITIES,
  type DateFilterOption,
  type DiscoverCategoryItem,
  type DiscoverFilters,
} from "@/types/discover";

interface DiscoverFilterBarProps {
  filters: DiscoverFilters;
  onFiltersChange: (filters: DiscoverFilters) => void;
  categories: DiscoverCategoryItem[];
  isPending?: boolean;
}

const FIGMA_CATEGORIES = [
  { name: "Business", slug: "business", icon: Briefcase },
  { name: "Religion", slug: "church", aliasSlugs: ["religion", "church"], icon: Church },
  { name: "Education", slug: "education", icon: GraduationCap },
  { name: "Technology", slug: "technology", aliasSlugs: ["tech", "technology"], icon: Cpu },
  { name: "Entertainment", slug: "music", aliasSlugs: ["music", "entertainment"], icon: Music },
  { name: "Sports", slug: "sports", icon: Trophy },
];

export function DiscoverFilterBar({
  filters,
  onFiltersChange,
  categories,
  isPending = false,
}: DiscoverFilterBarProps) {
  const [search, setSearch] = useState(filters.search ?? "");
  const [locationError, setLocationError] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => setSearch(filters.search ?? ""), [filters.search]);

  useEffect(() => {
    if (!filters.nearMe || filters.userCoordinates) return;
    if (!navigator.geolocation) {
      onFiltersChange({ ...filters, nearMe: false, sortBy: "upcoming" });
      setLocationError("Location is not available in this browser. Showing upcoming events instead.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onFiltersChange({
          ...filters,
          userCoordinates: { latitude: coords.latitude, longitude: coords.longitude },
        });
        setLocating(false);
      },
      () => {
        onFiltersChange({ ...filters, nearMe: false, sortBy: "upcoming" });
        setLocationError("Location permission was denied. Showing upcoming events instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [filters.nearMe, filters.userCoordinates, onFiltersChange]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search.trim() !== (filters.search ?? "")) {
        onFiltersChange({ ...filters, search: search.trim() || undefined });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, filters, onFiltersChange]);

  const selectedLocation = filters.nearMe
    ? "near_me"
    : filters.isOnline
      ? "online"
      : filters.city
        ? filters.city
        : "all";

  function setLocation(value: string) {
    setLocationError("");
    if (value === "near_me") {
      if (!navigator.geolocation) {
        setLocationError("Location is not available in this browser.");
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          onFiltersChange({
            ...filters,
            city: undefined,
            isOnline: undefined,
            nearMe: true,
            sortBy: "nearest",
            userCoordinates: { latitude: coords.latitude, longitude: coords.longitude },
          });
          setLocating(false);
        },
        () => {
          setLocationError("Location permission was denied. Choose a city or all locations instead.");
          setLocating(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
      );
      return;
    }

    onFiltersChange({
      ...filters,
      city: value === "all" || value === "online" ? undefined : value,
      isOnline: value === "online" ? true : undefined,
      nearMe: false,
      userCoordinates: undefined,
      sortBy: value === "all" ? "upcoming" : filters.sortBy,
    });
  }

  const locationDisplayLabel = filters.nearMe
    ? "Near me"
    : filters.isOnline
      ? "Online"
      : filters.city || "Lagos";

  const activeDateOption = DATE_FILTER_OPTIONS.find((opt) => opt.value === filters.dateFilter);
  const dateDisplayLabel = activeDateOption ? activeDateOption.label : "Today";

  return (
    <div className="space-y-2.5 sm:space-y-3" aria-busy={isPending}>
      {/* 1. PILL SEARCH BAR (Figma Discover / Default) */}
      <div className="relative">
        <label className="relative block w-full">
          <span className="sr-only">Search events, campaigns, hosts</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events, campaigns, hosts"
            className="h-11 sm:h-12 w-full rounded-full border border-neutral-200 bg-white pl-11 pr-5 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
      </div>

      {/* 2. COMPACT FILTER BUTTONS ROW (City ⌵, Date ⌵, Free Toggle) */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* LOCATION DROPDOWN PILL */}
          <div className="relative inline-block">
            <button
              type="button"
              className="pointer-events-none flex h-8 sm:h-8.5 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 shadow-sm"
            >
              {locating ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin text-violet-600" />
              ) : (
                <MapPin className="h-3.5 w-3.5 text-neutral-500" />
              )}
              <span>{locationDisplayLabel}</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>
            <select
              value={selectedLocation}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Filter by location"
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="all">All locations</option>
              <option value="near_me">Near me</option>
              <option value="online">Online events</option>
              <optgroup label="Nigerian cities">
                {NIGERIAN_DISCOVER_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* DATE DROPDOWN PILL */}
          <div className="relative inline-block">
            <button
              type="button"
              className="pointer-events-none flex h-8 sm:h-8.5 items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 shadow-sm"
            >
              <Calendar className="h-3.5 w-3.5 text-neutral-500" />
              <span>{dateDisplayLabel}</span>
              <ChevronDown className="h-3 w-3 text-neutral-400" />
            </button>
            <select
              value={filters.dateFilter ?? "all"}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFilter: e.target.value as DateFilterOption,
                })
              }
              aria-label="Filter by date range"
              className="absolute inset-0 cursor-pointer opacity-0"
            >
              <option value="all">All dates</option>
              <option value="today">Today</option>
              <option value="this_weekend">This Weekend</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>
        </div>

        {/* FREE EVENT TOGGLE SWITCH */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-600">Free</span>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(filters.isFree)}
            aria-label="Filter for free events"
            onClick={() => onFiltersChange({ ...filters, isFree: !filters.isFree })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1 ${
              filters.isFree ? "bg-violet-600" : "bg-neutral-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                filters.isFree ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. CATEGORY ICONS ROW (Circular icon buttons with labels below) */}
      <div
        className="flex items-center justify-between gap-2.5 overflow-x-auto py-1 sm:py-1.5 no-scrollbar sm:justify-start sm:gap-6"
        aria-label="Filter by category"
      >
        {FIGMA_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const matchedCategory = categories.find(
            (c) =>
              c.slug === cat.slug ||
              (cat.aliasSlugs && cat.aliasSlugs.includes(c.slug)) ||
              c.name.toLowerCase() === cat.name.toLowerCase()
          );
          const isSelected = Boolean(matchedCategory && filters.categoryId === matchedCategory.id);

          return (
            <button
              key={cat.name}
              type="button"
              aria-pressed={isSelected}
              onClick={() => {
                if (isSelected) {
                  onFiltersChange({ ...filters, categoryId: undefined });
                } else if (matchedCategory) {
                  onFiltersChange({ ...filters, categoryId: matchedCategory.id });
                }
              }}
              className="group flex flex-col items-center gap-1 focus:outline-none"
            >
              <div
                className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border transition-all duration-200 ${
                  isSelected
                    ? "border-violet-600 bg-violet-600 text-white shadow-md shadow-violet-200 scale-105"
                    : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  isSelected ? "font-semibold text-violet-700" : "text-neutral-600 group-hover:text-neutral-900"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>

      {locationError && <p role="status" className="text-xs text-amber-700">{locationError}</p>}
    </div>
  );
}
