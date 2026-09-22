# BOARD

Pixel-art Monopoly & Ludo rooms with BOARD token deposits and withdrawals on **Robinhood Chain**.

The product is **not live**. This repo ships a **closed demo**: a public site you can attach as the GitHub project website, plus playable sample tables behind an access code. Nothing here deposits, stakes, or pays out BOARD.

## Closed demo

| Surface | Who can see it |
| --- | --- |
| `/` landing, `/how-to`, `/rules`, `/terms`, `/privacy` | Anyone |
| `/lobby`, rooms, wallet, account | Access code |

Local access code: `BOARD-CLOSED` (override with `DEMO_ACCESS_CODE`).

One-click project link after you deploy:

```
https://YOUR_DOMAIN/demo?code=YOUR_CODE
```

That URL unlocks the tables and is the one to paste into the GitHub repo **Website** field (or share with testers). `/api/demo/enter?code=YOUR_CODE` does the same.

## Stack

- Next.js App Router + React
- Drizzle ORM + Postgres (optional locally. Falls back to mocks)
- wagmi + viem for wallet connection on Robinhood Chain

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Enter the closed demo at `/demo` with `BOARD-CLOSED`.

### Database (recommended for launch)

```bash
# set DATABASE_URL in .env.local, then:
npm run db:push
```

### Wallet connection / sign-in

BOARD is **wallet-only**. No email/password profile. Wallet sign-in lives inside the closed demo; it does not stake real BOARD while `PLAY_IS_LIVE` is false.

1. Enter the demo, then open `/account` (or the header **Sign in** chip).
2. Connect MetaMask / Robinhood Wallet / any injected EVM wallet.
3. Switch to **Robinhood Chain** if prompted.
4. Click **Sign in** and approve the ownership message.
5. Your profile **is** that wallet address. Balance and game history are in the header profile menu.

Optional:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect QR connector
- `NEXT_PUBLIC_BOARD_TOKEN_ADDRESS`: BOARD ERC-20 (on-chain transfer path next)
- `PAYMENT_WEBHOOK_SECRET`: authenticate deposit/withdraw indexer webhooks
- `ALLOW_MOCK_WALLET_VERIFY=true`: local-only mock signatures (never in production)
- `DEMO_ACCESS_CODE`: closed-demo gate (default `BOARD-CLOSED`)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development |
| `npm run build` / `npm start` | Production build & serve |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to Postgres |
| `npm run db:studio` | Drizzle Studio |

## Launch checklist

- [ ] `DATABASE_URL` pointing at production Postgres
- [ ] `NEXT_PUBLIC_APP_URL` set to the live domain
- [ ] `NEXT_PUBLIC_CHAIN_ENV` = `testnet` (default) or `mainnet` for production
- [ ] Dedicated RPC URL if public RPC rate limits bite
- [ ] `PAYMENT_WEBHOOK_SECRET` set; indexer calling `/api/webhooks/payments`
- [ ] `ALLOW_MOCK_WALLET_VERIFY` unset / false in production
- [ ] WalletConnect project id if you need mobile QR connect
- [ ] BOARD token contract address when on-chain deposits go live
- [ ] `DEMO_ACCESS_CODE` set to a private code (or retire the gate when play is live)
- [ ] GitHub repo Website set to the deployed origin, or to `/demo?code=…` for testers
