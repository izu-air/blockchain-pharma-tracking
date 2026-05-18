# Mobile / QR testing

This page covers two things developers usually trip over:

1. how to test the frontend on a **physical phone** against a
   laptop-hosted backend, contract and Hardhat node;
2. why **MetaMask Mobile** has different limitations than the desktop
   extension, and what to do about them.

---

## 1. LAN-based phone testing

The standard `npm run dev` binds Vite to `localhost`, which a phone on
the same Wi-Fi network cannot reach.  Two changes make it work:

### 1.1  Bind Vite to your LAN IP

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Find your laptop's LAN IP (`ipconfig` on Windows, `ifconfig` / `ip a` on
Linux/macOS) — e.g. `192.168.1.42`.

### 1.2  Tell QR generation and API client to use that IP

`frontend/.env`:

```env
VITE_PUBLIC_APP_URL=http://192.168.1.42:5173
VITE_API_BASE_URL=http://192.168.1.42:8080/api
```

`VITE_PUBLIC_APP_URL` is consumed by `lib/qr.ts → buildVerifyUrl` so QR
codes printed by Register Product point to a hostname the phone can
actually open.  Without it the QR encodes `http://localhost:5173/...`
which fails when scanned on the phone.

### 1.3  Bind backend to all interfaces

```bash
cd backend
SERVER_ADDRESS=0.0.0.0 mvn spring-boot:run
```

Spring Boot listens on `0.0.0.0:8080` and the phone can hit
`http://192.168.1.42:8080/api/...`.

### 1.4  Hardhat node

```bash
cd contracts
npx hardhat node --hostname 0.0.0.0
```

MetaMask Mobile then needs a Custom Network with:

| field         | value                          |
|---------------|--------------------------------|
| RPC URL       | `http://192.168.1.42:8545`     |
| Chain ID      | `31337`                        |
| Currency      | ETH                            |

### 1.5  HTTPS for camera permission

iOS Safari and Android Chrome **block `getUserMedia()` on plain HTTP**
except for `localhost`.  In other words the QR scanner refuses to start
on `http://192.168.1.42:5173`.

Workarounds, in order of preference:

- **Manual entry**: serial number can always be typed; the scanner is a
  convenience, not a hard requirement.
- **HTTPS tunnel** (Cloudflare Tunnel, ngrok):

  ```bash
  cloudflared tunnel --url http://localhost:5173
  ```

  The HTTPS URL it prints (`https://...trycloudflare.com`) works on any
  device.  Set `VITE_PUBLIC_APP_URL` to that URL and re-build.

- **Self-signed cert**: more work, only useful for sustained dev.

---

## 2. MetaMask Mobile limitations

| What you do on desktop                                     | What works on mobile                                                                          |
|------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| Open `http://localhost:5173`, MetaMask extension injects `window.ethereum` | The mobile browser (Chrome/Safari) does **not** have an extension; `window.ethereum` is undefined. |
| Connect wallet                                             | Only works inside the **MetaMask Mobile in-app browser** (Menu → Browser).                    |
| Sign personal_sign challenge for SIWE login                | Same — must be inside the MetaMask in-app browser, otherwise add WalletConnect (roadmap).     |
| Switch chain via `wallet_switchEthereumChain`              | Same — works inside MetaMask in-app browser; outside it the call returns `code: -32603`.      |

### Recommended phone test flow

1. Open the **MetaMask Mobile** app.
2. Bottom menu → **Browser** → enter the LAN URL (or your Cloudflare
   tunnel HTTPS URL).
3. Pages that need the wallet (`/register`, `/transfer`, `/recall`) now
   work because `window.ethereum` is provided by MetaMask's in-app
   provider.
4. `/verify` works in **any** mobile browser because it never touches
   the wallet — only the public RPC plus on-chain read calls.

### WalletConnect (roadmap)

To support arbitrary mobile wallets without the MetaMask in-app browser
detour, integrate the WalletConnect v2 SDK (`@walletconnect/ethereum-provider`)
and expose it as a second "Connect" button.  This is intentionally NOT
included in the MVP because it adds a 100 KB+ dependency and a server-
side relay configuration that is out of scope for the diploma demo.

---

## 3. Diagnostic checklist

| Symptom                                       | Likely cause                                                | Fix                                                                                |
|-----------------------------------------------|-------------------------------------------------------------|------------------------------------------------------------------------------------|
| QR opens but page says "Could not connect"    | Phone hit `localhost:5173`                                  | Set `VITE_PUBLIC_APP_URL` to LAN IP / HTTPS tunnel; rebuild                        |
| Phone can browse the site, scanner is grey    | `getUserMedia` blocked because not HTTPS                    | Use cloudflared / ngrok HTTPS tunnel, or paste serial manually                     |
| MetaMask Mobile says "wrong network"          | Phone connected to mainnet, contract is on `chainId=31337`  | Inside MetaMask in-app browser tap the wrong-chain banner → "Переключить"; or add Custom Network with LAN-IP RPC URL |
| Login button does nothing on Safari           | `window.ethereum` undefined outside MetaMask in-app browser | Open the URL inside MetaMask app (Menu → Browser)                                  |
| Mobile receives 401 on `/api/auth/login`      | Signature recovered to a different address                  | Ensure MetaMask account selected on the phone matches the one used for the SIWE nonce  |
