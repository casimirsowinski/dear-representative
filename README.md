# Dear Representative

A privacy-conscious React + TypeScript + Vite civic contact tool for current U.S. congressional members (imported from unitedstates/congress-legislators) with a congressional leadership campaign.

## Contact multiple offices

Section 01 starts with the shared office and template-length selectors, followed by optional name/city fields. `MessageComposer.tsx` owns these shared inputs; `MultiOfficeContact.tsx` owns recipient choices, manual completion, and a draft map keyed by stable legislator IDs. `RecipientMessage.tsx` supplies each card's editor, exact-text copy, reset, and Undo. The shared `draftReducer` retains its existing behavior; `personalizedDraft.ts` adds tracked generated ranges to recipient snapshots so text, baseline, origin, and personalization ownership restore together. Social drafts remain unchanged.

A selected House member appears with both senators; choosing a senator shows both senators without assuming a House district. Additional offices can be selected in an expandable area, with no duplicate cards. New recipients initialize with the selected length and their own chamber-specific template. Existing drafts survive length changes, removal, re-addition, and carousel navigation. **Reset all selected messages** explicitly replaces only selected recipients with the chosen length. Each changed card has its own Undo, available until its next edit or replacement; hidden recipients are unaffected. Individual Reset and Undo affect only that card.

**Copy message** copies exactly the recipient editor, including all visible edits and personalization. There is no hidden subject, signature, preview, or second copy action. Subject metadata remains separate from contact-form text.

Optional name/city values generate visible lines only when supplied: a name adds “Sincerely,” and the name; a city adds the city and state. Empty values add nothing. Generated text is tracked by exact ranges, never by searching for matching names or phrases in the body. Shared changes update those ranges in all stored drafts, including temporarily hidden recipients. Manually editing or deleting a generated range transfers ownership of that field to the visitor for that recipient. Reset explicitly generates a fresh template with current shared values; Undo restores the previous text and range ownership exactly, without immediately replaying shared values.

For ambiguous broad edits (for example, pasting over a selection that spans body and signature), all generated fields touched by the contiguous edit become manual. Adding text at the end of a generated line also makes that field manual. This conservative behavior preserves visitor text; Reset restores automatic management. Trimming optional input values treats whitespace-only fields as empty. Copying itself never trims or transforms editor text.

Cards fit three across at wide desktop sizes and scroll horizontally on smaller screens, with snapping, Previous/Next arrows, and Arrow/Home/End keys when the collection itself is focused. Editor keys retain their normal behavior. Touch/trackpad scrolling remains native; no mouse-drag handler is installed. The scrollbar is hidden, but the next card peeks into view on narrower screens. All input/select/textarea fonts are at least 16px, and the responsive viewport allows user zoom. Desktop emulation does not establish that iPhone focus zoom or previously saved browser zoom has been resolved on physical devices.

**Open all N forms** attempts only selected, verified form URLs synchronously from its click handler, using opener/referrer isolation. Browsers may block multiple tabs; null results cannot reliably distinguish blocking from isolation, so feedback reports attempts and unconfirmed openings rather than success. Individual links remain available. Sources, social links, and office-specific restrictions are in each card's details. No draft is put in a URL or sent automatically.

**Completed by me** is a manual reminder, never inferred from opening a form or dialer. All drafts, sender values, selections, and completion flags stay only in React memory until reload or closing. Nothing is saved to storage, URLs, or external services.

## Social drafts and account maintenance

The page has five full-width sections: **01 / Email, Form & Phone**, **02 / Social**, **03 / Petitions**, **04 / Directory**, and **05 / Sources & Context**, with matching header navigation. `App` owns the shared official selection; each composer retains its independent draft and Undo state. Each recipient card has one editable message with visible optional personalization; Copy copies it exactly. Social is always visible beneath its section heading and decorative hand-drawn icons.

The **Social** section contains a separate, initially empty in-memory draft. It works even without a verified account. Switching officials, platforms, or letter templates retains social text; review recipient references before posting. **Use existing short template** explicitly replaces the social draft with the unchanged rendered House/Senate body. **Reset social draft** clears only this draft. Both replacements offer inline Undo instead of confirmation dialogs. Sender fields and handles are never inserted automatically.

