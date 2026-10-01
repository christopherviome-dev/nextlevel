import Link from "next/link";
import LegalPage from "../../components/LegalPage";

export const metadata = { title: "Privacy · Mepluge" };

// Plain-language privacy notice reflecting exactly what the app does today.
// NOTE FOR THE OWNER: have a lawyer review this, and register with Ghana's
// Data Protection Commission, before public launch.
export default function Privacy() {
  return (
    <LegalPage title="Privacy notice" updated="30 September 2026 (draft for legal review)">
      <p>This explains what Mepluge collects, why, and who can see it. We collect only what Mepluge needs to work, and we never sell your information.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Your account:</b> name, phone number, country, and your password (stored scrambled, so no one can read it, including us). If you use <b>Continue with Google</b>, we also keep your Google email address and a Google account ID (never your Google password), and whether you said yes to Mepluge news by email.</li>
        <li><b>Bookings:</b> the services you request or provide, dates and times, notes, an emergency contact if you add one, and the star rating a customer gives after a visit.</li>
        <li><b>Messages</b> you send to other people on Mepluge.</li>
        <li><b>Photos and shop details</b> that professionals add, styles customers choose to save, and finished-look photos a professional adds to a customer's saved styles.</li>
        <li><b>Identity documents (professionals only):</b> your legal name, document number and a photo of the document, used only to verify you.</li>
        <li><b>Your location, only if you turn it on,</b> to show what's near you. Shop locations are shown to the public only roughly (about 1 km).</li>
        <li><b>Phone alerts, only if you turn them on:</b> your phone's alert address and which kinds of alerts you chose.</li>
        <li><b>How you found Mepluge:</b> the link or invite code that brought you (for example, a professional's WhatsApp link), to credit invites and learn what works.</li>
        <li><b>Questions you ask the assistant</b> (the 🎤 in Search), used to find professionals. We don't store them with your name.</li>
        <li><b>Anonymous counts:</b> searches and inspiration views counted by style and day only, never linked to you.</li>
        <li><b>Community messages</b> you post in the Mepluge Telegram group, so our team can answer them.</li>
        <li><b>Field visits:</b> when our team visits a shop, we may note its name, area, services and phone number, and photos only with the owner's permission.</li>
        <li><b>Error reports:</b> if the app hits a problem, a technical note (the page, the error and the browser type), without personal details.</li>
        <li><b>On your device:</b> small settings such as your theme and country, your likes, and an anonymous code that lets us count likes and shop visits without knowing who you are.</li>
      </ul>

      <h2>Who can see what</h2>
      <ul>
        <li><b>Everyone:</b> a professional's shop page: name, photos, services, prices, area, average rating (from 3 ratings up), and whether their ID is checked.</li>
        <li><b>The professional you book:</b> your name, your phone number, your booking details and your emergency contact (if you add one).</li>
        <li><b>Helpers in a shop:</b> only your first name and your past visits there, and only on the day of your appointment, unless the owner allows more. Your phone number is hidden from them unless the owner allows it.</li>
        <li><b>Messages:</b> only you and the person you're writing to. If someone reports a conversation, Mepluge's team may read it to handle the report.</li>
        <li><b>Only Mepluge's review team:</b> professionals' identity documents and legal names. They never appear on shop pages.</li>
        <li><b>Nobody else</b> sees your email address or Google details.</li>
        <li>Scanning someone's Mepluge code never reveals their personal details.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>To run Mepluge: showing shops, handling bookings, messages, alerts and reminders, checking identities for safety, handling reports, preventing fraud, and crediting invites. We use information about what you view and save only to make Mepluge more useful to you. We only send you news by email if you said yes, and you can stop at any time.</p>

      <h2>Young people</h2>
      <p>Mepluge is for people aged 18 and over. Professionals in training may join from age 15 with a parent's or guardian's agreement: they have no public profile, take no direct bookings, and their work is never shown publicly.</p>

      <h2>Services we rely on</h2>
      <ul>
        <li><b>Render</b> runs our server, <b>MongoDB Atlas</b> stores our database, and <b>Netlify</b> serves the website. Our servers are in Europe and the United States.</li>
        <li><b>Google</b>, only if you use Continue with Google.</li>
        <li><b>Your phone's alert service</b> (Google, Apple or Mozilla) delivers phone alerts, so it handles the alert's text.</li>
        <li><b>Anthropic</b>, only when the assistant's AI is switched on: it receives the text of your question to understand it, not your name.</li>
        <li><b>Telegram</b> hosts the Mepluge community group.</li>
        <li><b>ExchangeRate-API</b> (exchange rates) and <b>Pexels</b> (inspiration photos): no personal information is sent to them.</li>
      </ul>

      <h2>Keeping and deleting</h2>
      <p>We keep your information while your account is open. You can ask us to correct it or to delete your account at any time; some records may be kept where the law requires or to prevent fraud.</p>

      <h2>Your rights</h2>
      <p>You can ask what information we hold about you, and ask us to correct or delete it. These rights come from data protection law, including Ghana's Data Protection Act, 2012 (Act 843) and, for people in the UK, the UK GDPR.</p>

      <h2>Contact</h2>
      <p>Questions or requests: join the <a href="https://t.me/+se1zShHTSWUzMzNk" target="_blank" rel="noopener noreferrer">Mepluge community on Telegram</a>. See also our <Link href="/terms">Terms of Use</Link>.</p>
    </LegalPage>
  );
}
