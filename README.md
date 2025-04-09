# NFT Staking

A Solana program for staking NFTs and earning rewards points.

## Overview

This project implements an NFT staking system on Solana where users can:

1. Stake NFTs from a specific collection
2. Earn points based on staking duration
3. Build up points that can be exchanged for rewards

The program uses the Anchor framework and implements security features such as NFT freezing during the staking period to prevent transfers.

## Features

- **NFT Staking**: Stake NFTs from a verified collection
- **Rewards System**: Earn points based on staking duration
- **User Management**: Track user staking activity and rewards
- **Configuration**: Customizable staking parameters (points per stake, maximum stakes, freeze period)
- **Security**: NFTs are frozen during staking to prevent transfers

## Project Structure

```
├── programs/nft-staking/src/       # Rust program code
│   ├── lib.rs                      # Entry point
│   ├── constants.rs                # Constants and seeds
│   ├── error.rs                    # Custom errors
│   ├── instructions/               # Instruction handlers
│   │   ├── init_config.rs          # Initialize configuration
│   │   ├── register_user.rs        # Register user
│   │   ├── add_stake.rs            # Stake an NFT
│   │   ├── remove_stake.rs         # Unstake an NFT
│   │   └── mod.rs                  # Module exports
│   └── state/                      # Program state
│       ├── config.rs               # Config account
│       ├── user.rs                 # User account
│       ├── stake.rs                # Stake account
│       └── mod.rs                  # Module exports
├── tests/                          # TypeScript tests
│   ├── functional/                 # Functional tests
│   ├── fixtures/                   # Test fixtures
│   ├── accounts.ts                 # Account helpers
│   ├── constants.ts                # Test constants
│   ├── pda.ts                      # PDA derivation functions
│   └── setup.ts                    # Test setup
├── Anchor.toml                     # Anchor configuration
├── Cargo.toml                      # Rust dependencies
├── package.json                    # JavaScript dependencies
└── tsconfig.json                   # TypeScript configuration
```

## Prerequisites

- Solana CLI v1.16.0 or later
- Anchor v0.31.0 or later
- Bun (for testing)
- Node.js v16 or later

## Getting Started

### Installation

1. Install dependencies:

```bash
# Install Solana CLI tools
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

2. Clone the repository and install project dependencies:

```bash
# Create a new Anchor project
anchor init nft-staking
cd nft-staking

# Install dependencies
bun install
```

3. Generate a new program ID:

```bash
anchor keys generate nft-staking
```

4. Update the program ID in `Anchor.toml` and `programs/nft-staking/src/lib.rs`.

### Building

Build the program:

```bash
anchor build
```

### Testing

Run the tests:

```bash
bun test
```

### Deployment

Deploy to localnet:

```bash
solana config set -ul
anchor deploy
```

## Usage

### Initializing the Program

1. Initialize the config:

```typescript
await program.methods
  .initConfig({
    pointsPerStake: 100,
    maxStake: 32,
    freezePeriod: new BN(60 * 60 * 24), // 1 day in seconds
  })
  .accounts({
    admin: adminWallet.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([adminWallet])
  .rpc();
```

### Registering a User

```typescript
await program.methods
  .registerUser()
  .accounts({
    authority: userWallet.publicKey,
  })
  .signers([userWallet])
  .rpc();
```

### Staking an NFT

```typescript
await program.methods
  .addStake()
  .accounts({
    authority: userWallet.publicKey,
    mint: nftMint,
    collectionMint: collectionMint,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([userWallet])
  .rpc();
```

### Unstaking an NFT

```typescript
await program.methods
  .removeStake()
  .accounts({
    authority: userWallet.publicKey,
    mint: nftMint,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .signers([userWallet])
  .rpc();
```

## Project Documentation

For more detailed information, refer to:

- [NFT Staking PRD](./NFT_Staking_PRD.md) - Product Requirements Document
- [NFT Staking Implementation Guide](./NFT_Staking_Implementation_Guide.md) - Detailed implementation guide

## Credits

This project is inspired by the [ChiefWoods/staking](https://github.com/ChiefWoods/staking) repository.

## License

ISC 