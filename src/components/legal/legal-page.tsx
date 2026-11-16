import Link from "next/link";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export function LegalPage({
  title,
  description,
  effectiveDate,
  sections,
}: {
  title: string;
  description: string;
  effectiveDate: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-neutral-50 px-5 py-12 sm:py-16">
      <article className="mx-auto max-w-4xl">
        <Link
          href="/"
          className="inline-flex items-center text-xl font-bold tracking-tight text-neutral-950"
        >
          Attend<span className="text-violet-600">.</span>
        </Link>

        <header className="mt-12 border-b border-neutral-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
            Attend Legal
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
            {description}
          </p>

          <p className="mt-5 text-sm text-neutral-500">
            Effective date: {effectiveDate}
          </p>
        </header>

        <div className="prose prose-neutral mt-10 max-w-none">
          {sections.map((section, index) => (
            <section
              key={section.title}
              className="border-b border-neutral-200 py-7 last:border-0"
            >
              <h2 className="text-xl font-semibold tracking-tight text-neutral-950">
                {index + 1}. {section.title}
              </h2>

              {section.paragraphs?.map((paragraph, paragraphIndex) => (
                <p
                  key={paragraphIndex}
                  className="mt-3 text-sm leading-7 text-neutral-600"
                >
                  {paragraph}
                </p>
              ))}

              {section.bullets && (
                <ul className="mt-4 list-disc space-y-2 pl-6">
                  {section.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="text-sm leading-7 text-neutral-600"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-10 rounded-2xl border border-neutral-200 bg-white p-6">
          <h2 className="font-semibold text-neutral-950">
            Questions or concerns?
          </h2>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            Contact the Attend team for questions about this document or your
            use of the platform.
          </p>

          <a
            href="mailto:attendplatform@gmail.com"
            className="mt-3 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-700"
          >
            attendplatform@gmail.com
          </a>

          <div className="mt-6 flex flex-wrap gap-5 border-t border-neutral-100 pt-5 text-sm">
            <Link href="/terms" className="text-neutral-500 hover:text-violet-600">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-neutral-500 hover:text-violet-600">
              Privacy Policy
            </Link>
            <Link href="/" className="text-neutral-500 hover:text-violet-600">
              Back to Attend
            </Link>
          </div>
        </footer>
      </article>
    </div>
  );
}