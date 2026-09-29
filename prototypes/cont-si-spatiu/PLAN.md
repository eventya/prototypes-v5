# Contul și spațiul de lucru: un singur aspect

> **Status:** implementat în eventya și stejar pe 29.09.2026, necomis (`feature/entitlements`).
> **Pleacă de la:** F2 (contul) și F5 (asistentul) din `stejar/plans/abonamente-plan-de-implementare.md`, plus `/workspace/choose` și `/setup/preparing`.
> **Limba ecranelor:** engleză, ca site-ul (F12). Textele intră în `config/locales/onboarding.en.yml` și `.ro.yml`.

---

## 1. De ce

Azi, paginile prin care trece un om de la „Sign in” până în Dashboard arată ca trei produse diferite:

| Pagina | Cum arată azi |
|---|---|
| `/signin`, `/signup`, `/verify` | Flowbite: gri, butoane dreptunghiulare, card cu logo deasupra |
| `/setup` | fără card, logo în stânga, pașii „Project — Template” în dreapta, titluri mai mari |
| `/workspace/choose` | „eventya” scris ca text, un „Back” deasupra, textele direct în view |
| `/setup/preparing` | zinc și blue-600, spinner mare, umbră mare |

Pe lângă asta:
- **Etichete dublate.** La creare cont: titlul „What's your name?”, eticheta „Your name” și placeholder-ul „Your name”.
- **Două intrări.** Omul trebuie să știe dinainte dacă are cont: „Sign in” cere doar e-mailul, iar „Create an account” cere numele, apoi e-mailul.
- **Prea multe ieșiri pe card.** Pe „Sign in”: „No account yet?”, un al doilea buton mare „Create an account” și „Back to eventya.net”.

---

## 2. Fluxul

**Intrarea** e aceeași pentru toată lumea:

1. **E-mailul.** Un câmp.
2. **Codul** trimis pe e-mail.
3. **După cod, decide e-mailul:**
   - **e-mail cunoscut:**
     - cu 2 sau mai multe spații → alegerea spațiului;
     - cu un spațiu → direct în Dashboard-ul lui, ca azi;
     - fără spații → spațiu nou;
     - venit de pe site cu un template sau un pachet → spațiu nou, ca azi;
     - admin fără spații → `/stejar-admin`, ca azi;
   - **e-mail nou** → numele, apoi spațiu nou.

**Spațiul nou** are trei ecrane:

1. **Numele spațiului.**
2. **Template-ul.**
3. **Pregătirea.**

Formularul trimite totul o singură dată, la final. Cine vine doar pentru Helpdesk (`?package=helpdesk`) nu vede template-ul: spațiul se creează din primul ecran.

---

## 3. Carcasa comună

Aceeași pe toate ecranele. Stă în `layouts/onboarding.html.erb`.

1. **Fundalul** e `surface-50`.
2. **Sus, în stânga, e „← Back”**, pe ecranele de intrare:
   - de la e-mail, la eventya.net;
   - de la cod, la e-mail, cu adresa completată.

   Rândul există și când e gol, ca logo-ul să nu se mute de la un ecran la altul.

   **Pe cei doi pași ai spațiului nou, Back stă în card**, lângă butonul principal, unde îl caută omul într-un formular cu pași:
   - de la numele spațiului, la eventya.net;
   - de la template, la numele spațiului, completat.
3. **Logo-ul Eventya** e centrat și duce la eventya.net.
4. **Un singur card:** `bg-surface-0`, `border-surface-200`, `rounded-2xl`, `shadow-sm`. Are 400px, iar 768px doar la template, unde e grila.
5. **În card:**
   - titlul (`text-xl font-semibold`) și o frază (`text-sm text-ink-500`);
   - câmpul sau câmpurile;
   - butonul principal, `btn btn--primary`.
6. **Sub card, o singură linie:** „New to Eventya? Create an account”, „ana@… · Use another e-mail” sau „ana@… · Sign out”.
7. **Erorile unui câmp stau sub câmp** (`form__error`), nu în flash. Flash-ul rămâne doar pentru mesajele fără câmp, de exemplu „You have been signed out.”
8. **Design system-ul Stejar:** butoane pill, `input`, tokenii `surface` și `ink`. E același aspect ca în back office, unde omul ajunge imediat după. Dark mode vine din tokeni.

