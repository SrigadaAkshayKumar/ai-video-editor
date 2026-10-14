#!/usr/bin/env node
// One-time YouTube login, run on your own PC (not in the cloud): prints the refresh token for the GitHub secret
// YT_REFRESH_TOKEN. Sign in with the Google account that OWNS the channel. Setup steps: docs/cloud-setup.md → YouTube.
// Usage: node tools/youtube-auth.mjs <client_id> <client_secret>
import { createServer } from "node:http";
import { die, parseCli } from "./lib/common.mjs";

const { positional } = parseCli();
const [clientId, clientSecret] = positional;
if (!clientId || !clientSecret) die("usage: node tools/youtube-auth.mjs <client_id> <client_secret>");

const server = createServer();
server.listen(0, "127.0.0.1", () => {
  const redirect = `http://127.0.0.1:${server.address().port}`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId, redirect_uri: redirect, response_type: "code", access_type: "offline", prompt: "consent",
    // upload + edit the channel's own videos (title, description, tags, schedule, AI label, thumbnail)
    scope: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
  })}`;
  console.log(`Open this link, sign in with the channel's Google account and allow access:\n\n${url}\n`);
  server.on("request", async (req, res) => {
    const code = new URL(req.url, redirect).searchParams.get("code");
    if (!code) return res.end("No code in this request.");
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirect, grant_type: "authorization_code" }),
    });
    const j = await r.json();
    res.end(j.refresh_token ? "Done. Go back to the terminal." : "Failed, see the terminal.");
    server.close();
    if (!j.refresh_token) die(`no refresh token: ${JSON.stringify(j)}`);
    console.log("Paste this into the GitHub secret YT_REFRESH_TOKEN (and nowhere else):\n");
    console.log(j.refresh_token);
  });
});
