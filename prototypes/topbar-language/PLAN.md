# Bara de sus — mutarea selectorului de limbă

## Problema

Bara de sus a Stejarului a devenit aglomerată. Clusterul din dreapta are 5 controale
înainte de avatar: **AI Assistant · 🔔 · Go Live · 🌐 RO ▾ · | · (avatar)**.

Selectorul de limbă schimbă **limba interfeței de admin** — o preferință personală,
setată o singură dată, nu o acțiune recurentă. Conceptual aparține aceluiași loc ca
**Dark Mode**: meniul de avatar. Îl ține permanent în bară este cost de spațiu fără
beneficiu pe măsură.

## Soluția

Scoatem selectorul din bară și îl mutăm în dropdown-ul de avatar, lângă Dark Mode,
sub o secțiune „Preferințe". Bara dreaptă scade de la 5 la 4 controale.

```
ÎNAINTE:  ✨ AI Assistant   🔔   ● Go Live   🌐 RO ▾   │  (AE)
DUPĂ:     ✨ AI Assistant   🔔   ● Go Live   │  (AE)
```

Două variante de interacțiune în meniu (vezi ecranele 03 și 04):

- **Varianta A — flyout (recomandată):** un rând „Limbă · Română ›" care deschide un
  sub-meniu lateral cu toate cele 7 limbi (flag + nume nativ + bifă pe cea activă).
  Ține meniul principal scurt; lista lungă stă ascunsă până e cerută.
- **Varianta B — flag-uri inline:** cele 7 flag-uri afișate orizontal direct în meniu.
  Un singur click pentru schimbare, dar ocupă un rând mai lat și e mai „busy".

Recomandarea: **Varianta A** — meniul de avatar are deja multe rânduri (conturi, alte
workspace-uri), iar un flyout păstrează ierarhia curată.

## Comportament

- Limba activă marcată cu bifă (`icon-check`), la fel ca azi.
- Fiecare opțiune e un `form` PATCH către `update_locale_user_profile_path` cu
  `data-turbo-frame="_top"` — reîncarcă pagina în limba aleasă (identic cu azi).
- Flag + nume nativ vin din `Stejar::LocaleRegistry` (`locale_flag`, `locale_native_name`),
  iterând `ADMIN_LOCALES` (`en ro de es fr it hu`). Zero logică nouă.

## Implementare în Stejar

1. **`app/views/layouts/stejar/components/_header_menu.html.erb`**
   — șterge linia `render partial: "layouts/stejar/components/locale_switcher"` (l. 42).
   Divider-ul rămâne; clusterul respiră.

2. **`app/views/layouts/stejar/components/_menu_items.html.erb`**
   — adaugă o secțiune „Preferințe" (border-top) chiar înainte de blocul Dark Mode,
   conținând rândul de limbă. Mută toggle-ul de Dark Mode în aceeași secțiune ca să
   citească „Preferințe: Limbă + Temă".
   - Varianta A: rândul deschide un sub-panel (un mic Stimulus `disclosure`/flyout,
     sau refolosește `dropdown_controller` nested) cu form-urile per limbă.
   - Varianta B: render direct al celor 7 form-uri ca flag-chips inline.

3. **`_locale_switcher.html.erb`** — markup-ul form-urilor per limbă se mută aici
   (sau se extrage într-un partial `_locale_options.html.erb` refolosit de meniu).
   Partial-ul vechi din bară se șterge.

4. Fără migrări, fără rute noi, fără model. Pur prezentare.

## Open questions

- Varianta A vs B (decizie de design — vezi ecranele).
- Pe **mobil**, meniul de avatar e în `_mobile_menu.html.erb` — limba ar trebui
  adăugată și acolo, în aceeași secțiune Preferințe.
- Eticheta secțiunii: „Preferințe" vs fără etichetă (doar separator).