**Textele:**
- **Pe un ecran cu un singur câmp, titlul e eticheta câmpului** (`<h1><label for=…>`). Fraza de sub titlu e hint-ul (`aria-describedby`). Nu există etichetă separată și nici placeholder care să repete titlul.
- **Placeholder-ul** e doar un exemplu de format (`name@organization.com`).
- **Butonul** spune rezultatul: „Send me a code”, „Continue”, „Create workspace”.
- **Nu există „Step N of M”.** Butonul „Continue” spune că urmează ceva.
- **În loc de „project”** scriem „workspace”, ca în restul aplicației.

---

## 4. Ecranele

### 1 · E-mailul (`/signin` și `/signup`)
- Același formular pe ambele adrese. Se schimbă doar titlul, fraza și linia de sub card:
  - `/signin`: „Sign in”, cu fraza „We'll e-mail you a code. No password needed.”; sub card, „New to Eventya? Create an account”;
  - `/signup`: „Create your account”, cu fraza „Free for 30 days, with everything included. No card needed.”; sub card, „Already have an account? Sign in”.
- Venind de pe pagina de prețuri (`?template=`), fraza devine „You start with the Atrium template. Free for 30 days, no card needed.”
- Câmpul „E-mail” și butonul „Send me a code”.
- Back duce la eventya.net.
- **Oricine primește codul**, cu cont sau fără. Pagina nu spune niciodată dacă adresa există.

### 2 · Codul (`/verify`)
- Șase căsuțe, cu controllerul `otp-input` din Stejar, cel de pe login-ul spațiului. Câmpul real rămâne pentru specuri.
- La a șasea cifră, formularul se trimite singur. Butonul e „Continue”.
- Sub buton: „The code is valid for 10 minutes. Send a new one in 0:30.”
- **Codul greșit:** căsuțele se golesc și se colorează în roșu, iar sub ele apare „Wrong code. 2 attempts left.”
- Back duce la e-mail, pe aceeași adresă (`/signin` sau `/signup`), cu e-mailul completat.

### 3 · Numele (`/signup/name`, doar pentru un e-mail nou)
- Titlul-etichetă „What's your name?”, cu hint-ul „Your colleagues see it on the pages and tickets you work on.”
- Butonul „Continue”. Sub el stă fraza cu Termenii și Politica de confidențialitate. Doar oamenii noi le acceptă aici.
- **La „Continue” se creează contul** (numele, e-mailul, Termenii) și începe sesiunea. Cine se oprește la template își găsește contul data viitoare și ajunge direct la spațiu nou.
- Nu are Back. Sub card: „ana@… · Use another e-mail”.
- Un om deja autentificat nu mai vede ecranul: merge direct la spațiul nou.

### 4 · Alegerea spațiului (`/workspace/choose`)
- Apare doar de la 2 spații. Cu unul singur, omul intră direct.
- Titlul „Choose a workspace”.
- Un rând pe spațiu: sigla (sau inițiala), numele și rolul. Spațiul suspendat are eticheta „Suspended”.
- Sub o linie: „New workspace”.
- Sub card: e-mailul și „Sign out”.
- **Dispar:** „eventya” ca text și fraza „You have access to multiple workspaces”. Textele trec prin `t()`.

### 5 · Numele spațiului (`/setup`)
- Titlul-etichetă „What's your workspace called?”, cu hint-ul „Usually your organization's name. You can change it later.”
- Butoanele „Back” și „Continue”, unul lângă altul.
- Back duce pe eventya.net.
- Sub card: e-mailul și „Sign out”.

### 6 · Template-ul (`/setup`)
- Titlul „Choose a template” (legenda grupului de opțiuni). Fraza: „The pages of a project like yours, ready to edit. You can change everything later.”
- Grila, pe grupe, cu template-ul de pe site bifat.
- **Bara de jos** rămâne lipită de ecran cât derulezi grila. Are:
  - fraza „Free for 30 days, with everything included. By creating the workspace you accept the Data Processing Agreement on behalf of your organization.”;
  - butoanele „Back” și „Create workspace”.
- Back duce la numele spațiului, completat.

### 7 · Pregătirea (`/setup/preparing/:slug`)
- Aceeași carcasă. Titlul „Setting up Demo Museum” și fraza „It takes under a minute. It opens by itself when it's ready.”
- Trei pași: gata (bifă), în lucru (cerc care se rotește), urmează (punct).
- **Dispar:** spinnerul mare, culorile zinc și blue și „Don't close this tab”. Spațiul se pregătește pe server, deci tab-ul se poate închide.

---

## 5. Ce se schimbă față de planul v2

