import Link from "next/link";
import LegalPage from "../../components/LegalPage";

export const metadata = { title: "Privacy · Mepluge" };

// Plain-language privacy notice reflecting exactly what the app does today.
// NOTE FOR THE OWNER: have a lawyer review this, and register with Ghana's
// Data Protection Commission, before public launch.
export default function Privacy() {
  return (
    <LegalPage title="Privacy notice" updated="September 2026">
      <p>This explains what Mepluge collects, why, and who can see it. We collect only what Mepluge needs to work, and we never sell your information.</p>

      <h2>What we collect</h2>
      <ul>
        <li><b>Your account:</b> name, phone number, country, and your password (stored scrambled, so no one can read it, including us).</li>
        <li><b>Bookings:</b> the services you request or provide, dates and times, notes, and an emergency contact if you add one.</li>
        <li><b>Photos and shop details</b> that professionals add, and styles customers choose to save.</li>
        <li><b>Identity documents (professionals only):</b> your legal name, document number and a photo of the document, used only to verify you.</li>
        <li><b>Your location, only if you turn it on,</b> to show what's near you.</li>
        <li><b>On your device:</b> small settings such as your theme and country, and an anonymous code that lets us count likes and shop visits without knowing who you are.</li>
      </ul>

      <h2>Who can see what</h2>
      <ul>
        <li><b>Everyone:</b> a professional's shop page: name, photos, services, prices, area, and whether they're verified.</li>
        <li><b>The professional you book:</b> your name, your phone number, your booking details and your emergency contact (if you add one).</li>
        <li><b>Only Mepluge's review team:</b> professionals' identity documents and legal names. They never appear on shop pages.</li>
        <li>Scanning someone's Mepluge code never reveals their personal details.</li>
      </ul>

      <h2>Why we use it</h2>
      <p>To run Mepluge: showing shops, handling bookings and reminders, checking identities for safety, preventing fraud, and crediting invites. We use information about what you view and save only to make Mepluge more useful to you.</p>

      <h2>Services we rely on</h2>
      <p>Mepluge runs on trusted hosting and database providers. Exchange rates come from ExchangeRate-API; no personal information is sent to them.</p>

      <h2>Keeping and deleting</h2>
      <p>We keep your information while your account is open. You can ask us to correct it or to delete your account at any time; some records may be kept where the law requires or to prevent fraud.</p>

      <h2>Your rights</h2>
      <p>You can ask what information we hold about you, and ask us to correct or delete it. These rights come from data protection law, including Ghana's Data Protection Act, 2012 (Act 843) and, for people in the UK, the UK GDPR.</p>

      <h2>Contact</h2>
      <p>Questions or requests: join the <a href="https://t.me/+se1zShHTSWUzMzNk" target="_blank" rel="noopener noreferrer">Mepluge community on Telegram</a>. See also our <Link href="/terms">Terms of Use</Link>.</p>
    </LegalPage>
  );
}
