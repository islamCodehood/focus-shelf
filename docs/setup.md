# Deployment setup

## 1. Google resources

The prepared Sheet is `1_3igOWIRdRiCt_zhjDw_adN884ywR5rB8Al_67DKsf8` and the private cover folder is `1D-f6j3Be00ZYd4-h_0PRel0IH71iVthW`.

1. Open [script.google.com](https://script.google.com/) and create a standalone project named `Focus Shelf Backend`.
2. Replace the default script with `apps-script/Code.gs`, add a second script file containing `apps-script/domain.js`, and replace the manifest with `apps-script/appsscript.json`.
3. Add Script Properties:
   - `SPREADSHEET_ID=1_3igOWIRdRiCt_zhjDw_adN884ywR5rB8Al_67DKsf8`
   - `COVER_FOLDER_ID=1D-f6j3Be00ZYd4-h_0PRel0IH71iVthW`
   - `API_SECRET=<at least 32 random characters>`
4. Run `verifySetup` once and approve the spreadsheet/Drive scopes.
5. Deploy as a Web app, execute as yourself, with access set to anyone. Possession of the URL is not authorization: every request still requires the HMAC secret.
6. Copy the `/exec` deployment URL.

## 2. Generate application secrets

Use a password manager for the access phrase, then calculate its hash locally:

```bash
node -e "const c=require('node:crypto'); console.log(c.createHash('sha256').update(process.argv[1]).digest('hex'))" "YOUR ACCESS PHRASE"
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Run the random command twice: once for `APPS_SCRIPT_SECRET` (the same value as the Script Property) and once for `SESSION_SECRET`.

## 3. Vercel environment

Configure Production, Preview, and Development as appropriate:

| Variable | Value |
|---|---|
| `APPS_SCRIPT_URL` | Apps Script `/exec` URL |
| `APPS_SCRIPT_SECRET` | Same as Apps Script `API_SECRET` |
| `APP_ACCESS_HASH` | SHA-256 hex of the private phrase |
| `SESSION_SECRET` | Independent random value, at least 32 characters |
| `APP_ORIGIN` | Exact production origin, without a trailing slash |
| `NEXT_PUBLIC_SHEET_URL` | Optional admin convenience URL |

Deploy with `vercel --prod`, set `APP_ORIGIN` to the assigned production origin, and redeploy once so origin checks use the final URL.

## 4. Smoke test

1. Wrong phrase is rejected; correct phrase opens an empty shelf.
2. Add a Parking item and promote it to Main.
3. Attempt a second Main item and confirm capacity enforcement.
4. Record progress, correct it downward, and inspect the Events rows.
5. Pause the item and activate another.
6. Upload a cover and confirm it is not publicly shared.
7. Save a weekly review and check Analytics on phone and desktop.
