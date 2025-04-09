# Turbin3 NFT Staking Program

A Solana-based NFT staking program that allows users to stake their NFTs from a specific collection and earn points/rewards over time.

## Overview

This project implements a complete NFT staking solution on the Solana blockchain using the Anchor framework. Users can stake their NFTs from an approved collection, accumulate points, and later unstake their NFTs after a specified freeze period.

## Features

- **NFT Staking**: Stake NFTs from approved collections
- **Points System**: Earn points for staking NFTs based on a configurable rate
- **Freeze Period**: NFTs are locked for a configurable period after staking
- **User Management**: Track user statistics and stake history
- **Collection Verification**: Only NFTs from approved collections can be staked

## Project Structure

```
nft-staking/
├── programs/                # Solana programs
│   └── nft-staking/         # NFT staking program
│       ├── src/             # Program source code
│       │   ├── instructions/# Program instructions
│       │   ├── state/       # Program state definitions
│       │   ├── constants.rs # Program constants
│       │   ├── error.rs     # Custom error definitions
│       │   └── lib.rs       # Program entrypoint and module declarations
│       └── Cargo.toml       # Rust dependencies
├── tests/                   # Integration tests
├── scripts/                 # Utility scripts
├── Anchor.toml              # Anchor configuration
├── Cargo.toml               # Workspace configuration
└── package.json             # JavaScript dependencies
```

## Technology Stack

- **Solana Blockchain**: Fast, secure, and scalable blockchain platform
- **Anchor Framework**: Framework for building Solana programs
- **Rust**: Programming language for on-chain program logic
- **TypeScript**: Used for testing and client integration
- **SPL Tokens**: For NFT token management
- **Metaplex**: For NFT metadata and collection verification

## Prerequisites

- Solana CLI v2.1.0 or later
- Anchor CLI v0.30.1 or later
- Rust 1.69.0 or later
- Node.js v16 or later
- Bun package manager

## Setup and Installation

1. **Clone the repository**:
   ```bash
   git clone [repository-url]
   cd Turbin3-NFT-Staking
   ```

2. **Install dependencies**:
   ```bash
   bun install
   ```

3. **Build the program**:
   ```bash
   anchor build
   ```

4. **Deploy to localnet**:
   ```bash
   anchor deploy
   ```

5. **Initialize the program**:
   ```bash
   bun scripts/init-config.js
   ```

## Testing

Run the test suite with:

```bash
anchor test
```

This will:
1. Start a local Solana validator
2. Deploy the program
3. Run integration tests that simulate NFT staking, user registration, and other operations

## Program Instructions

The NFT staking program provides the following instructions:

1. **init_config**: Initialize the staking configuration with parameters like points per stake, maximum stakes, and freeze period
2. **register_user**: Register a new user account to track their staking activity and points
3. **add_stake**: Stake an NFT from an approved collection
4. **remove_stake**: Unstake an NFT after the freeze period has elapsed

## License

This project is licensed under the [ISC License](LICENSE).

## Acknowledgements

- Solana Foundation
- Anchor Framework team
- Metaplex Foundation 