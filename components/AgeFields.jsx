"use client";
import PhoneInput from "./PhoneInput";

// Shown at signup only when the admin has switched the age check on.
//  - customers and professionals: one "18 or older" box
//  - apprentices: 18+ or 15-17; 15-17 adds a parent or guardian (name, phone, consent)
export default function AgeFields({ apprentice, value, onChange, country }) {
  const set = (patch) => onChange({ ...value, ...patch });
  if (!apprentice) {
    return (
      <label className="flex items-center gap-2 text-sm text-muted-strong">
        <input type="checkbox" checked={!!value.ageConfirmed} onChange={(e) => set({ ageConfirmed: e.target.checked })} className="w-4 h-4" />
        I'm 18 or older
      </label>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-sm font-bold">Your age</div>
      <div className="flex gap-2">
        {[["ADULT", "18 or older"], ["MINOR", "15 to 17"]].map(([k, label]) => (
          <button type="button" key={k} onClick={() => set({ apprenticeAge: k })} aria-pressed={value.apprenticeAge === k}
            className={"flex-1 py-2 rounded-full border text-sm font-bold " + (value.apprenticeAge === k ? "bg-violet text-white border-violet" : "bg-card text-plum border-line")}>{label}</button>
        ))}
      </div>
      {value.apprenticeAge === "MINOR" && (
        <div className="bg-surface rounded-xl p-3 space-y-2">
          <p className="text-xs text-muted-strong">Your parent or guardian needs to agree to you joining as a professional in training.</p>
          <input placeholder="Parent or guardian's name" value={value.guardianName || ""} onChange={(e) => set({ guardianName: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-line bg-card" />
          <PhoneInput country={value.guardianCountry || country} onCountryChange={(c) => set({ guardianCountry: c })}
            value={value.guardianPhoneRaw || ""} onChange={(v) => set({ guardianPhoneRaw: v })} autoComplete="off" />
          <label className="flex items-start gap-2 text-sm text-muted-strong">
            <input type="checkbox" checked={!!value.guardianConsent} onChange={(e) => set({ guardianConsent: e.target.checked })} className="w-4 h-4 mt-0.5" />
            My parent or guardian agrees to me joining Sheeba as an apprentice
          </label>
        </div>
      )}
    </div>
  );
}
