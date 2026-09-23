# Asistentul AI pe site — câmp jos pe centru

> **Status:** implementat pe `feature/entitlements` (stejar + tema city din eventya), necomis, 17.09.2026. Prototip: `01-camp-jos.html`.
> **Legătură:** același tipar ca asistentul din Stejar (setul `entitlements-pachete`, ecranul 13): câmp jos pe centru, cu restrângere în pastilă.

## De ce

Pe site-ul public, asistentul AI e azi un link mic, „AI Assistant”, în bara de sus, între comutatorul de temă și butoanele de cont. Pe mobil e doar o iconiță. Vizitatorii îl ratează ușor. În Stejar am mutat deja asistentul jos pe centru, ca un câmp de întrebare; site-ul public ar trebui să arate la fel.

## Ce se schimbă

| Element | Azi | Devine |
|---|---|---|
| Intrarea | link „AI Assistant” în bara de sus (temă) | **câmp jos pe centru**, pe toate paginile |
| Culoarea | primară, doar pe link | contur și cerc în **culoarea brandului** (`primary` din branding) |
| Textul | „AI Assistant” | „Întreabă orice despre {numele site-ului}…” |
| Panoul | se deschide jos pe centru, 700px | neschimbat; câmpul dispare cât timp e deschis |
| Minimizat | bară albă lipită de marginea de jos | câmpul spune „Continuă conversația…”, cu punct verde |
| Restrângere | nu există | săgeata strânge câmpul în pastila „Întreabă AI”; alegerea se ține minte |
| Bara de sus | link / iconiță | **dispar** |

## Reguli

- **Când apare:** doar dacă asistentul public e activ (planul include `ai.visitor` și comutatorul din Setări CMS → Asistent AI e pornit), ca azi.
- **Cookie-uri:** cât timp bannerul de cookie-uri așteaptă un răspuns, câmpul nu apare. După Acceptă sau Refuză apare imediat, fără reîncărcare.
- **Restrâns:** starea se ține minte în browserul vizitatorului, per site (cheia include contul, pentru site-urile de pe domeniul comun).
- **Fără scurtătură de tastatură:** vizitatorii nu o cunosc; în Stejar rămâne ⌘J.
- **Mobil:** câmpul ocupă lățimea ecranului minus 16px; panoul deschis urcă până aproape de bara de sus.
- **Aplicația mobilă:** neschimbat, acolo asistentul are tab-ul lui și widget-ul nu se randează.
- **Previzualizarea din CMS:** neschimbat, widget-ul nu apare.
- **Final de pagină:** pagina primește spațiu liber jos, ca footer-ul să nu rămână sub câmp.

## Unde în cod

- `stejar/app/views/stejar/public_ai_assistant/_chat_widget.html.erb`: câmpul și pastila în locul barei minimizate; panoul rămâne.
- `stejar/app/javascript/controllers/public_ai_chat_controller.js`: deschidere din câmp, restrângere ținută minte, ascundere cât timp bannerul de cookie-uri e vizibil.
- `stejar/app/views/stejar/public_ai_assistant/_trigger_button.html.erb` și `_chat_widget_minimized_bar.html.erb`: șterse, înlocuite de câmp.
- `eventya/app/themes/city/components/themes/city/main_menu_component.html.erb` și `main_menu/utility_bar_component.html.erb`: fără butonul din bară.
- Bannerul de cookie-uri emite deja `cookie-consent:accepted` / `cookie-consent:rejected`; câmpul le ascultă, iar serverul îl marchează „în așteptare” cât timp lipsește cookie-ul `cookie_consent`.

## Decizii deschise

| # | Întrebare | Propunere |
|---|---|---|
| D1 | Conturul în gradient ca în Stejar sau într-o singură culoare a brandului? | **Decis:** nuanțele culorii primare din branding, ca fiecare site să rămână în identitatea lui |
| D2 | Câmpul apare pe toate paginile, inclusiv pe cele cu formulare lungi? | **Decis:** da; vizitatorul îl poate restrânge |
| D3 | Păstrăm iconița ✦ în bara mobilă ca a doua intrare? | **Decis:** nu; câmpul de jos e suficient |

## Ecrane

1. **Câmp jos pe site:** azi și propunerea, restrâns, deschis și minimizat, interactiv, cookie-uri, mobil