| Unde | Planul v2 (făcut, necomis) | Acum |
|---|---|---|
| F2 | două intrări; la creare cont, numele, apoi e-mailul, apoi codul | o intrare: e-mailul, codul, apoi numele, doar pentru un e-mail nou |
| F2 | Termenii, sub e-mail, la creare cont | Termenii, sub nume, doar pentru oamenii noi |
| F1 (R3) | un e-mail necunoscut la „Sign in” primește **AUTH-008** („nu ai cont”) | primește codul și ajunge la nume. **AUTH-008 dispare.** |
| F5 | contul se creează odată cu spațiul, iar numele omului stă în sesiune | contul se creează la nume. `/setup` cere mereu un om autentificat. |
| F5 | doi pași, cu „Project — Template” în antet | aceiași doi pași, în carcasă, fără indicator, cu Back |

---

## 6. Implementarea (eventya)

1. **CSS.** O intrare nouă, `build:css:onboarding`, construită ca `build:css:stejar`:
   - importă `stejar/application.css`;
   - adaugă ca `@source` view-urile `onboarding/`, `choose_workspace/`, `workspace/remove/` și layout-ul.

   Layout-ul `onboarding` o încarcă în locul lui `website`.
2. **Layout-ul:**
   - `<body class="bg-surface-50 text-ink-800">`;
   - rândul de antet cu `content_for :back` (adresa sau nimic);
   - logo-ul;
   - `yield`;
   - `yield :below`.

   Cardul e un parțial, `onboarding/_card`, cu `size: :narrow | :wide`.
3. **Intrarea (`OnboardingController`):**
   - `signin` și `signup` randează același view, `onboarding/email`, cu `@entry`.
   - `POST /signin` și `POST /signup` merg în aceeași acțiune. Ea trimite codul oricui și ține în sesiune doar e-mailul și intrarea (pentru Back).
   - `deliver_code` nu mai alege între cod și AUTH-008.
   - `Onboarding::PostVerification` nu mai are `flow`:
     - `user.nil?` → `signup_name_path`;
     - altfel, regulile de azi: spațiile, adminul, intenția.
4. **Numele:** `GET/POST /signup/name` (`Onboarding::NameController`). Stă sub `signup`, care e deja rezervat pentru adresele spațiilor.
   - Cere un e-mail verificat în sesiune și niciun utilizator cu el.
   - Creează utilizatorul prin `Onboarding::FindOrCreateUser`, scrie `accept_terms!(Legal::TERMS_VERSION)`, pornește sesiunea și duce la `/setup`, cu intenția păstrată.
5. **`/setup`:**
   - `require_setup_eligible` cere un om autentificat;
   - dispar câmpul de nume din asistent, `session[:onboarding_name]` și ramura neautentificată din `complete`;
   - view-ul are doi pași în carcasă; `onboarding-steps` rămâne;
   - Back de pe template întoarce la pasul 1, în pagină.
6. **`verify.html.erb`:**
   - controllerul `otp-input` se importă din `@stejar`, ca `subscription_quote_controller`;
   - Back duce la `signin_path` sau `signup_path`, după intrare, cu `email`.
7. **`choose_workspace/show.html.erb`:**
   - carcasa, cu sigla spațiului dacă e atașată;
   - rolul trece prin `t()`, iar „Suspended” vine din `account.suspended?`.
8. **`preparing.html.erb`:** carcasa. `redirect-poll` și `turbo_stream_from` rămân.
9. **`workspace/remove`** primește carcasa odată cu layout-ul. Se verifică vizual.
10. **AUTH-008 se scoate:**
    - `ExistingAccountMailer#no_account_hint`, cu view-ul, previzualizarea și specul;
    - intrarea din catalogul de e-mailuri și din manual, dacă există.
11. **Specurile:** cele de cerere pentru onboarding și pentru alegerea spațiului.
    - E-mail cunoscut cu 0, 1 și 2 spații.
    - E-mail nou → nume → `/setup`.
    - Intenția de pe site.
    - Numele gol.
    - `/signup/name` fără e-mail verificat, și un om deja autentificat.
    - `/setup` neautentificat.
    - Eticheta „Suspended”.

---

## 7. Întrebări deschise

1. **Login-ul spațiului** (`/:slug/stejar`, `auth/backend/sessions` în Stejar, cu sigla clientului). Propunerea: aceeași carcasă, cu sigla spațiului în locul logo-ului Eventya, într-un pas separat, în Stejar.
