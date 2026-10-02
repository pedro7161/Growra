# Play Console forms for Growra

Answers for the forms that only exist in Play Console. They're based on what the app does in 1.7.0 and later.

Last checked: 2 October 2026. Re-check them whenever an SDK or data flow changes.

**Already done through the Play API:**
- Store listing, title and short and full descriptions, in pt-PT (default) and en-US.
- Icon and feature graphic in both languages.
- Growra Plus product: `growra_plus`, €0.99, active.

**Still missing in the listing:** phone screenshots, at least 2 and ideally 4–8, in both languages.

---

## Store settings (Grow → Store presence → Store settings)

- **App category:** Productivity.
- **Contact email:** required, and shown publicly on the Play page. Use the dedicated games address, not a personal one: `growra@outlook.pt`.
- **Website (optional):** `https://pedro7161.github.io/growra-website/`. Add it only after the site's deploy workflow has run.

## App content (Policy → App content)

| Section | Answer |
|---|---|
| **Privacy policy** | `https://pedro7161.github.io/growra-website/privacy-policy.html` (run the `growra-website` deploy first, or the link is dead and review fails) |
| **App access** | All functionality is available without special access (no login). Plus is a normal in-app purchase. |
| **Ads** | **Yes**, the app contains ads (optional rewarded ads). |
| **Content rating** | See below |
| **Target audience** | Ages **13–15, 16–17, 18+**. Don't tick under-13 groups: the app uses an ads SDK and isn't built for the Families program, and the privacy policy says it isn't directed at children under 13. |
| **"Could your app unintentionally appeal to children?"** | No. It's a productivity app for teens and adults; the companions are a cozy art style. |
| **News app** | No |
| **COVID-19 tracing** | No |
| **Data safety** | See below |
| **Government app** | No |
| **Financial features** | None |
| **Health** | No. It isn't a health app; tasks are whatever the user writes. |
| **Advertising ID** | **Yes**, the app uses the advertising ID, for advertising (AdMob). The ads library adds the `AD_ID` permission. |

## Content rating questionnaire (IARC)

- **Category:** Utility, Productivity, Communication or Other.
- **Violence, fear, sexuality, language, controlled substances:** No.
- **Gambling or simulated gambling:** No.
- **Random paid items (loot boxes):** No. Companions are earned; Plus is a fixed unlock.
- **Users interact or communicate:** No.
- **Shares the user's location:** No.
- **Digital purchases:** Yes.
- **Expected result:** PEGI 3 / Everyone.

## Data safety

Growra itself sends nothing off the device: tasks, progress and Plus ownership stay in local storage. Everything declared below comes from the **Google Mobile Ads SDK** (AdMob). Google publishes the exact mapping for it at <https://developers.google.com/admob/android/privacy/play-data-disclosure>. Re-check that page when filling in the form, because it is the authority.

### Overview questions

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **Yes** (through the ads SDK) |
| Is all data encrypted in transit? | **Yes** |
| Can users request deletion? | No account exists and app data lives only on the device (uninstalling deletes it). Answer per the form's options. |

### Data types (from AdMob's disclosure guide)

| Data type | Purposes |
|---|---|
| **Location: approximate location** (derived from the IP address) | Advertising, analytics, fraud prevention |
| **App activity: app interactions** | Advertising, analytics, fraud prevention |
| **App info and performance: diagnostics** | Analytics, fraud prevention |
| **Device or other IDs** (advertising ID) | Advertising, analytics, fraud prevention |

Whether each type counts as "shared" follows Google's guide; it currently treats data sent to Google for ads as collected.

- **Purchases:** Google Play Billing processes the payment. Google's guidance excludes data collected by Play's own billing system. Growra only stores "owns Plus: yes/no" on the device. Confirm this in the guide when you fill in the form.
- **Not collected:** personal info, financial info, health, messages, photos, audio, files, calendar and contacts.

## Closed testing (needed for production)

The new-account rule: **12 testers opted in to a closed testing track for 14 consecutive days**. Internal testing doesn't count.

1. Testing → **Closed testing**. Use the default **Alpha** track, or create one.
2. **Testers:** a Google Group or an email list (Testers Community gives you one). Share the opt-in link.
3. **Release:** promote the current internal build to the closed track. It goes through a short review.
4. **During the 14 days:** keep releasing improvements and collect real feedback. The production application asks how you recruited testers and what you learned.
