# Privacy policy: Crack IT Uploader

*Last updated: 13 October 2026*

Crack IT Uploader is a private automation tool. Its only user is the owner of the Crack IT YouTube channel, and it
is part of this open-source project (<https://github.com/SrigadaAkshayKumar/ai-video-editor>). It uploads the
channel's own videos to that channel and schedules them. It has no other users and no sign-up.

## What it accesses

- **YouTube API Services, scope `youtube.upload` only.** The tool uses it to upload videos and Shorts to the owner's
  channel, and to set their title, description, tags, thumbnail, publish time and the "altered or synthetic content"
  label. It does not read, change or delete any other videos, comments, analytics or account data.
- It does not access the data of any other YouTube user or Google account.

## What it stores

- The OAuth client ID, client secret and refresh token are stored as encrypted GitHub Actions secrets in the owner's
  repository. They are used only while the owner's own automated job runs.
- The upload results (video IDs, links and publish times) are stored in the owner's own Google Drive.
- No personal data about viewers or other users is collected, stored, sold or shared with anyone.

## Third parties

This tool uses YouTube API Services. By using it you agree to the
[YouTube Terms of Service](https://www.youtube.com/t/terms). Google's handling of data is described in the
[Google Privacy Policy](https://policies.google.com/privacy).

## Removing access

The owner can revoke the tool's access at any time at
<https://myaccount.google.com/connections> (or <https://security.google.com/settings/security/permissions>), and
can delete the GitHub secrets. Once access is revoked, the tool keeps no YouTube data.

## Contact

Through the contact details on the Crack IT YouTube channel's About page, or by opening an issue at
<https://github.com/SrigadaAkshayKumar/ai-video-editor/issues>.
