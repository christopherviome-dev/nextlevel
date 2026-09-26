// Shared shop definitions, used by My Shop, Admin, Discover and shop pages,
// so a professional and the admin always see exactly the same rules.

export const CATEGORIES = ["Hair Braiding", "Barbering", "Makeup", "Nails & Pedicure", "Locs & Twists", "Other"];

// How a professional works. No one is forced to have a physical shop.
export const WORK_MODES = [
  ["SALON", "At my salon or shop"],
  ["HOME", "At my home"],
  ["MOBILE", "I come to the customer"],
  ["APPOINTMENT", "By appointment only"],
];
export const workModeLabel = (m) => (WORK_MODES.find(([k]) => k === m) || [m, m])[1];

// The completeness checklist. The same six checks appear in Admin.
export function shopChecks(shop) {
  const services = shop.styles || [];
  return [
    ["Profile photo", !!shop.profilePhoto],
    ["Description", !!(shop.bio && shop.bio.trim())],
    ["Area / location", !!(shop.area && shop.area.trim())],
    ["At least one service", services.length > 0],
    ["Photos of their work", services.some((s) => s.photo)],
    ["Identity verified", !!shop.verified],
  ];
}

export function coverPhoto(shop) {
  const work = (shop.styles || []).find((s) => s.photo);
  return (work && work.photo) || shop.coverPhoto || shop.profilePhoto || null;
}
