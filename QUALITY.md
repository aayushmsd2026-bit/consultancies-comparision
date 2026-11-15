# Quality report

Measured on 15 November 2026 against the fictional demo data, on a production build.

## Lighthouse (mobile, slow 4G)

Targets from `CLAUDE.md`: Performance 90+, Accessibility 100, SEO 100.

| Page | | Performance | Accessibility | SEO | Largest paint | Layout shift |
| --- | --- | --- | --- | --- | --- | --- |
| Home `/en` | before | 96 | 100 | 100 | 0.9 s | 0 |
| | **after** | **99** | **100** | **100** | 1.0 s | 0 |
| Profile `/en/consultancies/example-education` | before | 82 | 93 | 100 | 4.1 s | 0.09 |
| | **after** | **96** | **100** | **100** | 0.9 s | 0 |
| Review form `/en/review/new` | before | 94 | 100 | 100 | 0.9 s | 0 |
| | **after** | **91** | **100** | **100** | 0.9 s | 0 |

Also measured after the changes: Nepali profile 96 / 100 / 100, directory 99 / 100, a guide 98 / 100.

Notes:

- Scores move a few points from run to run. The review form is the closest to the limit (91 to 94), because it loads the form checks.
- The largest paint is under 2.5 seconds on every page measured.
- SEO is measured with the site in live mode. Test and preview sites are hidden from search engines on purpose, because they hold demo data.
- These are lab numbers from this machine. Measure again on the real address after launch (see `README.md`).

### What changed the scores

- **Profile and guide pages now arrive as complete HTML.** Before, the page showed a grey placeholder and swapped the real content in. That cost 3 seconds of "largest paint" in the test and made the footer jump.
- Rating bars and the demo banner were restructured so screen readers read them correctly.
- The logo link, language switch and breadcrumbs got larger tap targets (44px).
- A favicon was added (the missing file was a console error).
- The search box inside the review form was a form inside a form. Browsers break that silently. Fixed.

## Accessibility pass

| Check | How it was checked | Result |
| --- | --- | --- |
| Contrast | `src/config/palette.test.ts`: 30 text and background pairs, in light and dark mode. Plus the axe scanner on 13 pages. | Pass |
| Automatic scan (WCAG 2.2 AA) | axe on 13 pages in light mode and 4 in dark mode, phone and desktop | No problems found |
| Keyboard only | Tests: skip link, visible focus ring on every control of the home page, tabs with arrow keys, search with arrows and Enter, Ctrl+K search, the whole review form, admin shortcuts | Pass |
| Screen reader labels | axe (names, roles, landmarks, headings). Icons are hidden from screen readers and always have a word next to them. | Pass in the scanner. **Not tested with a real screen reader.** |
| Focus states | One 3px ring style for the whole site. A test checks it on the home page. | Pass |
| Reduced motion | Test with "reduce motion" on: nothing is hidden, nothing moves, fades stay | Pass |
| Tap targets | Test on the 360px layout: every button and link is at least 44px tall | Pass |

## The checklist in DESIGN.md section 11

- [x] **Works with one hand on a 360px phone.** No sideways scrolling on any page (tested), bottom tab bar, tap targets 44px or more. *Checked in an emulated phone, not on a real one.*
- [x] **A new visitor finds a consultancy and its registration status in under 10 seconds.** Type a name on the home page. The suggestion list already shows the registration badge. The automated test does it in about 1.5 seconds. *Not timed with real people.*
- [x] **Every text and background pair passes the contrast test.**
- [x] **Keyboard only: every action is reachable, focus is always visible.**
- [x] **Reduced motion mode looks complete, not broken.**
- [ ] **Nepali pages look as good as English pages.** *Partly.* Layout, fonts, Nepali digits and Bikram Sambat dates work and are tested. But all Nepali text was written by an AI and needs a native reader, and the preview pictures for shared links are in English only.
- [x] **Lighthouse mobile: Performance 90+, Accessibility 100.**
- [ ] **The `/styleguide` page shows every component in every state.** *Partly.* Every component is there, in light and dark mode, in both languages, with its main variants (for example all four registration states, loading and disabled buttons, an error on a field). It does not show every hover and pressed state as a still picture. Those you see by using it.
- [x] **The palette file names the Wada combination number and colour names used.** Combination 166 in `src/config/palette.ts`.

## Honest gaps

- Nothing was tested on a real phone or with a real screen reader.
- "60 frames per second on a mid-range Android phone" was not measured. Animations use only `transform` and `opacity`, which is the cheap kind. The count-up numbers change text, which is small.
- The "name and score morph from the list card to the profile" effect uses the browser's View Transitions. It works in current Chrome, Edge and Safari. Other browsers simply change page without the effect.
- The real Google sign-in button could not be tested here. Everything around it is tested with a test sign-in.
