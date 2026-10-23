# notx.blue

Joselito’s directory of Bluesky projects, with one central privacy page. Plain HTML, small JavaScript modules, Brazilian Portuguese and English. No runtime dependencies, cookies, analytics or third-party scripts.

The app list, secondary links and support destinations live in [`site-data.js`](site-data.js). The renderer and tests read that same file. `links.notx.blue` has no source link because its repository is private.

## Local development

Use Node 20 or later for scripts and tests. No install is needed at the repository root.

```sh
node scripts/serve.mjs
```

Open <http://127.0.0.1:8765>. This small development server supports `/privacy`, sends the configured CSP (without the HTTPS upgrade directive on localhost), and serves the custom 404 with status 404. Alternatively, `python3 -m http.server 8080` works; open `/privacy.html` on that server.

The committed HTML contains the complete Portuguese content. Crawlers and readers without JavaScript can read every page. JavaScript detects English browser preferences, otherwise defaults to Portuguese, and stores an explicit choice as `localStorage.lang`. It updates text, metadata and the document’s `lang` attribute. It does not replace the page’s structure.

The theme follows `prefers-color-scheme` until the reader chooses light or dark. The choice is stored as `localStorage.theme`. `theme-boot.js` runs before the stylesheets, without inline JavaScript, to avoid a flash. Storage failures do not break either control. Unlike the current down.blue reference, this site has two themes and follows the system initially.

## Editing content

```sh
npm run build:html
npm test
npm run check:links
```

`build:html` regenerates `index.html`, `privacy.html` and `404.html`. Edit the data, dictionaries and renderer, rather than those generated files. Tests detect stale HTML.

To add an app:

1. Add its name, unique ID, URL, description key and distinct ink to `site-data.js`. Only add a source URL when the repository is public.
2. Add its description and `privacy.<id>` paragraph to both dictionaries in `i18n/`. Verify its actual behavior before describing data handling. State what is unknown if the implementation is unavailable.
3. Add the matching `.ink-<name>` pair in `assets/site-v1.css` if needed. Every background ink must use its `--on-*` text color.
4. Regenerate HTML and run the tests and optional link check.

`npm test` is offline and uses `node:test`, with no DOM library. It checks data, translations, rendering, links, support chips, privacy coverage, metadata, theme boot behavior, CSP and ink contrast. `npm run check:links` separately checks all external HTTPS destinations from the data file with HEAD and a GET fallback. Non-success responses and connection failures produce a nonzero exit status.

## Styles and preview images

The visual reference is down.blue: Computer Modern fonts, paper surfaces, ink blocks, halftone shadows and the same support-chip classes. notx.blue uses `--ink-blue` with `--on-blue`; down.blue’s card uses its own `--ink-down` pair.

`scripts/ds/` contains the reference’s design-system snapshot. Replace the snapshot to update tokens; do not edit its generated color values. Fonts load from `https://static.joseli.to`, and no font binaries are shipped here.

```sh
npm run build:css
```

This uses the pinned Tailwind 4.3.3 CLI in `scripts/`, installing its development dependencies with pnpm on the first run. The compiled CSS is committed in `assets/`; deployment does not install or run Tailwind. Site-specific layout rules live in `assets/site-v1.css`. Both CSS URLs are immutable: change their versioned filenames and the renderer references whenever their contents change after a deployment.

`scripts/og.html` is the intended 1200 × 630 preview. With Chrome installed:

```sh
bash scripts/build-social.sh
```

This writes `og.png` and the legacy `share.png` URL. Chrome could not launch in the implementation environment, so the committed PNG is a simple fallback rendered with ImageMagick and system Georgia/Arial fonts. To reproduce it on macOS, run `bash scripts/build-social-fallback.sh`; other systems can set `FONT` and `BODY_FONT` to local font files. The site itself uses the design-system fonts. The favicon is a small blue typographic mark.

## Deploying

Netlify publishes the root and serves `privacy.html` at `/privacy` through pretty URLs. `netlify.toml` defines the CSP, security headers and immutable asset caching. No redirects or `_headers` file are needed.

The build checks generated HTML, then **prunes the working directory** to the published file allowlist. Run a CLI deployment from a disposable export, never the development checkout. After committing your changes:

