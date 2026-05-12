# Checklist înainte de lansare pe Google Play

Verificări pentru a te asigura că aplicația respectă cerințele și nu crapă în producție.

---

## 1. Stabilitate și bug-uri

| Verificare | Status | Note |
|------------|--------|------|
| **ErrorBoundary** | ✅ | `app/_layout.tsx` – erori neprinse afișează „Something went wrong” + buton Try Again |
| **Supabase fără crash** | ✅ | `useUserProgress` nu mai aruncă la eroare – app-ul continuă cu date locale |
| **Sync progres în fundal** | ✅ | Erori la sync (RLS, rețea) sunt prinse în `QuizProgressProvider` – doar log, fără crash |
| **Login** | ✅ | Validare, mesaje de eroare, redirect la `/(tabs)` la succes |
| **Quiz** | ✅ | Limită zilnică → paywall; sesiune salvată local; rezumate la final |

**Acțiuni:**
- [ ] Rulează pe **2–3 dispozitive** (Android diferite): login → quiz → finalizare → profil
- [ ] Dezactivează rețeaua și verifică că app-ul nu crapă (progres local, sync e opțional)

---

## 2. Flux principal (Login → Quiz → Gameficare → Monetizare)

| Pas | Ce verifici |
|-----|--------------|
| **Login** | Email/parolă, „Forgot password”, Sign up, redirect corect |
| **Home** | Continue learning, statistici (întrebări, timp, acuratețe), carduri categorii |
| **Quiz** | Alegere categorie → Start → răspunsuri → rezultat; limba RO/EN consistentă |
| **Gameficare** | Streak-uri, progres zilnic, inel progres, eventuale achievements (dacă le afișezi) |
| **Monetizare** | La limită zilnică → buton Upgrade → paywall; Restore purchases în paywall/setări |

**Acțiuni:**
- [ ] Parcurge fluxul **fără cont** (dacă e posibil) și **cu cont**
- [ ] După 10 întrebări pe zi (sau limita din `FREE_QUIZ_ANSWER_LIMIT` — piscină zilnică, orice capitol) apare paywall sau mesaj de upgrade
- [ ] Buton „Restore purchases” funcționează (test cu cont care a cumpărat)

---

## 3. Pagina de magazin (Store listing)

**Text și capturi de ecran trebuie să corespundă cu ce face aplicația.**

| Promisiune în store | Unde se face în app |
|---------------------|----------------------|
| **Quiz / Întrebări** | `app/(tabs)/quiz.tsx`, `app/quiz-session.tsx`, capitole Admitere Medicină |
| **Gameficare** | Streak (`StreakBadge`, `QuizProgressProvider`), progres zilnic, inel pe home |
| **Monetizare / Premium** | `app/paywall.tsx`, `SubscriptionProvider`, RevenueCat |
| **Statistici / Progres** | Home (acuratețe, întrebări, timp), profil, eventual grafic săptămânal |

**Acțiuni:**
- [ ] Listează în document (sau în store) **toate** funcțiile menționate în descriere
- [ ] Pentru fiecare: confirmă că există în app și e accesibil (nu doar „în curând”)
- [ ] Dacă promiți „abonament Premium”, paywall-ul trebuie să fie vizibil și funcțional pe build-ul de producție

---

## 4. Monetizare și politici Google Play

| Cerință | Implementare |
|---------|--------------|
| **Plăți prin Google Play** | ✅ RevenueCat + `react-native-purchases` – folosesc Google Play Billing |
| **Fără plăți ocolite** | ✅ Nu există link-uri către PayPal / card direct / crypto în app |
| **Restore purchases** | ✅ `restorePurchases()` în SubscriptionProvider; buton în paywall (RevenueCat UI) |
| **Prețuri / RON** | Verifică în `constants/subscription.ts` și în RevenueCat Dashboard că produsele și prețurile sunt corecte |

**Acțiuni:**
- [ ] În **Google Play Console** → Produse (Subscriptions) – produsele sunt create și activate
- [ ] RevenueCat: proiect Android legat de același pachet (`com.devaieood.medvba`)
- [ ] Testează achiziția cu un **cont de test** (License Testing în Play Console)

---

## 5. Raport „Înainte de lansare” (Pre-launch report)

După ce încarci AAB-ul în Play Console:

1. **Play Console** → Aplicația ta → **Release** → **Production** (sau Testing) → ultima versiune
2. **Pre-launch report** – rulează automat pe dispozitive virtuale
3. Verifică:
   - **Stabilitate** – crash-uri sau ANR
   - **Performanță** – nu există cerințe explicite, dar dacă apare ceva roșu, investighează
   - **Compatibilitate** – rulează pe toate API levels / dimensiuni cerute

**Acțiuni:**
- [ ] Încarcă un AAB (build de producție, cu `EXPO_PUBLIC_PAYWALL_ENABLED=true` dacă vrei paywall activ)
- [ ] Așteaptă finalizarea raportului Pre-launch
- [ ] Rezolvă orice crash sau problemă critică înainte de lansare

---

## 6. Variabile de mediu pentru build de producție

Pentru EAS Build (sau alt build pentru Play):

- `EXPO_PUBLIC_SUPABASE_URL` și `EXPO_PUBLIC_SUPABASE_ANON_KEY` – pentru login și progres (dacă Supabase e activ)
- `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` – cheie RevenueCat pentru Android
- `EXPO_PUBLIC_PAYWALL_ENABLED=true` – ca paywall-ul să fie activ în producție

Verifică în **EAS** (eas.json) sau în **Secrets** din dashboard că aceste variabile sunt setate pentru profilul de **production**.

---

## Rezumat

- **Stabilitate:** ErrorBoundary + fetch progres Supabase fără throw = mai puține riscuri de crash vizibil.
- **Flux:** Login → Quiz → gameficare (streak, progres) → monetizare (paywall, restore) – parcurge manual pe 2–3 telefoane.
- **Store:** Text și capturi de ecran aliniate la funcțiile reale (quiz, gameficare, monetizare).
- **Monetizare:** Doar Google Play Billing prin RevenueCat; restore disponibil.
- **Pre-launch:** Încarcă AAB, verifică raportul și rezolvă crash-urile / problemele critice înainte de publicare.

După ce bifezi toate secțiunile, poți considera aplicația pregătită pentru trimiterea pe Google Play.
