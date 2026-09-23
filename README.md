# BOARD

Pixel-art Monopoly & Ludo rooms with BOARD token deposits and withdrawals on **Robinhood Chain**.

## Stack

- Next.js App Router + React
- Drizzle ORM + Postgres (optional locally. Falls back to mocks)
- wagmi + viem for wallet connection on Robinhood Chain

## Separate game deployment

The public website can hand off every Play CTA to a separately deployed game
client. Set `NEXT_PUBLIC_PLAY_APP_URL` to that deployment's origin (for example,
`https://play.example.com`). If it is unset, links continue to use this repo's
local `/play` route as a rollback during migration.

## Getting started

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Database (recommended for launch)

```bash
# set DATABASE_URL in .env.local, then:
npm run db:push
```

### Wallet connection / sign-in

BOARD is **wallet-only**. No email/password profile.

1. Open `/account` (or the header **Sign in** chip).
2. Connect MetaMask / Robinhood Wallet / any injected EVM wallet.
3. Switch to **Robinhood Chain** if prompted.
4. Click **Sign in** and approve the ownership message.
5. Your profile **is** that wallet address. Balance and game history are in the header profile menu.

Optional:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect QR connector
- `NEXT_PUBLIC_BOARD_TOKEN_ADDRESS`: BOARD ERC-20
- `PAYMENT_WEBHOOK_SECRET`: authenticate deposit/withdraw indexer webhooks
- `ALLOW_MOCK_WALLET_VERIFY=true`: local-only mock signatures (never in production)
- `NEXT_PUBLIC_CHAIN_ENV`: `testnet` (default) or `mainnet`

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
- [ ] `NEXT_PUBLIC_CHAIN_ENV` = `mainnet` for production
- [ ] Dedicated RPC URL if public RPC rate limits bite
- [ ] `PAYMENT_WEBHOOK_SECRET` set; indexer calling `/api/webhooks/payments`
- [ ] `ALLOW_MOCK_WALLET_VERIFY` unset / false in production
- [ ] WalletConnect project id if you need mobile QR connect
- [ ] BOARD token contract address for on-chain deposits
- [ ] GitHub repo Website set to the deployed origin