```sh
mkdir -p .netlify/draft
# Start with an empty draft directory for each export.
git archive HEAD | tar -x -C .netlify/draft
cd .netlify/draft
npx netlify-cli deploy --build --dir=. --site=peppy-lamington-52fcd7
```

This is a draft command; omit `--prod`. `--build` is required: using only `--dir=.` would expose development files. The build prunes scripts, tests, package manifests, README, config and other non-published files. Netlify’s own `.netlify` state and Git metadata are retained for tooling and ignored by its uploader. No deploy or push was performed during implementation.

## Privacy evidence and limits

The policy is dated 2026-10-23. It is based on these read-only local references:

- **links.notx.blue:** `src/ui/privacy.ts`, privacy strings in `src/i18n.ts`, `src/oauth.ts`, `server/proxy.ts` and `netlify/functions/image-proxy.ts`. Browser OAuth tokens, public icon blobs and the stateless image proxy are described separately from infrastructure logging.
- **down.blue:** `index.html`, `README.md` and `extension/privacy/index.html`. Browser-side downloads, local history, external APIs and the extension are covered. The bot and iOS shortcut were not audited.
- **sorteio.blue / skypicker.site:** the `next15-oauth` branch, particularly `lib/oauth/session.ts`, `stores.ts`, `lib/atproto.ts`, `lib/raffle.ts`, `lib/snapshot.ts` and the OAuth, AT and snapshot routes. There was no policy to reuse: the description is derived from code. Production parity is unconfirmed. The encrypted cookie has a configured 30-day lifetime; login states expire after 10 minutes. Signed result URLs contain readable winner data and have no expiration in the reviewed format. Session failures can log DIDs and errors.
- **share.notx.blue:** `docs/store/README.md`, `SUBMISSION.md`, the manifest and JavaScript in `crx/`. The reviewed version is 2.0.0; store documents say it has not been submitted. Older installed versions may differ. Settings use browser sync storage.
- **handles.notx.blue:** the public directory responds, but no local implementation was found. Data storage, analytics, logs and retention remain unverified.
- **enquete.notx.blue:** HTTP 200, but the entire response was “breve, siga @joseli.to e @joselito.dev.br”, without an HTML title or description. It is labeled coming soon; no voting or data practices are asserted.
- **trending.notx.blue:** redirects to its public GitHub repository, which responds with 200 and marks the project discontinued because Bluesky now has trending topics. It remains listed with that status. Historical data practices are unverified.

Netlify’s [logging documentation](https://docs.netlify.com/manage/monitoring/log-drains/) describes IP addresses in traffic logs; the active account’s retention configuration was not verified. Bluesky’s [account-management documentation](https://docs.bsky.app/blog/account-management) describes revoking connected OAuth apps. The policy does not claim that every linked app has no ads, sells no data, targets no children or shares one hosting provider: those blanket claims were not supported by the reviewed sources.

The secondary bots, labels, additional handle-domain services and their retention are not audited. `pessoas.dev` and `ceuazul.online` responded with 200; `codafofo.xyz` refused the connection and was omitted. `sou.blue` is omitted as requested.

## Verification limits

All 31 listed external HTTPS destinations responded successfully during implementation. Local HTTP checks cover `/`, `/privacy`, `/404.html`, the real 404 status for an unknown path, and referenced assets. Chrome headless exited before starting its debugging endpoint, so visual checks at 360px and 390px, keyboard interaction and real-browser persistence remain to be performed. The responsive layout and contrast checks are implemented, but automated HTML tests do not establish full browser accessibility.

## Project layout

```text
index.html, privacy.html, 404.html  Committed Portuguese pages
site-data.js                      Shared link and app data
i18n/, i18n.js                     Dictionaries and translation helpers
main.js, theme.js, theme-boot.js   Browser behavior
assets/                           Committed versioned CSS
scripts/render.mjs                HTML generation
scripts/build-css.sh, ds/          Design-system tooling and snapshot
scripts/check-links.mjs            Optional network checks
scripts/serve.mjs, prune.mjs       Local server and deployment pruning
test/                             Offline Node tests
netlify.toml                      Hosting and security configuration
favicon.svg, og.png, share.png     Site and sharing artwork
robots.txt, sitemap.xml            Search discovery
```

## License

MIT. Copyright © 2026 Joselito. See [LICENSE](LICENSE).
