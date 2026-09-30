import Link from "next/link";
import LegalPage from "../../components/LegalPage";

export const metadata = { title: "Terms of Use · Mepluge" };

// Plain-language terms reflecting how Mepluge actually works today.
// NOTE FOR THE OWNER: have a lawyer review this before public launch.
export default function Terms() {
  return (
    <LegalPage title="Terms of Use" updated="September 2026">
      <p>These terms explain how Mepluge works and what we ask of everyone who uses it. By creating an account, you agree to them. If you don't agree, please don't use Mepluge.</p>

      <h2>1. What Mepluge is</h2>
      <p>Mepluge helps customers find beauty professionals (hair, barbering, makeup, nails and more) and helps professionals run their business. The professionals on Mepluge are independent: they are not employed by Mepluge, and Mepluge does not provide beauty services itself.</p>

      <h2>2. Your account</h2>
      <ul>
        <li>Mepluge is for adults: customers and independent professionals should be 18 or older. Younger customers can be booked for through a parent's or guardian's account.</li>
        <li>Professionals in training (apprentices) may join from age 15, as Ghana's Children's Act, 1998 allows, with a parent's or guardian's agreement. Apprentices under 18 have no public profile and take no direct bookings; they help through their supervisor's shop.</li>
        <li>Use your real name and your own phone number, and keep your details accurate.</li>
        <li>One person, one account of each kind. Don't share your password; you're responsible for what happens on your account.</li>
      </ul>

      <h2>3. Bookings and payments</h2>
      <p>A booking is an agreement between the customer and the professional. At the moment, <b>Mepluge does not take or hold any payments</b>: customers pay professionals directly (for example in cash or by mobile money). Prices, changes, cancellations and any disputes about a service are between the customer and the professional, though you can always report a problem to Mepluge.</p>

      <h2>4. Professionals</h2>
      <ul>
        <li>Keep your shop accurate: your services, prices, availability and location.</li>
        <li>Only upload photos of work you did yourself.</li>
        <li>An identity check is required for the "ID checked" badge. Submit only your own, genuine documents.</li>
        <li>Professionals in training (apprentices) join through their supervisor, who confirms them. Supervisors are responsible for the access they give.</li>
      </ul>

      <h2>5. Safety and respect</h2>
      <p>No harassment, threats, discrimination, fraud, fake accounts, fake bookings or fake reviews. Customers and professionals are meeting people they may not know, so please take care, and report anything that worries you. We may restrict or close accounts that break these terms or put others at risk.</p>

      <h2>6. Invite rewards</h2>
      <ul>
        <li><b>A referral counts only when the person you invited completes a genuine service</b> (their first job). Signing people up on its own does not count.</li>
        <li>Each reward is checked for about a week, then confirmed. Rewards with warning signs, for example if the person who invited was also part of the job, or several invites all complete their first job with the same professional, are reviewed by Mepluge before they count.</li>
        <li>A confirmed reward is worth the equivalent of GH₵1, recorded in cedis and shown in your own currency at the current exchange rate.</li>
        <li>Rewards have no cash value while Mepluge takes no payments. Confirmed rewards build up in your account and are intended to become coupons for a free or discounted service once Mepluge starts taking payments.</li>
        <li>Rewards from self-invites, fake accounts or arranged bookings are cancelled. Mepluge may change or end the invite programme.</li>
      </ul>

      <h2>7. Rewards from professionals</h2>
      <p>Professionals may, if they wish, reward customers who send them other customers, for example with a discount. This is entirely optional and is an arrangement between the professional and the customer; Mepluge is not responsible for it.</p>

      <h2>8. Your content</h2>
      <p>You own the photos and words you add. You allow Mepluge to show them on Mepluge to help your shop be found. "Inspiration" photos shown in Discover come from free photo sites, are credited, and don't show any Mepluge professional's work.</p>

      <h2>9. Responsibility</h2>
      <p>Mepluge works hard to keep things safe and accurate, but we can't guarantee any professional's work or any customer's conduct. To the extent the law allows, Mepluge is not responsible for services provided through it. Nothing here affects rights you have under the law of your country.</p>

      <h2>10. Changes and contact</h2>
      <p>We may update these terms as Mepluge grows; the date above shows the latest version. Questions? Join the <a href="https://t.me/+se1zShHTSWUzMzNk" target="_blank" rel="noopener noreferrer">Mepluge community on Telegram</a>. See also our <Link href="/privacy">Privacy notice</Link>.</p>
    </LegalPage>
  );
}
