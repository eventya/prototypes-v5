# Remedieri propuse după auditul automat (task separat)

Auditul din platformă (Setări -> Accesibilitate -> Rulează auditul acum, sau săptămânal) verifică
un eșantion din paginile fiecărui workspace cu axe-core, exact cum le văd vizitatorii. Lista de
mai jos este ce a găsit pe 14.09.2026 pe workspace-ul aplicatie-hibrida (culoare de brand #14ba08)
și ce remediere propunem pentru fiecare. Ce reparăm în cod dispare din declarațiile tuturor la
următorul audit; admin-ul arată la „Ce cade pe mai multe workspace-uri" ce ține de platformă.
Nimic de aici nu este aplicat: patch-ul `stejar-remedieri.patch` conține toate modificările
și se aplică din rădăcina repo-ului stejar cu `git apply prototypes/.../stejar-remedieri.patch`.

## 1. Contrastul culorii de brand (serios, pe toate paginile)

Paleta se generează dintr-o singură culoare: `primary-500` este chiar culoarea de brand, iar
`600`, `700`... sunt doar puțin mai închise. Pentru un brand deschis (verde #14ba08, portocaliu,
galben) textul `text-primary-500` / `text-primary-600` și butoanele `bg-primary-500` cu text alb
cad sub 4.5:1. Măsurat pe alb: verde 500 = 2.61, 600 = 3.55, 700 = 4.98; portocaliu #f59e0b
700 = 4.17. Nu există o nuanță fixă care să treacă pentru orice brand.

Remediere (rădăcina problemei, un singur loc): `lib/stejar/color_palette.rb` ancorează nuanțele
600-950 pe o bază întunecată până la 4.5:1 pe alb; 500 rămâne culoarea de brand neschimbată,
brandurile deja lizibile (albastru, roșu) nu se schimbă deloc. Efect vizibil: pentru brandurile
deschise, butoanele și link-urile (600+) devin mai închise pe site și în aplicațiile mobile
(AccentColor/Button = primary-600). Este o decizie de design pentru toți clienții, de confirmat.

Pe lângă paletă, în patch:
- butonul „AI Assistant" din header: `text-primary-500` -> `text-primary-600`, icoana `aria-hidden`
  (`app/views/stejar/public_ai_assistant/_trigger_button.html.erb`);
- elementul Link/Buton: primary pe `600`/hover `700`, outline/ghost/text cu `text` pe `600`
  (`app/assets/stylesheets/stejar/elements/link.css`).

## 2. Notificări (serios, 41 de elemente)

`app/views/stejar/website/notifications/_notification_item.html.erb`: ora („acum 3 zile") este
`text-gray-400` (2.5:1) și codul notificării `text-gray-300` la 10px. Remediere: `text-gray-500`
în modul luminos, `dark:text-gray-400` în cel întunecat.

## 3. Iframe-uri fără titlu (serios)

Orice `<iframe>` are nevoie de `title`. Lipsește la: Video (YouTube/Vimeo, `video.rb`),
Embed (`embed_code.html.erb`, ambele moduri), HelpdeskForm (`helpdesk_form.html.erb`),
Instagram (`instagram_feed.html.erb`), File în mod embed (`file.html.erb`).
Remediere: `title` din datele elementului (titlul formularului, titlul fișierului) sau din
cheile noi `stejar.website.frames.{video,embed,instagram}` în cele 7 limbi.

## 4. Imagine fără text alternativ (critic)

Elementele Image și ImageGallery pun `alt: asset.description`; când editorul nu a scris nimic,
atributul lipsește. Remediere: `Stejar::Media::Asset#alt_text` = descriere sau, în lipsă,
titlul fișierului; folosit în `image.rb` și `image_gallery.html.erb`.

## 5. Buton fără nume (critic)

Butonul play din elementul Audio (`audio.html.erb`) are doar o icoană. Remediere:
`aria-label` din cheia `stejar.website.audio.play_pause` („Redă sau oprește: %{title}"), icoana
`aria-hidden`.

## 6. Placeholder-ul barei de acțiuni (serios)

Cât se încarcă bara de acțiuni (turbo-frame), scheletul are `opacity-40` și text; axe îl
măsoară ca text real. Remediere: `aria-hidden="true"` pe schelet (`action_bar.html.erb`).

## 7. Program de funcționare (serios)

`.cms-business-hours__closed-text` este `opacity-60` peste textul normal. Remediere: doar
`italic`, culoarea se moștenește (`business-hours.css`).

## 8. Formularul public de helpdesk (serios)

Textele secundare folosesc `text-ink-400` (#9e9890, 2.9:1) și placeholder-ele `text-ink-300`.
Remediere: `text-ink-500` (#7a746d, 4.6:1) în `app/views/stejar/helpdesk_public/**`,
`app/components/stejar/helpdesk/form_fields/*`, layout-ul public și placeholder-ul din
`helpdesk_public.css`.

## Ce NU este de remediat în codul nostru

- conținutul playerelor YouTube/Vimeo și al hărților Google din interiorul iframe-urilor este
  conținut terț; auditul îl ignoră (evaluează doar documentul propriu), iar declarația îl
  acoperă prin exceptarea „hărți terțe" / conținut terț;
- `/all_reviews` nu este o pagină de sine stătătoare (cere `page_id` și `element_id`), de aceea
  a ieșit din lista auditului.