Copy and Open are separate actions. Profile/platform URLs contain no draft text; visitors paste, review, and submit on the external platform themselves. Social profiles are not verified constituent correspondence channels. Social posts may be public, platforms have their own privacy practices, and a response is not guaranteed. No SDK, authentication, remote avatar, background API request, persistence, or new dependency is used. Clipboard fallback is best-effort `execCommand('copy')`, with focus/selection restoration and manual-copy guidance on failure; it does not guarantee mobile compatibility.

`SocialAccount` in `src/types/index.ts` distinguishes official-office, personal, campaign, and unknown classifications independently of verification status. Optional `Legislator.socialAccounts` records live alongside the state data, separate from `contacts`. Only verified official-office Bluesky/X records with matching HTTPS profile URLs are rendered. `src/lib/social.ts` contains filtering, URL validation, and counting; `SocialComposer.tsx` reuses `renderBody` and the shared clipboard helper without changing the letter editor.

Bluesky counts [300 Unicode grapheme clusters](https://github.com/bluesky-social/bsky-docs/blob/main/docs/advanced-guides/intent-links.md). `Intl.Segmenter` supplies the count when supported; otherwise the UI explicitly reports exact counting unavailable. X displays guidance for its [standard 280-weighted-character limit](https://docs.x.com/fundamentals/counting-characters), without an inaccurate exact counter. Overlength drafts remain editable/copyable and are never truncated. Final validation and mention recognition belong to the destination platform. Instagram, native sharing, prefilled intents, and social-specific campaign templates are deferred.

### Social accounts in generated member data

X/Twitter handles currently come from `legislators-social-media.json` during `npm run generate:legislators`. Bluesky is **not** published in that dataset, so generated records omit Bluesky rather than inventing handles. Profile destination pages are not interaction-tested by the importer; `lastVerified` is the generation date. For a deeper hand review of Bluesky or classification disputes, record evidence separately and/or extend the generator — do not guess missing accounts. Tests validate structure and URLs, not real-world ownership. No visitor-triggered network calls. The office picker is a type-ahead autocomplete over the full national list (~500 members); directory and multi-office cards stay scoped to the selected member’s state delegation.

## Run

```bash
npm install
npm run dev
```

Use Node.js 24 LTS. For a reproducible install from the lockfile, use `npm ci`.

Development checks:

```bash
npm run generate:legislators   # refresh all current officials from congress-legislators (network; commit the result)
npm test
npm run typecheck
npm run build
```

Tests use Vitest, jsdom, and React Testing Library as development-only dependencies. They cover exact original wording for all six templates, placeholder rendering, optional sender fields, chamber selection, editing, copying, reset, petition filtering, and data consistency. `npm run preview` serves the production build locally. CI uses the checked-in generated file (no network required for ordinary builds).

Build for static hosting:

```bash
npm run build
```

Vite uses `base: '/'` for hosting at the root of `https://dear-representative.org/`. HTTP (`npm run dev`) and optional local HTTPS (`npm run dev:https`) remain available. Local certificates are not used by production builds.

## GitHub Pages deployment

`.github/workflows/deploy-pages.yml` runs on pushes to `main` or **Actions → Deploy GitHub Pages → Run workflow** (select `main`). Other manually selected branches are skipped. Node.js 24 runs `npm ci`, tests, typechecking, and `npm run build`; only `dist/` is uploaded through the official Pages artifact action. A separate job deploys it into the `github-pages` environment. Builds have read-only repository access; only deployment has `pages: write` and `id-token: write`. The `pages` concurrency group queues updates without cancelling an active deployment. No personal access token, DNS secret, or deployment branch is needed. See [GitHub's workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### One-time GitHub settings

1. In repository **Settings → Actions → General**, ensure GitHub Actions and the official `actions/*` actions used by this workflow are permitted. The workflow declares its own token permissions; do not enable general repository write access just for deployment.
2. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
3. Prefer verifying domain ownership in the owner's account/organization **Settings → Pages** using GitHub's supplied TXT record. Keep that verification record afterward. Follow [domain verification instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).
4. In repository **Settings → Pages → Custom domain**, save `dear-representative.org` before pointing DNS at Pages. Custom Actions deployments use this setting, not a repository `CNAME` file.
5. Check **Settings → Environments → github-pages** allows deployment from `main`. Complete any required environment approvals when deploying.

### Namecheap DNS

For a domain using Namecheap BasicDNS/PremiumDNS/FreeDNS, open **Domain List → Manage → Advanced DNS → Host Records**. If authoritative nameservers are elsewhere, edit records at that DNS provider instead. Use Automatic TTL. Remove conflicting parking/URL Redirect records for `@` and `www`, while retaining unrelated email and verification records. [Namecheap record instructions](https://www.namecheap.com/support/knowledgebase/article.aspx/319/2237/how-can-i-set-up-an-a-address-record-for-my-domain/)

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `casimirsowinski.github.io` |

The `www` target is the repository owner's GitHub Pages hostname, without a protocol or repository path. Update it if the repository transfers owners. GitHub can redirect `www` to the configured apex domain. Avoid wildcard records. IPv6 is optional: if adding apex AAAA records, use all four GitHub values `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`; remove conflicting old AAAA records. Recheck addresses against [GitHub's custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) when maintaining DNS.

### HTTPS and verification

After DNS propagates and GitHub provisions its certificate, enable **Settings → Pages → Enforce HTTPS**. GitHub manages the public certificate; do not upload mkcert certificates or buy/install a Namecheap certificate for this Pages site. Provisioning is not immediate. If HTTPS remains unavailable, check the Pages DNS status, conflicting records, and any restrictive CAA records using [GitHub's HTTPS troubleshooting](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

After reviewing, committing and pushing the source changes:

1. Confirm both workflow jobs succeed and the deployment environment links to `https://dear-representative.org/`.
2. On Windows, inspect DNS with `Resolve-DnsName dear-representative.org -Type A` and `Resolve-DnsName www.dear-representative.org -Type CNAME`.
3. Open the apex and `www` URLs, check HTTPS/redirects, then hard-refresh. Confirm JavaScript/CSS load from `/assets/` without 404s. The root base is intentional; an unconfigured `github.io/dear-representative/` project URL is not a substitute for testing the custom domain.
4. Test official selection, template editing, reset, message copying, phone copying, restriction/source expansion, and petition filtering on desktop and mobile. Check Copy by pasting into a scratch field; do not submit messages or call offices during testing.
5. Confirm the browser has no mixed-content errors and no app-initiated analytics, draft uploads, or persistence. Pages hosting and external destinations have their own privacy practices; hosting does not provide complete anonymity.

Keep `dist/`, dependencies, certificates, CA material, and secrets out of commits. The workflow uploads only the generated static site; never place private files in `public/` or import secrets into client code. GitHub settings, DNS, public HTTPS issuance and live deployment must be verified separately from local build checks.

## Structure

- `src/campaigns/congressional-leadership/` — campaign details, subject, signature, curated petition links, and four independent template files under `templates/{house,senate}/{short,detailed}.ts`.
- `src/campaigns/index.ts` — campaign registry; currently contains one campaign.
- `src/data/states/oregon.generated.ts` — checked-in Oregon legislator records generated from [unitedstates/congress-legislators](https://github.com/unitedstates/congress-legislators) JSON (bioguide IDs, contacts, district phones, X handles).
- `src/data/states/oregon.ts` — Oregon state metadata plus a thin import/guard around the generated officials list.
- `scripts/generate-oregon-legislators.mjs` — build-time importer (no browser/network fetch at runtime).
- `src/data/states/index.ts` — state and legislator registries; only Oregon is populated.
- `src/lib/messages.ts` — pure, reusable placeholder rendering and complete-message composition, with no campaign wording embedded in the renderer.
- `src/types/index.ts` — separate state, legislator, contact method, campaign, message template, sender, and petition types.
- `src/components/` — message composer, delegation directory, and petition directory.
- `src/App.tsx` — connects the current campaign and state to these components.
- `src/styles.css` — responsive styling.

### Editing a campaign

Edit the appropriate chamber/length template file to change a starting message. Campaign-specific values such as leader, office, and Congress belong in `details.ts`; subject and signature text belong in the campaign's `index.ts`. Petitions remain independent external links in `petitions.ts`.

Templates use `{{salutation}}`, `{{officialName}}`, `{{stateName}}`, `{{senderName}}`, `{{senderCity}}`, and keys from campaign details (currently `{{leader}}`, `{{office}}`, `{{congress}}`). Unknown placeholders throw an error so content mistakes are caught by tests. Values are substituted once as literal text. The body renderer uses sender fallbacks; the signature is composed separately using the optional sender inputs so those inputs never overwrite body edits.

Recipient messages initialize with the approved **Short** template for their chamber. **Message length** offers only Short and Detailed. Changing length retains existing drafts; individual Reset or Reset all selected messages explicitly applies the selected length, with independent Undo. Optional personalization remains visible and ownership-aware. Copy message copies exactly the editor, without a subject or hidden signature. Each template keeps its approved subject as metadata; `renderSubject` resolves it by chamber and length.

Both composers independently use `src/lib/draft.ts`, a shared pure reducer holding text, the applied template baseline/origin, and one previous snapshot. Replacement offers an accessible inline Undo with no timer. Undo restores exact prior text, baseline and origin, returns focus to that editor, and does not change current selections or sender fields. Selection changes, copying, and collapsing the social composer keep Undo available. Editing ends that composer's Undo opportunity; a subsequent replacement saves only the immediately preceding draft. An identical reset is a no-op that preserves existing Undo. Drafts and snapshots remain in browser memory only and disappear on reload. Social initialization remains empty; no social-template content is added by this interaction change.

Future campaigns can supply the same six-template structure and their own details and petitions. Future states can supply independent state and legislator data. The UI currently selects Oregon and the congressional leadership campaign; state/campaign selectors and district lookup are not implemented. Contact methods distinguish web forms, websites, email addresses, and phone numbers, with independent verification metadata and method IDs.

### Maintaining contact data (congress-legislators import)

Oregon dropdown data is **generated**, not hand-edited. The reusable `ContactActions` component is shared by the composer and directory. `src/lib/contacts.ts` formats canonical U.S. numbers and selects relevant restriction notices. **No visitor-triggered network fetch** of legislator data runs in the browser.

Refresh Oregon officials from the documented public JSON endpoints:

```bash
npm run generate:legislators
```

Pinned sources (unitedstates.github.io):

- `https://unitedstates.github.io/congress-legislators/legislators-current.json`
- `https://unitedstates.github.io/congress-legislators/legislators-social-media.json`
- `https://unitedstates.github.io/congress-legislators/legislators-district-offices.json`

The script writes `src/data/states/oregon.generated.ts`, validates required fields (bioguide id, website, D.C. phone, two senators, House districts 1–6 for OR), and **fails with a clear error** instead of writing an empty dropdown. Commit the regenerated file after review. Generation dates become `lastVerified` / functionality `checkedAt` values — they mean “present in congress-legislators on this date,” not hand-tested form submissions.

Mapping rules:

1. Stable key: Bioguide id (`id.bioguide`).
2. Contact-form URL: `term.contact_form` when present, otherwise the official site URL (`term.url`). Deep office-specific form paths from prior hand curation are not invented.
3. Phones: `term.phone` as Washington, D.C.; district-office phones from `legislators-district-offices.json`. Canonical `+1` format. Fax numbers are ignored.
4. Emails: never invented (congress-legislators does not supply constituent inboxes here).
5. Social: X/Twitter handles from `legislators-social-media.json` when present. Bluesky is omitted because that dataset does not publish it.
6. Restrictions: generated records use an honest `unknown-policy` entry; they do not claim address-verification or residency blocks without separate research.

Expand to another state later:

```bash
npm run generate:legislators -- --state=WA --out=src/data/states/washington.generated.ts
```

Then add a thin wrapper like `oregon.ts`, register it in `src/data/states/index.ts`, and extend the UI selector. The importer already accepts any postal code.

After regenerating:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

Intentional differences from the former hand-curated `oregon.ts`: slug ids → bioguide ids; some official_full names (for example `Val T. Hoyle`, `Janelle S. Bynum`); form URLs often less deep when `contact_form` is missing; district phones included; Bluesky handles not carried over; restriction/address-verification notes no longer hand-asserted; verification metadata labeled as generated from congress-legislators.

The contact UI shows the official form, Washington, D.C. location label, and a clickable phone number beside a compact **Copy** button. The number itself is the `tel:` link; calling occurs only when the visitor activates it. At the bottom of the composer, a labeled **Selected representative** area keeps the official's name, title and actions together above any expandable details. Sources, dates, testing scope and noncritical restrictions remain under **Sources and contact details**. Only verified response policies, verification steps, or submission blocks affecting displayed methods receive prominent notices. Phone numbers and websites remain available regardless of those notices.

### Phone copying and mobile testing

Phone copying first uses `navigator.clipboard.writeText` when available. If unavailable or rejected, it attempts a temporary selected-text copy using deprecated `document.execCommand('copy')`. This is a best-effort compatibility fallback, not guaranteed mobile support. It removes the temporary element and restores focus, input/textarea caret or selection, and document selection. It captures that state immediately before fallback so delayed permission rejection does not restore an outdated editing position. Success is announced only after the Clipboard API resolves or the fallback reports success; otherwise the visible number can be copied manually. Feedback uses a polite live region. Complete-message copying retains its existing behavior and manual-copy guidance.

HTTP `localhost` is generally treated as a secure context, while HTTP on a LAN IP such as `192.168.1.49` is not. This can make the asynchronous Clipboard API unavailable on a phone accessing the development server. HTTPS still does not guarantee clipboard permission. No security flags or browser protections need to be changed. See [Clipboard API requirements](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) and [legacy copy limitations](https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand).

For manual browser checks, use narrow widths (including 320px), keyboard navigation and a real phone. Verify that the phone link and Copy button remain readable, focus outlines are visible, the selected official updates, sources still expand, and restrictions remain visible. Paste a copied number into a scratch field to confirm the actual clipboard contents; also test denied/unavailable clipboard access and manual selection. Do not call an office or submit a message during testing. Automated DOM tests cover the fallback and restoration paths but cannot establish real-device clipboard compatibility.

### Optional HTTPS development (Windows 11)

`npm run dev` still starts HTTP. `npm run dev:https` uses a separate Vite configuration and local certificates; production builds and previews do not require certificates. No npm dependencies are added. Vite's host/CORS defaults are retained. HTTPS binds to local network interfaces on port 5173; run it only on a trusted private network.

Install [mkcert](https://github.com/FiloSottile/mkcert) using PowerShell:

```powershell
winget install --id FiloSottile.mkcert --exact --scope user --source winget
```

Open a new terminal so `mkcert` is on PATH. If needed in the current terminal, use `& "$env:LOCALAPPDATA\Microsoft\WinGet\Links\mkcert.exe"` in place of `mkcert`.

**One-time trust setup:** run `mkcert -install` only when you intend to install its development CA into Windows/browser trust stores. Review any elevation/security prompt; administrator access or trust changes require your approval. Restart browsers afterward. Generating a certificate alone does not install trust.

From the repository root, generate the server certificate (replace the LAN IP if necessary):

```powershell
New-Item -ItemType Directory -Force .certs | Out-Null
mkcert -cert-file .certs/localhost.pem -key-file .certs/localhost-key.pem localhost 127.0.0.1 192.168.1.49
npm run dev:https
```

Open `https://localhost:5173/` or `https://127.0.0.1:5173/` on the PC. On a phone on the same LAN, use `https://192.168.1.49:5173/` after installing the public CA certificate as described below. `localhost` on a phone means the phone itself. Stop the HTTP server first if it occupies port 5173; HTTPS intentionally reports a port conflict rather than silently choosing another port.

To regenerate after a LAN IP change, find the active adapter's IPv4 address with `ipconfig`, stop Vite, and rerun the generation command with the new IP and the same filenames. Restart HTTPS and use the new URL. Reusing the same CA does not require reinstalling phone trust. Missing/unreadable certificates produce a setup error instead of falling back silently to HTTP.

**Certificate files and Git:** `.certs/` holds the server certificate and its private key. `mkcert -CAROOT` prints the separate user-profile CA directory. `.gitignore` excludes `.certs/`, local tools, certificate/key extensions and `rootCA*`; Vite denies access to these local files. Never put any certificate material in `public/` or import it into application code. Never force-add ignored files.

- `rootCA.pem` is the **public CA certificate**. Transfer only this file privately to your own testing phone; a copy may be renamed `rootCA.crt` if required by the phone's file picker.
- `rootCA-key.pem` is the **CA private key**. Never copy, share, publish, commit or transfer it to a phone. It can sign certificates trusted by devices that trust this CA.
- `.certs/localhost-key.pem` is the **server private key**. Keep it on the development PC; phones do not need it.

**iOS:** open the public CA certificate, install its profile under Settings → General → VPN & Device Management (or Profile Downloaded), then enable it under Settings → General → About → Certificate Trust Settings → Enable Full Trust for Root Certificates. See [Apple's instructions](https://support.apple.com/en-us/102390). Only trust a CA you generated and control.

**Android:** transfer the public CA certificate, then search Settings for “Install a certificate.” On many devices the path is Security & privacy → More security settings → Encryption & credentials → Install a certificate → **CA certificate**. Confirm the warning and select the public CA file. Labels vary by manufacturer and Android release; this is CA trust, not a Wi-Fi/client certificate installation. Restart the browser. Some browsers, apps or managed devices do not accept user-installed CAs; verify in the actual browser rather than assuming trust. Remove the development CA from the phone when no longer needed.

**Test Copy:** first verify the browser shows HTTPS without a certificate warning. Click the phone number's **Copy** button and paste into a local scratch field; do not initiate a call. A browser console, when available, should report `window.isSecureContext === true`. Clipboard permissions and user-gesture requirements still apply. A success message alone does not replace testing the paste result on your phone.

**Troubleshooting:**

- Connection timeout: confirm the current IP, same LAN, no guest Wi-Fi/client isolation or interfering VPN, and that Vite is running. Windows Firewall may require allowing Node/TCP 5173 on the **Private** network profile, preferably restricted to the local subnet. Review administrator prompts; do not disable the firewall or open router ports.
- Certificate warning: confirm that the URL's IP appears in the generated certificate, the same public CA is trusted, device clocks are correct, and browsers have restarted. Do not bypass warnings or change browser security flags. If the CA itself changes, reinstall the new public CA on testing devices.
- Firefox on Windows: mkcert may report that automatic Firefox trust setup is unavailable. If Firefox does not use the Windows trust entry, import only `rootCA.pem` into Firefox Settings → Privacy & Security → Certificates → View Certificates → Authorities, and allow it to identify websites. Do not import the CA private key.
- `mkcert` not found: reopen PowerShell or use the installed executable path above. To inspect the CA location, use `mkcert -CAROOT`; do not display or transmit private-key contents.
- Copy still fails over trusted HTTPS: check browser permissions and test from a direct button tap. Use manual selection if copying is blocked; the legacy fallback is not guaranteed on mobile.

Installing mkcert, generating certificates, and installing CA trust are separate steps. Nothing in `npm run dev:https` performs installation, generation, trust-store changes, or phone setup automatically.

Validate changes with:

```bash
npm test
npm run typecheck
npm run build
git diff --check
```

### Privacy

Message generation and editing occur entirely in the browser. Names, cities, and drafts exist only in component memory; they are not transmitted, logged, or persisted. Copying writes the complete message to the visitor's clipboard only when requested. There is no localStorage/sessionStorage draft persistence, analytics, cookies, tracking, backend, automatic submission, or third-party fetching. External sites and hosting infrastructure have their own privacy practices; this site does not promise complete anonymity.

The always-visible footer disclosure distinguishes local composition and clipboard copying from external congressional/petition sites and GitHub Pages hosting. GitHub Pages may process ordinary technical request information and access logs; see [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). The app does not intentionally collect or save composer information beyond the temporary browser state needed to edit it.

### System themes and visual checks

`src/styles.css` defines semantic light/dark palettes. Light is the default, with CSS `prefers-color-scheme: dark` overrides and native `color-scheme` support. Preference changes apply without reloads, JavaScript, a toggle, cookies or persistence. Numbered sections alternate subtly; cards have separate surfaces, and the selected representative retains its text label and stronger border. Links remain underlined and keyboard focus is outlined across controls.

Theme tests calculate text contrast (at least 4.5:1) and meaningful control/focus contrast (at least 3:1) from the actual CSS tokens. These checks target WCAG AA but are not a complete accessibility audit. When changing colors, rerun tests and inspect both themes at desktop and narrow mobile widths, including native controls, expanded details, focus and copy feedback. Automated DOM tests cannot establish native mobile or screen-reader rendering.

`.gitignore` excludes dependencies, production output, TypeScript build metadata, and `.env`/`.env.*` files, except an intentionally shareable `.env.example` (which must never contain secrets).

## Before public launch

1. Recheck officeholders, contact sources and verification dates against official House and Senate websites. Published-link verification is separate from form functionality testing.
2. Check each petition link, organizer display name, current wording, and signature count. See the [petition verification report](docs/petition-verification.md) for the recorded snapshots and limitations.
3. Add district lookup if needed. ZIP codes alone do not uniquely identify congressional districts; use an authoritative address lookup rather than guessing.
4. Add an accessibility review, browser testing, and optional automated link checks.
5. Never claim messages or signatures were submitted by this site. Users must submit through the linked external services.

No analytics, accounts, backend, automatic submissions, or local-storage persistence are included.

## License

This project is licensed under the Apache License, Version 2.0.
See [LICENSE](LICENSE) for details.

### Optional browser layout regression check

With Node 22+ and Edge installed, run `npm run build` and `npm run preview -- --host 127.0.0.1 --port 4173` in one terminal. In a second PowerShell terminal, launch a **dedicated** headless browser profile and run the dependency-free check:

```powershell
Start-Process -FilePath "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe" -ArgumentList '--headless=new','--disable-gpu','--remote-debugging-port=9224',"--user-data-dir=$((Join-Path $PWD '.tools/layout-browser'))",'about:blank' -WindowStyle Hidden
node scripts/check-contact-layout.mjs
```

The script checks desktop/tablet/320px layouts in both themes, document overflow against `documentElement.clientWidth`, editor focus scale, 16px control fonts, keyboard scrolling, expanded details, and all-eight-office layout. Screenshots go to ignored `.tools/`; the dedicated browser closes afterward. It does not submit forms or verify physical iOS behavior. In particular, it does not reset any zoom setting saved by a visitor's browser.

## Campaign research: Sources & Context

Section 05 uses `src/campaigns/congressional-leadership/research.ts`, typed by `src/types/research.ts`. `SourcesContext.tsx` renders any campaign's topics and methodology without hard-coded politicians or citations. Add evidence entries with stable IDs, subject names, a bounded claim, source URLs/publishers, primary/secondary labels, event or publication dates when confirmed, verification status/date, and limitations. Update verified dates only after checking the supporting content. Pending references may have a `lastChecked` date but must not have a `lastVerified` date. Missing publication dates remain explicitly unconfirmed.

Initial review (2026-11-11) confirms Schumer's Yea votes on Senate roll calls 648 (2025 concurrence in the House amendment to S.1071) and 343 (2023 conference report on H.R.2670). GPO's enrolled S.1071 text confirms the FY2026 NDAA identity despite the older title on the roll-call page; Congress.gov actions confirm enactment. The supplied 2015 GovTrack page was inaccessible and remains a pending lead, with no attributed voting position. The other six topics are research-in-progress scopes, not conclusions about either leader. Expand the record with primary evidence before publishing additional claims; distinguish votes, financial transaction types, organizational classifications, dated polling, and incomplete searches as described in the methodology.

Sources are static links opened by the visitor: no runtime fetching, tracking, scraping, or third-party embeds. Campaign templates are independent and were not changed for this section.
