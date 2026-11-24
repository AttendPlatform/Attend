import type { Metadata } from "next";
import { Footer } from "@/components/navigation/footer";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | Attend",
  description:
    "Read the terms and conditions governing your use of Attend.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections: LegalSection[] = [
  {
    title: "Introduction",
    paragraphs: [
      "Welcome to Attend. Attend is an event discovery, creation, promotion, and participation platform that helps people discover events, connect with communities, create events, and participate in campaigns.",
      "These Terms of Service govern your access to and use of the Attend website, applications, features, and related services (collectively, the Platform). By creating an account or using Attend, you agree to these Terms and our Privacy Policy. If you do not agree, please do not use the Platform.",
    ],
  },
  {
    title: "About Attend and its operator",
    paragraphs: [
      "Attend is currently operated by Odinaka Ogbonna, an individual based in Nigeria, pending formal business registration. Attend is not currently represented as a registered company or separate legal entity.",
      "Attend provides technology and tools that connect event organisers with people interested in discovering and participating in events. Unless expressly stated otherwise, Attend is not the organiser, venue owner, promoter, or operator of events created by independent users.",
    ],
  },
  {
    title: "Platform features",
    paragraphs: ["Depending on availability, Attend may allow you to:"],
    bullets: [
      "Discover and explore public events.",
      "Create, publish, manage, and promote events.",
      "Register for events or indicate your intention to attend.",
      "Discover, create, and participate in campaigns associated with events.",
      "Create, upload, customise, and share campaign graphics and other content.",
      "Save events and campaigns independently.",
      "Receive event updates and notifications.",
      "Interact with other users and communities through available features.",
    ],
  },
  {
    title: "Eligibility and accounts",
    paragraphs: [
      "You must provide accurate information when creating an account and keep your information reasonably up to date. You are responsible for maintaining the confidentiality of your login credentials and for activity carried out through your account.",
      "You must notify us promptly if you suspect that your account has been accessed without permission. You must not impersonate another person, create fraudulent accounts, or use another person's identity without authorisation.",
      "Attend is not intended for independent account use by children under 18. Where a minor is permitted to attend an event, the relevant parent or legal guardian and event organiser are responsible for ensuring appropriate consent, supervision, and compliance with applicable laws.",
    ],
  },
  {
    title: "Acceptable use",
    paragraphs: ["You agree not to use Attend to:"],
    bullets: [
      "Publish false, misleading, fraudulent, or deceptive information.",
      "Organise or promote illegal activities.",
      "Harass, threaten, exploit, discriminate against, or intimidate others.",
      "Upload content that infringes copyright, trademark, privacy, or other rights.",
      "Upload malware or attempt to compromise the Platform.",
      "Access another user's account or private information without permission.",
      "Manipulate registrations, attendance figures, campaign participation, or engagement.",
      "Use bots, scraping tools, or automated methods to misuse the Platform.",
      "Send spam, conduct scams, impersonate others, or interfere with Platform operations.",
    ],
  },
  {
    title: "Responsibilities of event organisers",
    paragraphs: [
      "Users who create or manage events are responsible for the events they publish and the commitments they make to attendees.",
      "By publishing an event, you confirm that you have the authority and permissions required to organise and promote it. You are responsible for ensuring that event details are accurate, obtaining required permits and venue approvals, complying with applicable laws, and communicating material changes or cancellations to participants.",
      "Organisers are responsible for event safety, delivery, entry requirements, pricing, and any refund or cancellation conditions they communicate. Organisers must handle attendee information lawfully and must not misuse it for unrelated marketing or disclose it without an appropriate lawful basis.",
      "Attend may review, restrict, or remove an event that violates these Terms, applicable law, or presents a reasonable risk to users or the Platform.",
    ],
  },
  {
    title: "Attendees and participation",
    paragraphs: [
      "When you register for, save, or participate in an event, you are responsible for reviewing the event details and any additional conditions provided by the organiser.",
      "Registration or an expression of interest does not necessarily guarantee admission. Unless Attend expressly states otherwise, the event organiser is responsible for delivering the event and determining event-specific entry requirements.",
      "You must comply with reasonable event rules and applicable laws. Nothing in these Terms removes rights or remedies available to you under applicable consumer protection law.",
    ],
  },
  {
    title: "Campaigns and user-generated content",
    paragraphs: [
      "Attend may allow event organisers and participants to create or participate in campaigns connected to events.",
      "You retain ownership of content you create and upload, subject to the rights of other people whose work appears in it. You must own or have permission to use the photographs, videos, logos, music, artwork, and other materials you submit.",
      "By uploading content, you grant Attend a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, display, distribute, and technically adapt that content only as reasonably necessary to operate the Platform, provide the features you use, display content to your chosen audience, support campaign participation, maintain security, and promote Attend or the relevant event or campaign where your content is public or you have otherwise authorised that use.",
      "This licence lasts for as long as reasonably necessary for those purposes, subject to deletion requests, withdrawal where applicable, and legal-retention requirements.",
      "You must not upload unlawful, abusive, discriminatory, deceptive, infringing, exploitative, or otherwise prohibited content. You must not use another person's image or personal information without appropriate permission or another lawful basis.",
    ],
  },
  {
    title: "Attend intellectual property",
    paragraphs: [
      "The Attend name, logo, branding, software, interface, design elements, and original Platform materials belong to or are licensed to Attend, except for third-party materials and user-generated content.",
      "You may use the Platform for its intended purposes. You may not copy, reproduce, distribute, modify, sell, reverse engineer, or commercially exploit Attend's intellectual property without prior written permission, except where applicable law permits it.",
    ],
  },
  {
    title: "Payments, tickets, and refunds",
    paragraphs: [
      "Some events or services may involve registration fees, paid tickets, or other payments where these features are made available.",
      "Before making a payment, review the displayed price, applicable fees, event conditions, and refund or cancellation policy. Where a third-party payment provider is used, that provider may process payment information under its own terms and privacy policy.",
      "Event organisers remain responsible for accurately describing events and fulfilling their event-related obligations. Refunds and cancellations are subject to the applicable event terms, payment arrangements, and mandatory consumer protection laws.",
      "Attend will not represent a payment as successful unless the relevant payment system confirms it. Nothing in these Terms excludes consumer rights that cannot lawfully be excluded.",
    ],
  },
  {
    title: "Notifications and communications",
    paragraphs: [
      "Attend may send account verification messages, security alerts, registration confirmations, event updates, campaign updates, cancellation notices, and important Platform announcements.",
      "Where available, you may manage notification preferences through your account or device settings. Optional marketing communications will be handled in accordance with applicable law and your preferences.",
    ],
  },
  {
    title: "Third-party services",
    paragraphs: [
      "Attend may rely on third-party providers for hosting, authentication, maps, email delivery, storage, payment processing, and other functions. The Platform may also link to external websites, ticketing services, venues, and organiser pages.",
      "Third-party services operate under their own terms and privacy policies. Attend is not responsible for their independent operation, content, security, or policies, subject to any responsibility that applicable law places on Attend.",
    ],
  },
  {
    title: "Platform availability and changes",
    paragraphs: [
      "We aim to keep Attend available and reliable but do not guarantee uninterrupted or error-free access. The Platform may be unavailable because of maintenance, updates, technical failures, security incidents, or circumstances beyond our reasonable control.",
      "We may add, modify, suspend, or discontinue features as Attend develops. Where a change materially affects users, we will take reasonable steps to communicate it.",
    ],
  },
  {
    title: "Suspension and termination",
    paragraphs: [
      "You may stop using Attend and request account deletion by contacting attendplatform@gmail.com.",
      "We may suspend, restrict, or terminate an account where reasonably necessary because of a breach of these Terms, suspected fraud or abuse, a security or safety concern, a legal requirement, or conduct that materially harms users or the Platform.",
      "Where appropriate, we will provide notice and an opportunity to address the issue. Immediate action may be necessary where there is a serious risk or legal obligation. Termination does not remove obligations or liabilities that arose before termination.",
    ],
  },
  {
    title: "Disclaimers and liability",
    paragraphs: [
      "Attend provides tools for discovering, organising, promoting, and participating in events. We do not guarantee that every event, organiser, participant, campaign, or user-submitted item is accurate, safe, lawful, or reliable.",
      "To the extent permitted by applicable law, Attend is not responsible for the independent conduct of event organisers, venues, attendees, or other third parties, or for events that are cancelled, changed, poorly delivered, or not delivered by their organisers.",
      "Attend does not exclude or limit liability where doing so would be unlawful. Nothing in these Terms limits statutory rights or liabilities that cannot legally be excluded, including rights under applicable consumer protection law.",
    ],
  },
  {
    title: "Privacy",
    paragraphs: [
      "Your use of Attend is also governed by our Privacy Policy. It explains how personal information is collected, used, stored, shared, and protected.",
    ],
  },
  {
    title: "Changes to these Terms",
    paragraphs: [
      "We may update these Terms as Attend develops or where legal, security, or operational changes make updates necessary. The latest version will be published on the Platform with its updated date.",
      "Where a change materially affects your rights or obligations, we will take reasonable steps to notify you. If you do not agree with the updated Terms, you should stop using Attend.",
    ],
  },
  {
    title: "Governing law and disputes",
    paragraphs: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria, without limiting mandatory consumer or data protection rights that may apply in another jurisdiction.",
      "If you have a complaint or dispute, please first contact us at attendplatform@gmail.com so we can attempt to resolve it. This does not prevent either party from approaching a competent court or regulatory authority.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "Attend is currently operated by Odinaka Ogbonna, an individual based in Nigeria pending formal business registration.",
      "For questions, complaints, legal notices, or concerns about these Terms, contact attendplatform@gmail.com.",
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <LegalPage
      title="Terms of Service"
      description="The rules and conditions that apply when you use Attend to discover events, create experiences, and connect with communities."
      effectiveDate="12 November 2026"
      sections={sections}
      />
      <Footer />
    </>
  );
}