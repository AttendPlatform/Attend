"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, MapPin, Search } from "lucide-react";
import {
  DATE_FILTER_OPTIONS,
  NIGERIAN_DISCOVER_CITIES,
  type DiscoverCategoryItem,
  type DiscoverFilters,
} from "@/types/discover";

interface DiscoverFilterBarProps {
  filters: DiscoverFilters;
  onFiltersChange: (filters: DiscoverFilters) => void;
  categories: DiscoverCategoryItem[];
  isPending?: boolean;
}

export function DiscoverFilterBar({ filters, onFiltersChange, categories, isPending = false }: DiscoverFilterBarProps) {
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
        onFiltersChange({ ...filters, userCoordinates: { latitude: coords.latitude, longitude: coords.longitude } });
        setLocating(false);
      },
      () => {
        onFiltersChange({ ...filters, nearMe: false, sortBy: "upcoming" });
        setLocationError("Location permission was denied. Showing upcoming events instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
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
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
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

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5" aria-busy={isPending}>
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px]">
        <label className="relative block">
          <span className="sr-only">Search events, campaigns, and organizers</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search events, campaigns, organizers..."
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="relative block">
          <span className="sr-only">Filter by location</span>
          {locating ? <LoaderCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-violet-600" /> : <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />}
          <select
            value={selectedLocation}
            onChange={(event) => setLocation(event.target.value)}
            className="h-11 w-full appearance-none rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
          >
            <option value="all">All locations</option>
            <option value="near_me">Near me</option>
            <option value="online">Online events</option>
            <optgroup label="Nigerian cities">
              {NIGERIAN_DISCOVER_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}
            </optgroup>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Filter by date">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Date</span>
        {DATE_FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={(filters.dateFilter ?? "all") === value}
            onClick={() => onFiltersChange({ ...filters, dateFilter: value })}
            className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${(filters.dateFilter ?? "all") === value ? "bg-violet-600 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-violet-50 hover:text-violet-700"}`}
          >{label}</button>
        ))}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3" aria-label="Filter by category">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Category</span>
          <button type="button" aria-pressed={!filters.categoryId} onClick={() => onFiltersChange({ ...filters, categoryId: undefined })} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${!filters.categoryId ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>All</button>
          {categories.map((category) => (
            <button key={category.id} type="button" aria-pressed={filters.categoryId === category.id} onClick={() => onFiltersChange({ ...filters, categoryId: category.id })} className={`rounded-full px-3.5 py-2 text-xs font-semibold transition ${filters.categoryId === category.id ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"}`}>
              {category.name}
            </button>
          ))}
        </div>
      )}
      {locationError && <p role="status" className="text-xs text-amber-700">{locationError}</p>}
    </div>
  );
}
