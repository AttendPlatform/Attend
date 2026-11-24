import type { Metadata } from "next";
import { Footer } from "@/components/navigation/footer";
import { LegalPage, type LegalSection } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Attend",
  description:
    "Learn how Attend collects, uses, stores, and protects your personal information.",
  robots: {
    index: true,
    follow: true,
  },
};

const sections: LegalSection[] = [
  {
    title: "Introduction",
    paragraphs: [
      "Your privacy matters to us. This Privacy Policy explains how Attend collects, uses, stores, shares, and protects personal information when you access or use our website, applications, and related services.",
      "Attend is currently operated by Odinaka Ogbonna, an individual based in Nigeria, pending formal business registration. References to Attend, we, us, or our in this Policy refer to the individual operating the Platform.",
      "We aim to handle personal information responsibly and in accordance with applicable data protection laws, including the Nigeria Data Protection Act 2023.",
    ],
  },
  {
    title: "Information we collect",
    paragraphs: [
      "The information we collect depends on how you use Attend. It may include the following categories:",
    ],
    bullets: [
      "Account information: full name, email address, username, display name, profile photograph, account preferences, and selected reasons for joining Attend.",
      "Authentication information: information needed to create and secure your account. If you use Google sign-in, we may receive information Google shares with us, such as your name, email address, and profile photograph. We do not receive your Google password.",
      "Event and participation information: events you create, manage, save, or register for; participation records; information submitted to organisers; campaigns you create or join; and relevant payment or transaction status where payment features are available.",
      "Uploaded content: event descriptions, cover images, campaign graphics, photographs, comments, and other files or content you submit.",
      "Location information: locations you enter manually, event locations, and device-provided location information when you choose to use location-based features and grant permission.",
      "Technical information: IP address, browser and device type, operating system, pages and features accessed, access times, diagnostic information, and security logs.",
      "Notification information: push notification tokens and notification preferences where you enable push notifications.",
    ],
  },
  {
    title: "How we use your information",
    paragraphs: [
      "We use personal information to provide and operate Attend, including creating accounts, authenticating users, displaying profiles and events, supporting registrations and campaigns, saving events, and delivering notifications.",
      "We may use information to personalise event discovery, support location-based features, remember preferences, protect accounts, detect fraud and abuse, investigate reports, improve Platform performance, respond to support requests, and comply with legal obligations.",
      "We will not use personal information for a materially different purpose without an appropriate lawful basis and, where required, informing you or obtaining your consent.",
    ],
  },
  {
    title: "Legal bases for processing",
    paragraphs: [
      "Where required by applicable law, we process personal information on one or more of these legal bases:",
    ],
    bullets: [
      "Contract: processing necessary to provide services you request or perform our agreement with you.",
      "Consent: where you freely agree to a particular use, such as optional permissions or certain marketing communications.",
      "Legitimate interests: processing reasonably necessary for Platform security, fraud prevention, service improvement, and administration, provided your rights do not override those interests.",
      "Legal obligation: processing necessary to comply with applicable laws or lawful orders.",
      "Other lawful grounds recognised by applicable data protection law.",
    ],
  },
  {
    title: "Information visible to other users",
    paragraphs: [
      "Attend includes social and event-discovery features. Depending on your profile settings, event settings, and the feature involved, other users may be able to see your display name, username, profile photograph, events you organise, and public campaign content you create or share.",
      "Event organisers may receive information about people who register for or participate in their events where necessary to manage those events.",
      "We aim to limit public exposure of personal information. However, information you choose to make public may be viewed, copied, or shared by other people. Do not publish information you wish to keep private.",
    ],
  },
  {
    title: "How we share information",
    paragraphs: [
      "We do not sell your personal information. We may share information in the following circumstances:",
    ],
    bullets: [
      "Service providers: trusted providers that help us operate Attend, such as Supabase for authentication, database and storage; Vercel for hosting; Resend for email delivery; Google when you choose Google sign-in; and mapping or location services when you use location features.",
      "Event organisers: relevant information may be shared with an organiser when you register for or participate in an event so the organiser can manage registration and communicate event updates.",
      "Other users: information you publish publicly or choose to share through Attend may be accessible to other users.",
      "Legal and safety reasons: where reasonably necessary to comply with law, respond to lawful requests, protect users or Attend, investigate fraud or security incidents, or establish or defend legal claims.",
      "Business changes: if Attend undergoes a business transfer, restructuring, investment, or acquisition, information may be transferred as part of that transaction subject to applicable law and appropriate safeguards.",
    ],
  },
  {
    title: "International data transfers",
    paragraphs: [
      "Some of our service providers may store or process information outside Nigeria. Where personal information is transferred internationally, we will take steps required by applicable data protection law to ensure that the transfer has an appropriate legal basis and suitable safeguards.",
    ],
  },
  {
    title: "Cookies and similar technologies",
    paragraphs: [
      "Attend may use cookies, local storage, and similar technologies to keep users signed in, maintain sessions and account security, remember preferences, support essential Platform functionality, and understand technical performance where applicable.",
      "You can manage or delete cookies through your browser settings. Disabling certain cookies or storage technologies may affect some Platform features.",
    ],
  },
  {
    title: "Data retention",
    paragraphs: [
      "We retain personal information only for as long as reasonably necessary for the purposes described in this Policy, including providing the Platform, maintaining account records, resolving disputes, protecting security, and meeting legal obligations.",
      "Retention periods depend on the type of information and why it is processed. When information is no longer required, we will take reasonable steps to delete it, anonymise it, or securely dispose of it.",
      "Some information may remain in backups or records for a limited period after deletion, or where retention is required by law or necessary to resolve a legitimate dispute.",
    ],
  },
  {
    title: "Data security",
    paragraphs: [
      "We use reasonable technical and organisational measures designed to protect personal information against unauthorised access, loss, misuse, alteration, or disclosure. These measures may include access controls, authentication safeguards, secure hosting, and system protections.",
      "No online service or method of electronic storage is completely secure. We cannot guarantee absolute security. If you believe your account or personal information has been compromised, contact attendplatform@gmail.com promptly.",
    ],
  },
  {
    title: "Your privacy rights",
    paragraphs: [
      "Subject to applicable law, you may have the right to:",
    ],
    bullets: [
      "Be informed about how and why your personal information is processed.",
      "Request confirmation of whether we process your information and obtain a copy.",
      "Request correction of inaccurate or incomplete information.",
      "Request deletion of personal information in circumstances provided by law.",
      "Request restriction of certain processing.",
      "Object to certain processing, including processing based on legitimate interests or direct marketing where applicable.",
      "Request a copy of information in a structured, commonly used format where data portability rights apply.",
      "Withdraw consent where processing is based on consent.",
      "Lodge a complaint with the relevant data protection authority.",
    ],
  },
  {
    title: "How to exercise your rights",
    paragraphs: [
      "To make a privacy request, email attendplatform@gmail.com with the subject line Privacy Request. Explain what you would like us to do.",
      "We may ask for reasonable information to verify your identity before responding. We will handle requests within the time limits required by applicable law.",
      "Some rights are subject to legal conditions and exceptions. For example, we may need to retain certain information to comply with law, protect security, or establish or defend legal claims.",
      "If you are not satisfied with our response, you may lodge a complaint with the Nigeria Data Protection Commission or another competent supervisory authority, as applicable.",
    ],
  },
  {
    title: "Children's privacy",
    paragraphs: [
      "Attend is not designed for independent account use by children under 18. We do not knowingly seek to collect children's personal information without an appropriate lawful basis and any consent or safeguards required by law.",
      "Where a minor is permitted to participate in an event, the relevant organiser and parent or legal guardian must ensure that participation is lawful and appropriately supervised.",
      "If you believe a child has provided personal information to Attend improperly, contact us so we can investigate and take appropriate action.",
    ],
  },
  {
    title: "Third-party websites and services",
    paragraphs: [
      "Attend may contain links to websites, ticketing services, payment providers, event venues, or other third-party platforms. Those services operate independently and have their own privacy policies and practices.",
      "We encourage you to review their policies before providing personal information or completing transactions with them.",
    ],
  },
  {
    title: "Marketing communications",
    paragraphs: [
      "We may send service-related communications necessary to operate your account or provide event services.",
      "Where we send optional promotional or marketing communications, we will comply with applicable consent and opt-out requirements. You can unsubscribe where an option is provided or contact attendplatform@gmail.com to update your preferences.",
    ],
  },
  {
    title: "Changes to this Privacy Policy",
    paragraphs: [
      "We may update this Policy as Attend develops, our services change, or legal requirements evolve. The latest version will be published on the Platform with an updated date.",
      "If a change materially affects how we process personal information or your rights, we will take reasonable steps to notify you.",
    ],
  },
  {
    title: "Contact and data controller",
    paragraphs: [
      "Attend is currently operated by Odinaka Ogbonna, an individual based in Nigeria pending formal business registration.",
      "For privacy questions, data access requests, correction or deletion requests, complaints, or concerns about how your information is handled, contact attendplatform@gmail.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <LegalPage
      title="Privacy Policy"
      description="How Attend collects, uses, stores, shares, and protects your personal information."
      effectiveDate="12 November 2026"
      sections={sections}
      />
      <Footer />
    </>
  );
}