// The ONE place the server's address lives (the app and the early connection
// both read it). The app picks the server by where it's opened:
//  - the staging site (staging--…) talks to the STAGING server, with its own
//    test database, so testing never touches real people's data;
//  - everywhere else (the live site) talks to the LIVE server.
// Each is switched on only AFTER that server is confirmed working.
const LIVE = "https://mepluge-api.onrender.com"; // Frankfurt, next to the database (verified 30 Sep); later https://api.mepluge.com
const STAGING = "https://mepluge-api-staging.onrender.com"; // Frankfurt, its own test database (verified 30 Sep)
const onStaging = typeof window !== "undefined" && window.location.hostname.startsWith("staging--");
export const API_ORIGIN = onStaging && STAGING ? STAGING : LIVE;
