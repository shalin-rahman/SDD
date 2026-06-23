# Mobile a11y manual checklist (TalkBack / VoiceOver)

**Task:** EMCAP-P24-T04  
**Automated guard:** `cd clients/mobile && flutter test test/a11y_semantics_test.dart`  
**Surfaces wired:** entity list/record, settings, admin users/roles/security (loading + main landmark semantics)

Run on a **physical device or emulator** with the screen reader enabled before marking P24-T04 Product-ready.

---

## Setup

| Platform | Enable | Verify |
|----------|--------|--------|
| Android | Settings → Accessibility → TalkBack | Volume keys toggle or swipe gestures work |
| iOS | Settings → Accessibility → VoiceOver | Two-finger swipe reads focused control |

Build: `cd clients/mobile && flutter run` (or install release build). Log in as admin with seed data.

---

## Shell navigation

- [ ] Focus lands on **Primary navigation** landmark when opening the drawer / bottom nav.
- [ ] Each module menu item announces its label (e.g. Products).
- [ ] **Main content** landmark is announced when switching to an entity list.

---

## Entity list (PRODUCT)

- [ ] While metadata loads, hear **"Loading content, please wait"** (live region).
- [ ] After load, **Main content** is announced.
- [ ] Empty grid: **New** button is focusable and reads its label.
- [ ] Row tap opens record; back returns to list without losing focus context.

---

## Entity record (PRODUCT)

- [ ] Loading states announce **Loading content, please wait**.
- [ ] Loaded record: **Main content** landmark present.
- [ ] Header actions (**Edit**, **Delete**, **Save** in edit mode) each read their button text.
- [ ] Document row **Preview** button reads **Preview** (not only "button").

---

## Settings

- [ ] Initial reload announces loading semantics.
- [ ] Deployment version line is readable after load.
- [ ] Save success exposes **Changes saved** live region (when applicable).

---

## Admin — Users

- [ ] Screen load: **Loading content, please wait** then **Main content**.
- [ ] **New user** button is reachable and labeled.
- [ ] User list rows announce username and tenant.
- [ ] Detail form: **Save** and role checkboxes are individually focusable.

---

## Admin — Roles

- [ ] Same loading → main landmark flow as Users.
- [ ] **New role** and permission picker items are focusable with readable labels.

---

## Admin — Security

- [ ] Loading → **Main content** landmark on the combined policy layout.
- [ ] Entity list rows announce entity code.
- [ ] ABAC table rows and **Add policy** / **Save ABAC** buttons are reachable.

---

## Sign-off

| Check | Pass | Notes |
|-------|------|-------|
| All sections above | ☐ | |
| No silent interactive controls on primary flows | ☐ | |
| `flutter test test/a11y_semantics_test.dart` green | ☐ | |

**Evidence:** Optional screen recording or checklist date in session memo. Automated semantics tests do **not** replace device TalkBack/VoiceOver verification.
