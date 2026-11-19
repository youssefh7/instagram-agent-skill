# Tendiz Property - unit finder

A static property-listings site. No build step, no dependencies, no database.
Clients filter by budget, bedrooms, compound and ready/off-plan, open a unit page,
and message you on WhatsApp with a pre-filled message naming the unit.

```
units.json        <- ALL your units + your WhatsApp number live here
index.html        <- home page with filters
unit.html         <- unit page (?id=<unit id>)
add.html          <- paste a listing message -> get updated units.json
css/style.css     <- colors/fonts are variables at the top
photos/<unit-id>/ <- optional: put compressed photos here
```

## 1. First-time setup (2 minutes)

Open `units.json` and edit `settings`:

- `whatsapp`: your number, digits only with country code, e.g. `201012345678`
- `agentName`, `siteTitle`

Then delete the sample units (they say "SAMPLE DATA").

## 2. Add a unit

### Easiest: paste a listing message
1. Open `https://YOUR-SITE/add.html` (or run it locally, see below).
2. Paste the message, tap **Read message**.
3. Check the highlighted fields, fix anything wrong.
4. Tap **Copy units.json**, paste it over your `units.json`, redeploy.

The reader understands English and common Arabic wording for price, down payment,
area, garden, bedrooms, finishing, delivery date and installments. It is a best-guess
parser, so always glance at the fields before publishing.

### Or edit `units.json` by hand
Copy any unit block, change the values. Fields:

| field | example | notes |
|---|---|---|
| `id` | `"badya-ground-3br-150"` | unique, lowercase, no spaces. Used in the link |
| `compound` | `"Badya"` | spelled the same way every time (it becomes a filter) |
| `type` | `"Ground apartment"` | |
| `area`, `garden` | `150`, `100` | m². `garden: 0` if none |
| `bedrooms`, `bathrooms` | `3`, `2` | |
| `finishing` | `"Semi-finished"` | free text |
| `delivery` | `"ready"`, `"2028"`, `"2028-06"` | anything except `ready` counts as off-plan |
| `totalPrice`, `downPayment` | `7500000`, `750000` | EGP, plain numbers |
| `installments` | `{"years": 8, "frequency": "quarterly"}` | `frequency`: `quarterly` or `monthly`. Optional `"amount"` overrides the calculated installment. `{"years": 0}` = cash |
| `photosFolder` | Google Drive / Dropbox link | shown as a button |
| `images` | `["photos/my-unit/1.jpg"]` | optional; shown as a swipeable gallery |
| `notes` | `"Corner unit"` | |
| `sold` | `true` | optional; hides the unit without deleting it |

Careful with commas and quotes. Paste the file into https://jsonlint.com if the site shows no units.

## 3. Photos

Google Drive folders can't be shown as a gallery, so there are two options:

- **Folder link only** (zero effort): paste the Drive link in `photosFolder`. The unit page
  shows a "View photos folder" button. Make sure the folder is shared as "Anyone with the link".
- **Gallery on the page** (looks best): put 4-8 photos in `photos/<unit-id>/`, list them in `images`.
  Keep each under ~200 KB (resize to ~1600px wide, e.g. with squoosh.app) so pages load fast on mobile data.
  You can use both: `images` for the gallery plus `photosFolder` for "View all photos".

## 4. Shareable links

Replace `YOUR-SITE` with your address:

| send the client | link |
|---|---|
| up to 6M | `https://YOUR-SITE/?budget=6M` |
| up to 6M, 3 bedrooms | `https://YOUR-SITE/?budget=6M&beds=3` |
| up to 8M, ready only | `https://YOUR-SITE/?budget=8M&delivery=ready` |
| one compound | `https://YOUR-SITE/?compound=Badya` |

Parameters: `budget` (`6`, `6M`, `6.5M`, `6000000`, `750k`), `beds` (`1`-`4`, `4` means 4+),
`compound` (exact name), `delivery` (`ready` or `offplan`). You can also set the filters on the
home page and tap **Share this search**, which opens the phone's share sheet or copies the link.

A unit link looks like `https://YOUR-SITE/unit.html?id=badya-ground-3br-150`.

Heads-up: WhatsApp link previews can't read per-unit details from this kind of site, so a shared
link shows as a plain link with the site title. It still opens the right filtered page.

## 5. Deploy for free

### Netlify (simplest, no account setup beyond sign-up)
1. Sign up at https://app.netlify.com (free).
2. Go to https://app.netlify.com/drop and drag the whole `property-site` folder onto the page.
3. You get a `something.netlify.app` URL. Rename it in Site settings > Change site name.
4. **To update later**: Deploys tab > drag the folder again onto "Drag and drop your project output here".

### Netlify or Vercel from GitHub (updates on every save)
1. Push this repo to GitHub.
2. Netlify: Add new site > Import from Git > pick the repo. Set **Base directory** `property-site`,
   leave build command empty, **Publish directory** `property-site`.
   Vercel: Add New > Project > import the repo, set **Root Directory** to `property-site`,
   Framework Preset "Other", no build command.
3. Edit `units.json` right on github.com (pencil icon), commit, and the site redeploys in ~30 seconds.
   This means you can add units from your phone.

A custom domain (e.g. `homes.yourname.com`) can be attached in the site's Domain settings on either service.

## 6. Preview locally

```
cd property-site
python3 -m http.server 8000
```
Open http://localhost:8000. (Opening the files by double-click won't work: the browser blocks loading `units.json`.)

## Restyling

Colors follow the Tendiz brand PDF (cream, sage, forest, russet, lime) and the font is Poppins. They are variables at the top of `css/style.css`.
