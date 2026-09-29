// Mirrors the server's lib/adminRoles.js, so each admin's menu shows only what
// their role allows. (The server always checks again: this only tidies the screen.)
export const ROLES = {
  SUPER_ADMIN: { label: "Super admin", perms: ["*"], about: "Everything, including managing the admin team" },
  VERIFIER: { label: "Verifier", perms: ["shops", "ids", "services"], about: "Approves shops, checks ID documents, approves proposed services" },
  MODERATOR: { label: "Moderator", perms: ["reports", "restrict", "conversations", "telegram"], about: "Handles reports and community feedback, restricts and restores accounts" },
  SUPPORT: { label: "Support", perms: ["passwords"], about: "Handles password help" },
  ANALYST: { label: "Analyst", perms: ["analytics"], about: "Sees Overview, Places, Demand and the Map (read only)" },
  FIELD_AGENT: { label: "Field agent", perms: ["field"], about: "Logs field trips and shop visits" },
};
export const roleOf = (account) => (!account ? null : account.adminRole && ROLES[account.adminRole] ? account.adminRole : account.isAdmin ? "SUPER_ADMIN" : null);
export const can = (role, perm) => !!role && !!ROLES[role] && (ROLES[role].perms.includes("*") || ROLES[role].perms.includes(perm));
