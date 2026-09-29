// Where each notification takes you when tapped (so nothing is a dead end).
const ADMIN_SECTION = { REPORT_FILED: "reports", VERIFICATION_SUBMITTED: "ids", PASSWORD_RESET_REQUESTED: "passwords", SERVICE_PROPOSED: "services",
  SHOP_UNDER_REVIEW: "shops", COMMUNITY_FEEDBACK: "feedback", INVITE_JOINED: "invites", MEMBER_MILESTONE: "overview" };
export function notificationLink(n, role) {
  const pro = role === "pro";
  if (ADMIN_SECTION[n.type] && (n.entityType === "admin" || pro)) return `/admin?section=${ADMIN_SECTION[n.type]}`;
  if (n.entityType === "admin") return "/admin";
  if (n.entityType === "conversation") return pro ? "/dashboard?tab=messages" : "/messages";
  if (n.entityType === "request") return pro ? "/dashboard?tab=requests" : "/requests";
  if (n.type === "FRESH_LOOK") return "/my-sheeba";
  if (n.entityType === "shop" && !pro && n.entityId) return `/shop/${n.entityId}`;
  if (/^(TRAINING_UPDATE|APPRENTICE_GRADUATED)$/.test(n.type)) return pro ? "/dashboard?tab=training" : null;
  if (/^APPRENTICE_/.test(n.type)) return "/dashboard?tab=team";
  if (/^(STAFF_ACCESS_GRANTED)$/.test(n.type)) return "/dashboard?tab=requests";
  if (/^(INVITE_|SERVICE_(APPROVED|REJECTED))/.test(n.type)) return pro ? (n.type.startsWith("INVITE_") ? "/dashboard?tab=share" : "/dashboard?tab=services") : "/my-sheeba";
  if (/^(SHOP_APPROVED|VERIFICATION_)/.test(n.type)) return "/dashboard?tab=profile";
  if (/^(RATING_RECEIVED|CUSTOMER_CHECKED_IN|SERVICE_COMPLETED)$/.test(n.type)) return pro ? "/dashboard?tab=requests" : "/requests";
  if (/^(SERVICE_DUE_SOON|SERVICE_OVERDUE)$/.test(n.type)) return pro ? "/dashboard?tab=customers" : "/my-sheeba";
  if (n.type === "ADMIN_ROLE") return "/admin";
  return null; // account notices (restricted/restored) are read in place
}
