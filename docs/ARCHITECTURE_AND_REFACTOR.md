# Arhitectură și plan de refactorizare – MEDVBA (Expo SDK 54)

> **Actualizat mai 2026:** Autentificarea este **Kinde → MEDVBA JWT → Supabase (date)**. Secțiunile **§1.4–1.5** și **§2.2 / §2.4** reflectă codul curent. Restul planului de refactor poate fi învechit — verifică înainte de schimbări mari. Sursă canonică auth: [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md).

## 1. Arhitectură la nivel înalt

### 1.1 Navigare (Expo Router)

- **Rute:** file-based în `app/`:
  - `(auth)` – onboarding, login, signup, forgot-password (`app/(auth)/_layout.tsx` L12–16)
  - `(tabs)` – index, quiz, social, tutor, profile (`app/(tabs)/_layout.tsx` L33–66)
  - Stack-uri: quiz-session (fullScreenModal), settings, legal, delete-account, paywall (`app/_layout.tsx` L164–204)
- **Protecție rute:** `useProtectedRoute()` în `app/_layout.tsx` (L88–129):
  - După `isLoading` din AuthProvider, redirecționează: ne-onboarding → `/(auth)/onboarding`, ne-autentificat → `/(auth)/login`, autentificat în (auth) → `/(tabs)`.
- **Ordine providers:** ErrorBoundary → trpc → QueryClient → Theme → Paper → Auth → Language → Subscription → QuizProgress → GestureHandler → RootLayoutNav (`app/_layout.tsx` L234–258).

**Fișiere cheie:** `app/_layout.tsx`, `app/(auth)/_layout.tsx`, `app/(tabs)/_layout.tsx`.

### 1.2 Straturi UI

- **Teme:** `ThemeProvider` (`providers/ThemeProvider.tsx`) + `getPaperTheme()` pentru React Native Paper.
- **Componente:** Paper (Appbar, Card, Button, TextInput) + `@/ui` (UIButton, UITextField – adaptare platformă) + Lucide React Native.
- **Layout:** SafeAreaView, KeyboardAvoidingView, ScrollView pe ecranele auth și multe tab-uri.

**Fișiere cheie:** `theme/paperTheme.ts`, `ui/Button.tsx`, `ui/TextField.tsx`, `constants/colors.ts`.

### 1.3 State management

- **Auth:** `AuthProvider` (createContextHook) – session, user, profile, onboarding; semnalează `isLoading` până la primul `getSession()` + timeout 15s (`providers/AuthProvider.tsx` L154–234).
- **Profil:** atât din AuthProvider (state local setat de `fetchProfile`), cât și `useUserProfile(user?.id)` (TanStack) – profilul „singura sursă de adevăr” pentru UI este state-ul din AuthProvider; `useUserProfile` e folosit pentru presence/refresh (`AuthProvider.tsx` L38–39, L73–141).
- **Quiz progress:** `QuizProgressProvider` – progress zilnic/săptămânal, sesiune curentă, last session (AsyncStorage + Supabase) (`providers/QuizProgressProvider.tsx`).
- **Alte:** LanguageProvider, SubscriptionProvider – context local.

### 1.4 Data fetching

- **Supabase:** client în `lib/supabase.ts` — PostgREST cu `persistSession: false`; request-urile folosesc `getMedvbaAccessToken()` + `ensureMedvbaSessionBeforeQuery()`. Storage adapter (SecureStore) există pentru compatibilitate, nu pentru Supabase Auth SDK login.
- **TanStack Query:** interacțiuni Supabase în `lib/supabase-hooks.ts` — profile, progress, chat, subscription rows, etc.
- **tRPC:** `lib/trpc.ts` trimite `Authorization: Bearer` cu **MEDVBA JWT** (`getMedvbaAccessToken()`). Backend: Hono + `backend/trpc/`; `protectedProcedure` pe `ctx.userId` din JWT; `account.deleteSelf` șterge profil + Kinde (M2M).

**Fișiere cheie:** `lib/supabase.ts`, `lib/medvba-session-storage.ts`, `lib/supabase-hooks.ts`, `lib/trpc.ts`, `providers/AuthProvider.tsx`, `backend/auth/session-routes.ts`.

### 1.5 Autentificare (Kinde — fără migrare la Supabase Auth)

