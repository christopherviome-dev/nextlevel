// Founding members (the first 1,000) get a gold ring around their picture.
export const isFounding = (x) => !!(x && (x.founding === true || (x.memberNumber && x.memberNumber <= 1000)));
export const GOLD_RING = { boxShadow: "0 0 0 2px var(--color-card, #fff), 0 0 0 4px #d4a017" };
export const ringStyle = (x) => (isFounding(x) ? GOLD_RING : undefined);
