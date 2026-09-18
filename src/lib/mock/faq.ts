/**
 * Public FAQ copy for /faq.
 */

export type FaqBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "callout"; text: string };

export type FaqItem = {
  id: string;
  question: string;
  answer: FaqBlock[];
};

export const FAQ_INTRO = {
  title: "FAQ",
  support: "Questions before your first roll? Start here.",
  lead: "Everything you need to know about BOARD, gameplay, $BOARD, fees, rewards, and how the ecosystem works. This closed demo uses invitation codes and demo balances — live staking is not available yet.",
} as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-board",
    question: "What is BOARD?",
    answer: [
      {
        type: "p",
        text: "BOARD brings back the board games we grew up with, but with a different way to play.",
      },
      {
        type: "p",
        text: "Familiar mechanics meet competitive four-player PvP. Choose your game, enter a room, challenge three rivals, and make every move count.",
      },
      { type: "callout", text: "Same memories. Different stakes." },
    ],
  },
  {
    id: "how-match-works",
    question: "How does a match work?",
    answer: [
      { type: "p", text: "Each room brings together four players." },
      {
        type: "p",
        text: "Choose your game, join a room, and compete until a winner is determined. Each game follows its own rules, strategy, and win conditions.",
      },
      { type: "callout", text: "Four players. One room. One winner." },
    ],
  },
  {
    id: "what-games",
    question: "What games are available on BOARD?",
    answer: [
      {
        type: "p",
        text: "BOARD starts with two childhood-inspired game experiences:",
      },
      {
        type: "list",
        items: [
          "Property Battle — Buy properties, collect rent, build your position, and outlast your rivals.",
          "Ludo — Move your pawns, capture opponents, and race to bring all of your pieces home first.",
        ],
      },
      {
        type: "p",
        text: "More games and competitive formats may be introduced as the BOARD ecosystem grows.",
      },
    ],
  },
  {
    id: "wallet",
    question: "Do I need a wallet to play?",
    answer: [
      {
        type: "p",
        text: "Not for this closed demo. You enter with an invitation code and play with demo balances.",
      },
      {
        type: "p",
        text: "When live rooms that use $BOARD ship, a compatible wallet will be required to hold $BOARD, enter those rooms, and receive applicable rewards.",
      },
      {
        type: "callout",
        text: "BOARD will never ask for your private key or seed phrase.",
      },
    ],
  },
  {
    id: "board-token-use",
    question: "What is $BOARD used for?",
    answer: [
      {
        type: "p",
        text: "$BOARD is the token that powers the BOARD ecosystem.",
      },
      {
        type: "p",
        text: "When staking is live, it can be used for game entries, match settlements, rewards, and other ecosystem features introduced over time. This closed demo does not move real $BOARD.",
      },
    ],
  },
  {
    id: "need-board-to-enter",
    question: "Do I need $BOARD to enter a game?",
    answer: [
      {
        type: "p",
        text: "Not in this closed demo. Demo tables use demo balances only.",
      },
      {
        type: "p",
        text: "When live, token-based rooms will require $BOARD to enter. Different rooms may have different entry amounts, shown before you join.",
      },
    ],
  },
  {
    id: "entry-pool",
    question: "What happens to the entry pool?",
    answer: [
      {
        type: "p",
        text: "When live, each player contributes the required amount when entering a room. All four entries form one match pool.",
      },
      {
        type: "p",
        text: "The match is then played between four players, and the reward pool is settled according to the room rules once a winner is determined.",
      },
      {
        type: "p",
        text: "You'll be able to review the entry amount and applicable fees before confirming. This closed demo uses demo pots only.",
      },
    ],
  },
  {
    id: "play-fee",
    question: "Is there a fee to play?",
    answer: [
      {
        type: "p",
        text: "When live staking ships, each game entry carries a 2% protocol fee. This closed demo does not charge real $BOARD.",
      },
      {
        type: "p",
        text: "The collected fee is allocated across three parts of the BOARD ecosystem:",
      },
      {
        type: "list",
        items: [
          "30% — Development. Supports continued game development, infrastructure, operations, and new features.",
          "35% — Buyback. Allocated to $BOARD buybacks.",
          "35% — Burn. Allocated to permanently removing $BOARD from circulation.",
        ],
      },
      {
        type: "callout",
        text: "2% Fee → 30% Build · 35% Buyback · 35% Burn",
      },
    ],
  },
  {
    id: "dex-fees",
    question: "What happens to fees generated from DEX trading?",
    answer: [
      {
        type: "p",
        text: "Fees generated from supported $BOARD DEX trading are allocated back into the ecosystem.",
      },
      {
        type: "list",
        items: [
          "50% — Development. Supports product development and the continued growth of BOARD.",
          "50% — Buyback. Allocated to $BOARD buybacks.",
        ],
      },
      {
        type: "callout",
        text: "DEX Fees → 50% Development · 50% Buyback",
      },
    ],
  },
  {
    id: "buyback",
    question: "What does a $BOARD buyback mean?",
    answer: [
      {
        type: "p",
        text: "Funds allocated for buybacks are used to purchase $BOARD from the market.",
      },
      {
        type: "p",
        text: "Buyback execution and timing may vary depending on market conditions and the mechanism used by the protocol.",
      },
    ],
  },
  {
    id: "burn",
    question: "What happens when $BOARD is burned?",
    answer: [
      {
        type: "p",
        text: "Tokens allocated for burning are permanently removed from circulation once the burn is executed.",
      },
      {
        type: "p",
        text: "This means gameplay activity can contribute to reducing the circulating supply of $BOARD over time.",
      },
    ],
  },
  {
    id: "dice-random",
    question: "Are the dice rolls random?",
    answer: [
      {
        type: "p",
        text: "Yes. Dice outcomes are generated independently by BOARD's randomness system.",
      },
      {
        type: "p",
        text: "Players cannot choose, change, or manually reroll a generated result. The dice do not favor a player based on their position, entry amount, or match performance.",
      },
      { type: "callout", text: "Your strategy is yours. The dice aren't." },
    ],
  },
  {
    id: "dice-manipulate",
    question: "Can another player manipulate the dice?",
    answer: [
      {
        type: "p",
        text: "No player has control over another player's dice result.",
      },
      {
        type: "p",
        text: "Every player uses the same gameplay rules and randomness system, so opponents cannot manually determine what number appears on a roll.",
      },
    ],
  },
  {
    id: "luck-based",
    question: "Is BOARD purely luck-based?",
    answer: [
      { type: "p", text: "No." },
      {
        type: "p",
        text: "The dice introduce randomness, just like the childhood games that inspired BOARD, but player decisions still matter.",
      },
      {
        type: "p",
        text: "Depending on the game, decisions around movement, positioning, property management, risk, and timing can influence how a match develops.",
      },
      {
        type: "callout",
        text: "Luck gives you the roll. What you do with it is up to you.",
      },
    ],
  },
  {
    id: "network",
    question: "What network is BOARD built on?",
    answer: [
      { type: "p", text: "BOARD is being built for Robinhood Chain." },
      {
        type: "p",
        text: "$BOARD, wallet interactions, and supported onchain features will operate through the Robinhood Chain ecosystem.",
      },
    ],
  },
  {
    id: "how-to-join",
    question: "How do I join a game?",
    answer: [
      {
        type: "p",
        text: "For this closed demo the flow is:",
      },
      {
        type: "list",
        items: [
          "Enter with your invitation code.",
          "Choose your game.",
          "Join a demo table.",
          "Take on three rivals with demo balances.",
        ],
      },
      {
        type: "p",
        text: "When live rooms ship, the flow will add wallet connect, real $BOARD entry, and fee review before you join.",
      },
      {
        type: "callout",
        text: "Pick your board. Enter the room. Start the rivalry.",
      },
    ],
  },
  {
    id: "play-with-friends",
    question: "Can I play with my friends?",
    answer: [
      {
        type: "p",
        text: "Yes. BOARD is designed around four-player competition, and supported room formats can allow you to bring your own rivals and compete together.",
      },
      { type: "p", text: "Just remember:" },
      {
        type: "callout",
        text: "Friends outside the board. Rivals once the dice roll.",
      },
    ],
  },
  {
    id: "lose-entry",
    question: "Can I lose my entry?",
    answer: [
      {
        type: "p",
        text: "In live competitive rooms, yes — only the winning outcome receives the reward according to that room's rules.",
      },
      {
        type: "p",
        text: "This closed demo does not stake or pay out real $BOARD. Always check entry amount, reward structure, and fees before joining a live match.",
      },
      {
        type: "callout",
        text: "Only enter a live room with an amount you're comfortable using for gameplay.",
      },
    ],
  },
  {
    id: "winner",
    question: "How is the winner determined?",
    answer: [
      {
        type: "p",
        text: "The winner is determined by the rules of the selected game.",
      },
      {
        type: "p",
        text: "For example, one game may require you to outlast your opponents through property strategy, while another requires you to bring your pawns home before everyone else.",
      },
      { type: "p", text: "There is no manual selection of the winner." },
    ],
  },
  {
    id: "contract-address",
    question: "Where can I find the official $BOARD contract address?",
    answer: [
      {
        type: "p",
        text: "The verified $BOARD contract address will be published only through official BOARD channels.",
      },
      {
        type: "p",
        text: "Always verify the contract address before interacting with or trading $BOARD.",
      },
      {
        type: "callout",
        text: "BOARD team members will never ask you to send funds or share your seed phrase through direct messages.",
      },
    ],
  },
  {
    id: "more-games",
    question: "Will BOARD add more games?",
    answer: [
      { type: "p", text: "That's part of the long-term direction." },
      {
        type: "p",
        text: "BOARD begins with familiar childhood-inspired experiences, but the ecosystem is designed to expand with additional games, competitive formats, seasons, and other features over time.",
      },
    ],
  },
  {
    id: "why-board",
    question: "Why BOARD?",
    answer: [
      {
        type: "p",
        text: "Because some of the best rivalries started around a board.",
      },
      {
        type: "p",
        text: "We're bringing those memories back with a new way to compete, a new economy around the game, and a reason to care about every roll again.",
      },
      {
        type: "callout",
        text: "Same memories. Different stakes. Welcome to BOARD.",
      },
    ],
  },
];
