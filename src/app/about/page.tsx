import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/navigation/footer";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  HeartHandshake,
  Image as ImageIcon,
  Mail,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Attend | Discover. Create. Share.",
  description:
    "Get to know Attend: our purpose, what you can do on the platform, the team behind it, and how to get in touch.",
  openGraph: {
    title: "About Attend",
    description:
      "A place to discover events, bring people together and create experiences worth sharing.",
  },
};

const team = [
  {
    name: "Odinaka",
    role: "Project Lead",
    description:
      "Guides Attend's product direction, priorities and overall execution.",
    initials: "O",
  },
  {
    name: "Promise",
    role: "Community & Operations Manager",
    description:
      "Focuses on the community experience and the day-to-day operations that keep things moving.",
    initials: "P",
  },
  {
    name: "Sanaullah",
    role: "Technical Lead",
    description:
      "Leads the engineering work behind Attend's platform and technical direction.",
    initials: "S",
  },
  {
    name: "Chidera",
    role: "Senior Marketing Officer",
    description:
      "Leads marketing efforts and helps more people discover what they can do with Attend.",
    initials: "C",
  },
];

const values = [
  {
    title: "Community first",
    description:
      "We believe events are about people. We want to make it easier for people to find each other and take part.",
    icon: HeartHandshake,
  },
  {
    title: "Make participation meaningful",
    description:
      "Finding an event is only the beginning. We want the moments around it to be easy to join, celebrate and share.",
    icon: Users,
  },
  {
    title: "Creativity belongs to everyone",
    description:
      "Personalized campaign graphics give people another way to express themselves and be part of an event.",
    icon: ImageIcon,
  },
  {
    title: "Keep things simple",
    description:
      "Useful tools should feel approachable, whether you are organizing an event or deciding what to attend.",
    icon: Sparkles,
  },
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-neutral-100 bg-gradient-to-br from-violet-50 via-white to-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              A little about us
            </div>
            <h1 className="text-5xl font-semibold tracking-[-0.05em] text-neutral-950 sm:text-6xl lg:text-7xl">
              Events bring us together.
              <span className="mt-2 block text-violet-600">
                Attend makes it easier to be part of them.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-neutral-600 sm:text-lg">
              Attend is a platform built around the experience of events: from
              discovering something worth showing up for, to creating an event,
              participating in campaigns and sharing the moments that matter.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
              >
                Explore events <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/create"
                className="rounded-full border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-neutral-50"
              >
                Create an event
              </Link>
            </div>
          </div>
          <div className="mt-16 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Compass, title: "Discover", text: "Find events and experiences to explore." },
              { icon: CalendarDays, title: "Create", text: "Bring your event idea to life." },
              { icon: ImageIcon, title: "Share", text: "Join campaigns and share your participation." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-white bg-white/80 p-5 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  <item.icon className="h-5 w-5" />
                </div>
                <h2 className="font-semibold text-neutral-950">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-500">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:py-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Why Attend</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            More than finding an event.
          </h2>
        </div>
        <div className="space-y-5 text-base leading-8 text-neutral-600">
          <p>
            Events create opportunities to learn, connect, celebrate and build
            community. But the experience can feel scattered: discovering
            events in one place, getting information somewhere else, and sharing
            the excitement on another platform.
          </p>
          <p>
            Attend brings these parts of the experience closer together. It
            gives attendees a place to explore events and participate, while
            giving organizers tools to present their events and invite people
            into the experience.
          </p>
          <p>
            We are building thoughtfully, listening as we go and improving the
            platform around the real needs of the people who use it.
          </p>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">Our direction</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Our mission and vision
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl bg-neutral-950 p-8 text-white sm:p-10">
              <p className="text-sm font-semibold text-violet-300">OUR MISSION</p>
              <h3 className="mt-5 text-2xl font-semibold leading-snug sm:text-3xl">
                Make it easier for people to discover, create and participate in experiences that bring communities together.
              </h3>
            </div>
            <div className="rounded-3xl border border-neutral-200 bg-white p-8 sm:p-10">
              <p className="text-sm font-semibold text-violet-600">OUR VISION</p>
              <h3 className="mt-5 text-2xl font-semibold leading-snug text-neutral-950 sm:text-3xl">
                A connected event community where great experiences are easier to find, shape and share.
              </h3>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">What guides us</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
            The principles behind the platform
          </h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <article key={value.title} className="rounded-2xl border border-neutral-200 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <value.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold text-neutral-950">{value.title}</h3>
              <p className="mt-2 text-sm leading-6 text-neutral-500">{value.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-neutral-100 bg-violet-50/50">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-600">The people behind Attend</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
              Meet the team
            </h2>
            <p className="mt-4 leading-7 text-neutral-600">
              Attend is shaped by a team working across product, operations,
              technology and marketing: bringing different skills together to
              build a better event experience.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((member) => (
              <article key={member.name} className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-violet-200 text-xl font-semibold text-violet-700">
                  {member.initials}
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">
                  {member.role}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-neutral-950">{member.name}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-500">{member.description}</p>
              </article>
            ))}
          </div>
        
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-6 lg:py-24">
        <div className="flex flex-col gap-8 rounded-[2rem] bg-neutral-950 px-7 py-10 text-white sm:px-10 sm:py-14 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-violet-300">LET&apos;S CONNECT</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Have a question, idea or feedback?
            </h2>
            <p className="mt-4 leading-7 text-neutral-400">
              We would like to hear from you. Reach out to the Attend team and
              tell us what is on your mind.
            </p>
            <a
              href="mailto:attendplatform@gmail.com"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              <Mail className="h-4 w-4" />
              attendplatform@gmail.com
            </a>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Link href="/discover" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100">
              Discover Attend <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
