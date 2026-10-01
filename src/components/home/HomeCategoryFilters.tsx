import type { Category } from "@/types/home";

type Props = {
  categories: Category[];
  activeCategory: string;
  onSelectCategory: (slug: string) => void;
};

export function HomeCategoryFilters({
  categories,
  activeCategory,
  onSelectCategory,
}: Props) {
  return (
    <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => {
        const active = activeCategory === category.slug;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.slug)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            }`}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
