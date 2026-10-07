# STAA Website — Smile Tax & Accounting Advisory

A static website in plain HTML, CSS and JavaScript. It has no frameworks and no build step, so you can open it in VS Code and edit it directly.

## Preview it

1. Open the `staa-website` folder in VS Code.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click `index.html` and choose **Open with Live Server**.

Double-clicking `index.html` also works, but Live Server reloads the page every time you save.

## Folder structure

```
staa-website/
├── index.html        Home: hero, services, why STAA, tax health check, approach, CTA
├── about.html        Overview, vision & mission, objectives, who we serve, team
├── services.html     All 5 practice areas, with a sticky side menu
├── insights.html     Articles/blog grid with topic filter (placeholder articles)
├── contact.html      Contact details, enquiry form, map (loads after cookie consent), FAQ
├── privacy.html      Privacy & cookie policy (Tanzania PDPA 2022)
├── 404.html          "Page not found" page (most hosts use it automatically)
├── ai-assistant/     Optional: Cloudflare Worker that adds AI (Claude) answers. See its README
└── assets/
    ├── css/style.css     All styling. Brand colours and fonts are at the top.
    ├── js/main.js        Menu, animations, health check, form, filters, cookie banner
    ├── js/assistant.js   "Ask STAA" chat assistant (FAQ answers + WhatsApp handoff)
    ├── data/faq.json     The assistant's questions and answers: edit this to change them
    └── img/
        ├── logo-light.png   Logo for dark backgrounds (header/footer)
        ├── logo-dark.png    Logo for light backgrounds
        ├── mark.png         The arrow "S" mark on its own
        ├── favicon.png, apple-touch-icon.png
        └── placeholders/    Image placeholders, each labelled with its size
```

## Replacing the placeholder images

Each placeholder shows its file name and recommended size. To swap one:

1. Save the real photo into `assets/img/` (for example, `hero.jpg`), ideally as a compressed JPG or WebP under 300 KB.
2. In the HTML, change the `src` (for example, `assets/img/placeholders/hero-consultation.svg` becomes `assets/img/hero.jpg`).
3. Update the `alt` text so it describes the photo.

| Placeholder | Used on | Size |
|---|---|---|
| hero-consultation.svg | Home hero (now an illustration at `assets/img/hero-consultation.svg`; swap for a photo if you have one) | 1200×1400 |
| about-office.svg | About (done: now `assets/img/about-team.jpg`) | 900×1100 |
| team-member.svg | About → team (×4) | 800×1000 |
| service-*.svg (5 files) | Services, Insights | 800×600 |
| contact-map.svg | Contact (swap for a Google Maps embed) | 1200×700 |
| og-share.svg | Social sharing preview (`og:image` in each `<head>`) | 1200×630 |

For the social preview, export the final image as a **PNG or JPG**, because Facebook, WhatsApp and LinkedIn don't show SVGs.

## Things still to fill in

Search the project (Ctrl+Shift+F) for `[` and `REPLACE` to find every one.

- **Team:** names, roles and photos on `about.html`.
- **Insights:** the six cards are suggested article topics. Write the articles, then update each card's title, summary, image and link.
- **Social links:** the LinkedIn, Instagram and X icons in the footer point to `#`. Add the real URLs, or delete the icons that aren't used.
- **Privacy policy:** on `privacy.html`, fill in the `[bracketed]` items (PDPC registration number, retention periods) and have a lawyer review the policy before launch.

## Editing common things

- **Colours and fonts:** change the variables at the top of `assets/css/style.css` (`--forest-900`, `--lime-500`, and so on).
- **Header and footer:** these are repeated on every page because it's a static site. If you change a menu link, phone number or address, change it in all seven HTML files (and in `assets/data/faq.json` for the chat assistant). VS Code's search-and-replace across files (Ctrl+Shift+H) does this in one step.
- **Tax health check questions:** these are in `assets/js/main.js`, section 5. Each question has the text, the service it recommends if answered "No", and that service's link.
- **Phone, email and WhatsApp:** search for `717402578` and `info@staa.co.tz`.

## Contact form

The form works without a server: when a visitor submits it, their email app opens with the message addressed to info@staa.co.tz.

To have messages arrive automatically without the visitor's email app:

1. Create a free form at [formspree.io](https://formspree.io), or any similar service.
2. In `contact.html`, add the endpoint to the form tag:
   `<form class="form" id="contact-form" data-endpoint="https://formspree.io/f/YOUR_ID" novalidate>`

## Built-in features

- Responsive layout for phone, tablet and desktop, with a slide-out mobile menu
- Interactive 5-question **tax health check** that recommends services
- Floating WhatsApp button (+255 717 402 578)
- Scroll animations and counters that respect the visitor's "reduce motion" setting
- Services page side menu that highlights the section you're reading
- Insights topic filter
- Accessibility basics: skip link, keyboard-friendly menu, visible focus outlines, form error messages
- SEO basics: page titles, meta descriptions, social sharing tags, and LocalBusiness structured data on the home page

## Going live

Upload the whole folder, keeping its structure, to the `public_html` folder of your staa.co.tz hosting. You can also deploy it free on Netlify or Vercel by dragging the folder in.

## Cookie consent banner

On a visitor's first visit, every page shows a cookie banner (`assets/js/main.js`, section 9) with **Accept all**, **Reject optional** and **Customise**. Their choice is stored in the browser for 12 months. To change it later, they can use **Cookie settings** in the footer or on the privacy page.

The Google map on the contact page only loads after the visitor allows "Maps & embedded content", either in the banner or with the **Show map** button on the map itself.

The site currently has no analytics. If you add some, such as Google Analytics:

1. Add a category to `CATEGORIES` in `main.js`, for example `{ key: 'analytics', name: 'Analytics', desc: '...' }`.
2. Load the tracking code as `<script type="text/plain" data-consent="analytics" src="..."></script>`. It runs only after consent.
3. List its cookies in the table in `privacy.html`, section 9.

## Ask STAA chat assistant

Every page has an **Ask STAA** button above the WhatsApp button. It answers common questions about STAA's services from `assets/data/faq.json`. When a question is out of scope, or needs a quote or advice on the visitor's own situation, it shows a **Continue on WhatsApp** button. That button opens WhatsApp chat with +255 717 402 578, with the visitor's question already typed in.

- **Edit or add answers:** open `assets/data/faq.json`. Each entry has the question (`q`), the answer (`a`), and the `keywords` a visitor might use. You can also add an optional `link` to a page, and `"handoff": true` to also offer WhatsApp after the answer.
- **Suggested questions:** the chips shown when the chat opens are the `suggestions` list at the top of the same file.
- **Preview:** use Live Server. The assistant loads `faq.json` over http, so if you open the page by double-clicking it, every question goes to WhatsApp.
- **AI answers (optional):** to have Claude answer in natural language from the same FAQ file, follow `ai-assistant/README.md`.
