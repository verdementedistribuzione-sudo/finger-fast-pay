# FingerPay — App funzionante

Trasformo il sito vetrina in un'app reale con backend (Lovable Cloud) e biometria del dispositivo (WebAuthn / `navigator.credentials`), che è l'unico modo per leggere l'impronta dal telefono da un'app web.

## Cosa costruisco

### 1. Autenticazione
- Pagina `/register`: nome, email, password + registrazione di una **credenziale biometrica WebAuthn** (Face ID / impronta del device). Salvo il `credentialId` collegato all'utente.
- Pagina `/login`: email + password, poi sblocco con biometria del device.
- Sessione gestita da Lovable Cloud (Supabase auth).

### 2. Wallet `/wallet`
- Lista documenti dell'utente (carta d'identità, biglietti, tessere, ecc.).
- Pulsante **+ Aggiungi documento**:
  - Carica PDF oppure scatta/carica foto → salvato in storage privato.
  - Tipo documento selezionabile (ID, biglietto treno/aereo, tessera, altro).
- Ogni documento ha: anteprima, download, elimina.

### 3. Carte di credito `/wallet/cards`
- **Scansiona carta**: foto della carta → estrazione testo client-side (Tesseract.js) di numero / scadenza / nome. L'utente può correggere.
- Salvataggio: **solo last4, brand, scadenza, nome** in chiaro. Il PAN completo viene cifrato con chiave derivata dalla password dell'utente (AES-GCM via WebCrypto) prima di essere inviato — il server non lo vede mai in chiaro.
- Niente CVV salvato (best practice PCI).

### 4. Pagamento a due dita `/pay`
- Form: importo + selettore carta.
- **Primo tocco biometrico** → sblocca la lista carte (decifratura PAN lato client).
- **Secondo tocco biometrico** → autorizza il pagamento: crea una transazione `authorized` nel DB con token monouso. Simulazione (no PSP reale).
- Storico transazioni in `/wallet`.

### 5. Schema DB (Lovable Cloud)
- `profiles` (id, full_name, email)
- `webauthn_credentials` (user_id, credential_id, public_key, counter)
- `documents` (user_id, type, name, storage_path, mime_type, created_at)
- `payment_cards` (user_id, brand, last4, exp_month, exp_year, holder, encrypted_pan, iv)
- `transactions` (user_id, card_id, amount, currency, status, token, created_at)
- RLS: ogni utente vede solo le proprie righe.
- Storage bucket privato `documents`.

### 6. Navigazione aggiornata
La home resta vetrina, ma aggiungo CTA "Apri l'app" → `/login`. Le route demo (technology, security, ecc.) restano accessibili.

## Note tecniche oneste
- **WebAuthn** legge la biometria gestita dal sistema operativo del telefono (Touch ID / Face ID / Android Biometric). Il sito **non** riceve mai il template dell'impronta — riceve solo una firma crittografica. È esattamente il modello "cancellable biometrics" descritto nel sito.
- L'OCR delle carte è best-effort: utile per UX ma l'utente conferma i dati.
- Il "pagamento" è simulato (nessun acquirer reale collegato): genera token e transazione nel DB.

## Stack
Lovable Cloud (Supabase) per auth/DB/storage, WebAuthn nativo del browser, Tesseract.js per OCR, WebCrypto per cifratura PAN, shadcn/ui per UI (stile attuale white+gold).

Procedo?