- **UI:** `app/(auth)/login.tsx` — Apple (iOS), Google, optional hosted email; în release `hideInAppPasswordAuth = !__DEV__` (fără ROPC în app).
- **Provider:** `AuthProvider` + `@kinde/expo` — OAuth hosted, apoi `resolveMedvbaSessionFromKindeAccessToken` / `exchangeEmailPasswordSession` (dev/backend).
- **Persistență:** MEDVBA JWT + Kinde refresh în **expo-secure-store** (`lib/medvba-session-storage.ts`).
- **Profil:** `fetchProfile` / `ensureProfileExists` pe `profiles` (id = profile UUID din JWT, `kinde_sub` pe backend).
- **Onboarding:** AsyncStorage — vezi `lib/onboarding-storage.ts` și redirect în `app/_layout.tsx`.

Detalii: [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md).

---

## 2. Probleme și riscuri identificate

### 2.1 Navigare (Expo Router + auth)

- **Risc:** `useProtectedRoute` depinde de `segments`; la prima montare, un utilizator autentificat poate vedea scurt ecranul de login înainte de redirect la `/(tabs)` (flash).
- **Risc:** Rutele `settings`, `quiz-session`, `legal`, `delete-account`, `paywall`, `find-partners`, `direct-chat`, `edit-profile`, `profile/[userId]`, `notifications`, `appearance`, `support/*` nu sunt declarate explicit în același layout ca „protejate”; ele sunt accesibile doar prin UI care pornește din (tabs). Dacă cineva navighează direct (de ex. deep link) la `/settings` fără auth, Stack-ul rândului este încă sub `RootLayoutNav`, care deja face redirect la login dacă `!isAuthenticated` pentru orice segment care nu e `(auth)`. Verificare: `segments[0]` e `(tabs)` sau `(auth)` sau numele unui screen; pentru `settings`, segments pot fi `['settings']` – deci `inAuthGroup` e false și `!isAuthenticated` → redirect la login. **Concluzie:** Comportamentul e corect, dar logic de „protected” e concentrată doar în `useProtectedRoute` și depinde de ordinea segmentelor.
- **Recomandare:** Documentare sau helper `useRequireAuth()` pe ecrane sensibile (settings, delete-account) care redirectează dacă `!user`.

**Fișiere:** `app/_layout.tsx` L88–129, L164–204.

### 2.2 Sesiune Kinde + MEDVBA JWT

- **Puncte forte:** Token-uri sensibile în SecureStore; bootstrap cu timeout; offline grace la sync eșuat.
- **Risc:** Bootstrap `AuthProvider` complex (Kinde loading + cold restore + sync) — test cold start / logout manual.
- **Risc:** Profile în context vs TanStack `userProfile` — păstrează `refreshProfile()` după editări.
- **AppState:** presence / reconnect — `useOfflineReconnectEffect`.

**Fișiere:** `providers/AuthProvider.tsx`, `lib/ensure-medvba-session.ts`, `lib/medvba-session-storage.ts`.

### 2.3 TanStack Query

- **Cache:** queryKey-uri consistente (ex. `['userProfile', userId]`, `['studyRooms']`); invalidări la onSuccess pe mutații (ex. `queryClient.invalidateQueries({ queryKey: ['studyRooms'] })`).
- **Risc:** Multe hooks nu expun explicit `isError` / `error`; componentele pot presupune doar `data` și `isLoading`, deci erorile de rețea pot rămâne neafișate.
- **Risc:** `refetchOnMount: false`, `refetchOnWindowFocus: false` la nivel global (`app/_layout.tsx` L72–81) – reduce traficul dar poate lăsa date vechi pe ecrane unde utilizatorul se întoarce după o mutație făcută în alt ecran; invalidările la mutații compensează parțial.
- **Stale time:** variabil per hook (ex. 30000 în supabase-hooks); ok.

**Fișiere:** `app/_layout.tsx` L72–86, `lib/supabase-hooks.ts` (toate useQuery/useMutation).

### 2.4 tRPC + Hono cu clientul mobil

- **Flux:** `lib/trpc.ts` — `Authorization: Bearer` din `getMedvbaAccessToken()`; refresh prin `ensureMedvbaSessionBeforeQuery` la 401 pe Supabase fetch.
- **Risc:** Token expirat → 401 până la refresh Kinde/MEDVBA; testează sesiune lungă și relaunch.
- **Backend:** `protectedProcedure` + `account.deleteSelf` (service role, Kinde M2M delete).

**Fișiere:** `lib/trpc.ts`, `backend/trpc/create-context.ts`, `backend/trpc/account.ts`.

---

## 3. Code smells și anti-pattern-uri

