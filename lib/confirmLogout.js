// Logging out always asks first (a mis-tap shouldn't sign anyone out), in plain words.
export function confirmLogout(logoutFn) {
  if (typeof window === "undefined") return;
  if (window.confirm("Log out of Mepluge on this phone?\n\nYou can log back in anytime with your phone number and password.")) logoutFn();
}
