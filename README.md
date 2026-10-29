# notx.blue

The home of Joselito's Bluesky projects, with one central privacy policy for all of them. Plain HTML, a few small JavaScript modules, Brazilian Portuguese and English. No runtime dependencies, cookies, analytics or third-party scripts.

The app list, the secondary links and the support chips (Pix, Buy Me a Coffee, GitHub Sponsors) live in [`site-data.js`](site-data.js). The renderer and the tests read that same file.

## Local development

Node 20 or later. Nothing to install at the repository root.

```sh
node scripts/serve.mjs
```

Open <http://127.0.0.1:8765>. The development server handles `/privacy`, sends the site's CSP (without the HTTPS upgrade on localhost) and serves the custom 404 with status 404.

The committed HTML holds the full Portuguese content, so crawlers and readers without JavaScript see every page. JavaScript switches to English when the browser prefers it, remembers an explicit choice in `localStorage.lang`, and updates text, metadata and the `lang` attribute without rebuilding the page.

There are three themes, as in down.blue: light, dark and terminal. The site starts light; one button cycles through the themes and remembers the choice in `localStorage.theme`. `theme-boot.js` runs before the stylesheets so the page does not flash.

## Editing content

```sh
npm run build:html
npm test
npm run check:links
```

`build:html` regenerates `index.html`, `privacy.html` and `404.html`. Edit the data, the dictionaries and the renderer, never the generated files; the tests catch stale HTML.

To add an app:

1. Add its ID, name, URL, description key and ink to `site-data.js`, plus a matching `.nx-ink-<name>` pair in `assets/site-v2.css`. `listed: false` keeps it off the home page. Add a source URL only when the repository is public.
2. Add its description and its `privacy.<id>` paragraph to both dictionaries in `i18n/`, describing what the app actually does with data.
3. Every ink background uses its `--on-*` text color (at least 4.5:1; the tests check it).
4. Regenerate the HTML and run the tests.

`npm test` runs offline with `node:test`. `npm run check:links` checks every external link in the data file.

## Page titles

Every page's `<title>`, `og:title` and `twitter:title` read `<page description> • <domain>` (U+2022 with one space on each side), with the description in the page's language: `Projetos para o Bluesky • notx.blue`.

## Styles and the social image

The visual reference is down.blue: centered wordmark with an ink block, language and theme buttons at the top right, ink-headed panels, and the same footer. The `.db-*` rules in `assets/site-v2.css` come from down.blue; the `.nx-*` rules are specific to this site. notx.blue uses the blue ink; each app row uses that app's own ink.

`scripts/ds/` holds a snapshot of the design system. Fonts load from `https://static.joseli.to`.

```sh
npm run build:css
bash scripts/build-social.sh
```

The first rebuilds the committed Tailwind CSS with the pinned CLI in `scripts/`. The second renders `scripts/og.html` with Chrome into `og.png` and `share.png` (1200 × 630).

## Deploying

The site is on Netlify, which serves `privacy.html` at `/privacy`. `netlify.toml` sets the CSP, the security headers and immutable caching for `assets/`.

The build command prunes the working directory down to the published files, so deploy from a throwaway export, never from your checkout:

```sh
dir=$(mktemp -d)
git archive HEAD | tar -x -C "$dir"
cd "$dir"
node scripts/render.mjs --check
grep -v '^  command' netlify.toml > ../netlify.toml.tmp
node scripts/prune.mjs
mv ../netlify.toml.tmp netlify.toml
npx netlify-cli deploy --dir . --site 388f9139-62ce-49ed-aa82-6a33a4085256  # peppy-lamington-52fcd7 (lookup by name fails)
```

Add `--prod` to publish.

## Project layout

```text
index.html, privacy.html, 404.html  Generated pages (Portuguese)
site-data.js                        Apps, links and support chips
i18n/, i18n.js                      Dictionaries and translation helpers
main.js, theme.js, theme-boot.js    Browser behavior
assets/                             Compiled CSS
scripts/render.mjs                  HTML generation
scripts/build-css.sh, ds/           Design-system tooling and snapshot
scripts/check-links.mjs             Link checker
scripts/serve.mjs, prune.mjs        Local server and deploy pruning
test/                               Offline tests
netlify.toml                        Hosting and security headers
favicon.svg, og.png, share.png      Icon and social image
robots.txt, sitemap.xml             Search discovery
```

## License

GPL-3.0-only, with additional terms under section 7 (attribution, renamed forks, no use of the names). See [LICENSE](LICENSE) and [NOTICE](NOTICE).