- **Fișiere foarte mari:** `app/(tabs)/social.tsx` (~2374 linii), `app/quiz-session.tsx` (~1197), `app/settings.tsx` (multe linii), `lib/supabase-hooks.ts` (peste 2000) – greu de întreținut și testat.
- **Duplicare logică:**
  - Validare email/parolă duplicată între login, signup, forgot-password (regex și mesaje).
  - Stiluri și layout pentru carduri/auth foarte asemănătoare între login, signup, forgot-password fără componente partajate (ex. AuthCard, AuthInput).
- **Hooks/context prea mari:** AuthProvider face inițializare, fetchProfile, ensureUserExists, presence, onboarding – responsabilități multiple; la fel QuizProgressProvider.
- **UI + logică amestecate:** În social.tsx și quiz-session, handler-e, state și JSX sunt în același fișier; lipsește separarea clară UI vs business logic vs data (hooks custom pentru „create room”, „schedule session”, „activity feed” ar putea fi mutate în hooks separate).
- **Limbă:** ~~`app/(auth)/forgot-password.tsx` folosea stringuri hardcodate~~ – **rezolvat:** ecranul folosește acum `useLanguage()` și chei din locale (en, ro, pt, es).
- **Magic strings:** queryKey-uri – **parțial rezolvat:** există `lib/query-keys.ts`; study rooms folosesc deja `queryKeys`; restul hook-urilor din supabase-hooks pot fi migrate treptat.
- **Importuri grele:** `quiz-session.tsx` importă foarte multe liste de întrebări direct; încărcarea ar putea fi lazy sau prin un singur modul barrel.

**Fișiere implicate:** `app/(tabs)/social.tsx`, `app/quiz-session.tsx`, `app/settings.tsx`, `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`, `app/(auth)/forgot-password.tsx`, `lib/supabase-hooks.ts`, `providers/AuthProvider.tsx`, `providers/QuizProgressProvider.tsx`.

---

## 4. Task-uri concrete de refactorizare

### 4.1 Performanță UI

| Task | Fișiere | Descriere |
|------|---------|-----------|
| Virtualizare listă activități / feed | `app/(tabs)/social.tsx` | Înlocui ScrollView cu FlatList (sau SectionList) pentru „Activity feed” și liste lungi; păstrare RefreshControl. |
| Lazy load quiz categories | `app/quiz-session.tsx`, `mocks/chapters.ts` | Încărcare pe categorii la nevoie sau dynamic import pentru a reduce timpul de inițializare. |
| Memoizare componente listă | `app/(tabs)/social.tsx`, `app/(tabs)/index.tsx` | React.memo pe item-uri de room/session/activity și pe cardurile de categorie. |

### 4.2 Clarificare arhitectură (UI / logic / data)

| Task | Fișiere | Descriere |
|------|---------|-----------|
| Extragere hook-uri din social | `app/(tabs)/social.tsx` → `hooks/useSocialStudyRooms.ts`, `hooks/useSocialModals.ts` | Mutare logică create room, schedule session, report user în hooks; păstrare în social doar compoziție și UI. |
| Componente auth reutilizabile | Nou: `components/auth/AuthCard.tsx`, `AuthInput.tsx` | Card + label + input + error pentru login/signup/forgot-password; reducere duplicare. |
| Centralizare query keys | Nou: `lib/query-keys.ts` | Export `queryKeys.studyRooms()`, `queryKeys.userProfile(id)`, etc.; folosire în supabase-hooks și la invalidate. |
| Împărțire supabase-hooks | `lib/supabase-hooks.ts` → `lib/supabase/study-rooms.ts`, `progress.ts`, `achievements.ts`, `social.ts`, etc. | Split pe domenii; barrel `lib/supabase-hooks.ts` re-exportă tot. |

### 4.3 Securitate auth și API

| Task | Fișiere | Descriere |
|------|---------|-----------|
| useRequireAuth pe ecrane sensibile | `app/settings.tsx`, `app/delete-account.tsx` | Hook care verifică `user` și redirectează la `/(auth)/login` dacă lipsește; evită stare inconsistentă. |
| tRPC: retry la 401 cu session refresh | `lib/trpc.ts` | Custom link sau wrapper care la 401 apelează `supabase.auth.refreshSession()` și reîncearcă request-ul o dată. |
| Validare token pe backend | `backend/trpc/create-context.ts` | Opțional: validare JWT cu Supabase (getUser) în createContext pentru protectedProcedure, nu doar „token prezent”. |

---

## 5. Exemple de cod îmbunătățit

### 5.1 `lib/trpc.ts` – headers cu session proaspătă

