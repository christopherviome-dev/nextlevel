// What each professional is called, from the services they offer, in the
// words the trade uses (so people recognise their role at a glance).
export const TITLES = {
  hair: ["Hairdresser", "hairdressers"], barbering: ["Barber", "barbers"], makeup: ["Makeup artist", "makeup artists"],
  nails: ["Nail technician", "nail technicians"], lashes: ["Lash & brow technician", "lash & brow technicians"], skin: ["Beauty therapist", "beauty therapists"], photography: ["Photographer", "photographers"],
};
// "Hairdresser · Makeup artist" (at most two); new services: "<Service> specialist".
export function titleOf(services, catalog = []) {
  const out = (services || []).map((k) => (TITLES[k] ? TITLES[k][0] : ((catalog.find((c) => c.key === k) || {}).name ? `${catalog.find((c) => c.key === k).name} specialist` : null))).filter(Boolean);
  return [...new Set(out)].slice(0, 2).join(" · ");
}
