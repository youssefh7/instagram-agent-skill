# Tendiz Property - team unit finder

Staff log in, search ALL units (budget, bedrooms, compound, ready/off-plan), then send the client
**one unit only** with one tap. The client opens a branded page for that unit and taps WhatsApp to
message the employee who sent it.

```
units.json         <- ALL units + settings. Private: never served as a file
api/               <- tiny server code (login, staff list, single unit)
public/            <- the pages (index, unit, add), css, js, logo, photos
vercel.json        <- deploy settings
dev.js             <- local preview
```

## How privacy works

| who | can do |
|---|---|
| Not logged in | Sees a login form. `/units.json` and `/api/units` return nothing |
| Client with a unit link | Sees that one unit. No internal notes. Cannot list others |
| Staff (password) | Searches everything, sees internal notes, sends links |

- Every unit `id` ends in a random code (`badya-ground-3br-150-m9epxb`), so a client who has one
  link cannot guess another. **Keep that ending** when you add units (the Add page does it for you).
- One shared staff password. Logins last 30 days per device. **When someone leaves, change the
  password in Vercel and redeploy: every device is logged out at once.**
- Anyone you send a unit link to can forward it. That is normal for a link; it still only shows one unit.
- Photos in `public/photos/` are reachable by their file URL, but only someone with the unit link sees
  that URL. For anything sensitive use `photosFolder` (Drive link) instead.

## Daily use (staff)

1. Open the site, log in once (phone remembers you).
2. Type **your WhatsApp number** in the box at the top (once per phone). Clients will message you.
3. Filter, then on a unit tap **Send to client** (opens WhatsApp, pick the client, send) or **Copy link**.

## Add a unit

1. Log in, open `/add.html`.
2. Paste the listing message, tap **Read message**, check the orange fields.
3. **Copy units.json**, replace the contents of `units.json` in the project (on github.com: pencil icon), commit.
   Vercel redeploys in about 30 seconds.

Two note fields: `notes` is shown to clients, `internalNotes` is staff only (owner, commission, flexibility).
Pasted "Notes:" go to `internalNotes` by default. Set `"sold": true` to hide a unit everywhere.

Unit fields: `id`, `compound`, `type`, `area`, `garden` (0 = none), `bedrooms`, `bathrooms`, `finishing`,
`delivery` (`"ready"`, `"2028"`, `"2028-06"`), `totalPrice`, `downPayment`,
`installments` (`{"years": 8, "frequency": "quarterly"}`; `{"years": 0}` = cash),
`photosFolder`, `images` (`["photos/<id>/1.jpg"]`), `notes`, `internalNotes`, `sold`.
`settings.whatsapp` is the company number used when a link carries no personal number.

## Deploy on Vercel (free)

1. Push this repo to GitHub.
2. https://vercel.com > Add New > Project > import the repo.
3. **Root Directory**: `property-site`. Framework Preset: Other. Leave build settings empty.
4. **Environment Variables** (before deploying): `STAFF_PASSWORD` = a long password (12+ characters, share it only with staff).
5. Deploy. Your site is `something.vercel.app`; add a custom domain under Settings > Domains if you like.
6. Changing the password later: Settings > Environment Variables > edit, then Deployments > Redeploy.

If `STAFF_PASSWORD` is missing, nobody can log in (it fails closed).

## Preview on your computer

```
cd property-site
STAFF_PASSWORD=test123 node dev.js
```
Open http://localhost:3000 and log in with `test123`. (Needs Node.js.)

## Photos

Google Drive folders cannot be shown as a gallery. Either paste the Drive link in `photosFolder`
(shared as "Anyone with the link") or put 4-8 photos (under ~200 KB each) in `public/photos/<id>/` and
list them in `images`. You can do both.

## Restyling

Brand colors (cream, sage, forest, russet, lime) and Poppins are variables at the top of `public/css/style.css`.