**Problema:** La fiecare request se apelează `getSession()`; Supabase își actualizează singur token-ul, dar dacă un request pleacă exact când token-ul expiră, poate primi 401.

**Sugestie (opțional):** Folosirea `getSession()` este corectă (returnează sesiunea curentă, inclusiv după refresh). Îmbunătățire: asigurare că nu se trimite request fără token când utilizatorul e autentificat (ex. nu face request-uri tRPC protejate înainte de hidrare auth). Nu e nevoie de schimbare obligatorie aici; retry la 401 (task 4.3) este mai util.

### 5.2 `app/(auth)/forgot-password.tsx` – i18n și useLanguage

**Problema:** Mesaje și etichete hardcodate în engleză (L34–38, L104–111, L161–163, L205–212).

**Îmbunătățire:** Folosire `useLanguage()` și chei din `locales` (ex. `auth.forgotPasswordTitle`, `auth.checkEmail`, `auth.backToLogin`) – vezi secțiunea 6.

### 5.3 `lib/query-keys.ts` (nou) – centralizare query keys

```ts
// lib/query-keys.ts
export const queryKeys = {
  studyRooms: () => ['studyRooms'] as const,
  upcomingSessions: () => ['upcomingSessions'] as const,
  userProfile: (userId: string) => ['userProfile', userId] as const,
  userProgress: (userId: string) => ['userProgress', userId] as const,
  dailyProgress: (userId: string, date: string) => ['dailyProgress', userId, date] as const,
  weeklyProgress: (userId: string, start: string, end: string) => ['weeklyProgress', userId, start, end] as const,
  recentAchievements: (limit: number) => ['recentAchievements', limit] as const,
  activityFeed: (userId: string | undefined, limit: number) => ['activityFeed', userId, limit] as const,
  // ... restul din supabase-hooks
};
```

Apoi în `supabase-hooks.ts`: `queryKey: queryKeys.studyRooms()` și `queryClient.invalidateQueries({ queryKey: queryKeys.studyRooms() })`.

---

### Implementat (refactor aplicat)

- **i18n pe forgot-password:** `app/(auth)/forgot-password.tsx` folosește `useLanguage()` și chei din `locales` (en, ro, pt, es): `auth.forgotPassword`, `auth.forgotPasswordSubtitle`, `auth.checkEmailTitle`, `auth.checkEmailMessage`, `auth.checkEmailHint`, `auth.backToLogin`, `auth.sendResetLink`, `auth.rememberPassword`, `auth.resetFailed`, `auth.error`, plus `auth.emailRequired`, `auth.emailInvalid`, `auth.email`, `auth.emailPlaceholder`, `auth.signIn`, `auth.unexpectedError`. Alertele de eroare folosesc `t('auth.error')` și mesajele corespunzătoare.
- **Centralizare query keys:** Creat `lib/query-keys.ts` cu `queryKeys.studyRooms`, `queryKeys.studyRoomsList()`, `queryKeys.upcomingSessions`, `queryKeys.userProfile(userId)`, etc. În `lib/supabase-hooks.ts`, `useStudyRooms` și mutațiile pentru study rooms (create/update) folosesc `queryKeys.studyRoomsList()` și `queryKeys.studyRooms` la invalidare. Restul hook-urilor pot fi migrate treptat la același pattern.

---

## 6. Referințe explicite fișier / linii

| Tema | Fișier | Linii |
|------|--------|--------|
| Protected routes | `app/_layout.tsx` | 88–129 |
| Stack screens | `app/_layout.tsx` | 164–204 |
| Auth init + timeout | `providers/AuthProvider.tsx` | 153–234 |
| Supabase storage | `lib/supabase.ts` | 24–68 |
| tRPC headers (token) | `lib/trpc.ts` | 34–47 |
| Protected procedure | `backend/trpc/create-context.ts` | 23–37 |
| deleteSelf (JWT check) | `backend/trpc/account.ts` | 25–52 |
| Query client defaultOptions | `app/_layout.tsx` | 72–86 |
| Invalidări studyRooms | `lib/supabase-hooks.ts` | 39–41, 110, 144 |
| Forgot-password strings | `app/(auth)/forgot-password.tsx` | 34–38, 104–111, 161–163, 205–212 |
| social.tsx size / structure | `app/(tabs)/social.tsx` | 1–100, 451–492 |
| quiz-session imports | `app/quiz-session.tsx` | 1–110 |

---

Acest document poate fi folosit ca bază pentru prioritizarea refactorizărilor și pentru code review.
