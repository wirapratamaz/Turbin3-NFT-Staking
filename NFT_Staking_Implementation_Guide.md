# NFT Staking - Implementation Guide

This guide provides detailed steps to implement the NFT staking project from scratch, based on the requirements outlined in the PRD.

## Table of Contents
1. [Project Setup](#project-setup)
2. [Program Account Structures](#program-account-structures)
3. [Program Instructions](#program-instructions)
4. [Testing](#testing)
5. [Deployment](#deployment)

## Project Setup

### 1. Install Dependencies

First, make sure you have the necessary tools installed:

```bash
# Install Solana CLI tools
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install avm (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked
```

### 2. Create a New Anchor Project

```bash
# Create a new Anchor project
anchor init nft-staking
cd nft-staking
```

### 3. Configure Project Dependencies

Update the `Cargo.toml` file in the workspace root:

```toml
[workspace]
members = [
    "programs/*"
]
resolver = "2"

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
```

Update the `Cargo.toml` in the program directory:

```toml
[package]
name = "nft-staking"
version = "0.1.0"
description = "NFT Staking Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "nft_staking"

[features]
default = []
cpi = ["no-entrypoint"]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
idl-build = ["anchor-lang/idl-build", "anchor-spl/idl-build"]

[dependencies]
anchor-lang = "0.31.0"
anchor-spl = { version = "0.31.0", features = ["metadata"] }
```

### 4. Update `package.json`

```bash
# Install JS/TS dependencies
bun add @coral-xyz/anchor @solana/web3.js @solana/spl-token @metaplex-foundation/mpl-token-metadata
bun add -d solana-bankrun anchor-bankrun typescript bun husky lint-staged prettier
```

Edit the `package.json` file:

```json
{
  "type": "module",
  "license": "ISC",
  "scripts": {
    "lint:fix": "prettier */*.js \"*/**/*{.js,.ts}\" -w",
    "lint": "prettier */*.js \"*/**/*{.js,.ts}\" --check",
    "prepare": "husky"
  },
  "dependencies": {
    "@coral-xyz/anchor": "^0.31.0",
    "@metaplex-foundation/mpl-token-metadata": "^3.4.0",
    "@solana/spl-token": "^0.4.13",
    "@solana/web3.js": "^1.98.0"
  },
  "devDependencies": {
    "@types/bn.js": "^5.1.6",
    "@types/bun": "^1.2.4",
    "anchor-bankrun": "^0.5.0",
    "husky": "^9.1.7",
    "lint-staged": "^15.4.3",
    "prettier": "^2.8.8",
    "solana-bankrun": "^0.4.0",
    "typescript": "^4.9.5"
  }
}
```

### 5. Update `tsconfig.json`

```json
{
  "compilerOptions": {
    "types": ["bun"],
    "typeRoots": ["./node_modules/@types"],
    "lib": ["ESNext"],
    "module": "ESNext",
    "target": "ESNext",
    "esModuleInterop": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
  }
}
```

### 6. Configure Anchor.toml

```toml
[toolchain]
anchor_version = "0.31.0"
solana_version = "2.1.0"

[features]
resolution = true
skip-lint = false

[programs.localnet]
nft_staking = "YOUR_PROGRAM_ID"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "bun test --timeout 1000000"
```

### 7. Generate a new Program ID

```bash
anchor keys generate nft-staking
```

Update `declare_id!` in `programs/nft-staking/src/lib.rs` with the generated Program ID.

## Program Account Structures

### 1. Create Program Structure

Create the following directory structure:

```
programs/nft-staking/src/
├── constants.rs     # Program constants
├── error.rs         # Error definitions
├── lib.rs           # Main program entry point
├── instructions/    # Instruction handlers
│   ├── init_config.rs
│   ├── register_user.rs
│   ├── add_stake.rs
│   ├── remove_stake.rs
│   └── mod.rs
└── state/           # Program account definitions
    ├── config.rs
    ├── user.rs
    ├── stake.rs
    └── mod.rs
```

### 2. Define Constants

Create `programs/nft-staking/src/constants.rs`:

```rust
use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::accounts::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
pub const REWARDS_MINT_SEED: &[u8] = b"rewards_mint";
pub const USER_SEED: &[u8] = b"user";
pub const STAKE_SEED: &[u8] = b"stake";
pub const METADATA_SEED: &[u8] = Metadata::PREFIX;
pub const EDITION_SEED: &[u8] = MasterEdition::PREFIX.1;
```

### 3. Define Error Types

Create `programs/nft-staking/src/error.rs`:

```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Max stake limit reached")]
    MaxStakeLimitReached,
    #[msg("Freeze period not over")]
    FreezePeriodNotOver,
}
```

### 4. Define Program State

Create state files:

`programs/nft-staking/src/state/config.rs`:
```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub bump: u8,
    pub rewards_bump: u8,
    pub points_per_stake: u8,
    pub max_stake: u8,
    pub freeze_period: i64,
    pub admin: Pubkey,
}
```

`programs/nft-staking/src/state/user.rs`:
```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct User {
    pub bump: u8,
    pub points: u32,
    pub amount_staked: u8,
}
```

`programs/nft-staking/src/state/stake.rs`:
```rust
use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Stake {
    pub bump: u8,
    pub start_stake: i64,
    pub authority: Pubkey,
    pub mint: Pubkey,
}
```

`programs/nft-staking/src/state/mod.rs`:
```rust
pub mod config;
pub mod stake;
pub mod user;

pub use config::*;
pub use stake::*;
pub use user::*;
```

## Program Instructions

### 1. Define Main Program Module

Create the main program module in `programs/nft-staking/src/lib.rs`:

```rust
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("YOUR_PROGRAM_ID");

#[program]
pub mod nft_staking {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, args: InitConfigArgs) -> Result<()> {
        InitConfig::init_config(ctx, args)
    }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        RegisterUser::register_user(ctx)
    }

    pub fn add_stake(ctx: Context<AddStake>) -> Result<()> {
        AddStake::add_stake(ctx)
    }

    pub fn remove_stake(ctx: Context<RemoveStake>) -> Result<()> {
        RemoveStake::remove_stake(ctx)
    }
}
```

### 2. Implement Instruction Handlers

Create `programs/nft-staking/src/instructions/mod.rs`:
```rust
pub mod add_stake;
pub mod init_config;
pub mod register_user;
pub mod remove_stake;

pub use add_stake::*;
pub use init_config::*;
pub use register_user::*;
pub use remove_stake::*;
```

`programs/nft-staking/src/instructions/init_config.rs`:
```rust
use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{constants::*, state::*};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitConfigArgs {
    pub points_per_stake: u8,
    pub max_stake: u8,
    pub freeze_period: i64,
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = Config::DISCRIMINATOR.len() + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = admin,
        seeds = [REWARDS_MINT_SEED, config.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = admin,
    )]
    pub rewards_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl InitConfig<'_> {
    pub fn init_config(ctx: Context<InitConfig>, args: InitConfigArgs) -> Result<()> {
        ctx.accounts.config.set_inner(Config {
            bump: ctx.bumps.config,
            rewards_bump: ctx.bumps.rewards_mint,
            points_per_stake: args.points_per_stake,
            max_stake: args.max_stake,
            freeze_period: args.freeze_period,
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }
}
```

`programs/nft-staking/src/instructions/register_user.rs`:
```rust
use anchor_lang::{prelude::*, Discriminator};

use crate::{constants::*, state::*};

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = User::DISCRIMINATOR.len() + User::INIT_SPACE,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump,
    )]
    pub user: Account<'info, User>,
    pub system_program: Program<'info, System>,
}

impl RegisterUser<'_> {
    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        ctx.accounts.user.set_inner(User {
            bump: ctx.bumps.user,
            points: 0,
            amount_staked: 0,
        });

        Ok(())
    }
}
```

`programs/nft-staking/src/instructions/add_stake.rs`:
```rust
use crate::{constants::*, error::StakingError, state::*};
use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::{
    metadata::{
        mpl_token_metadata::instructions::FreezeDelegatedAccountCpiBuilder, MasterEditionAccount,
        Metadata, MetadataAccount,
    },
    token_interface::{approve, Approve, Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct AddStake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Stake::DISCRIMINATOR.len() + Stake::INIT_SPACE,
        seeds = [STAKE_SEED, mint.key().as_ref()],
        bump,
    )]
    pub stake: Account<'info, Stake>,
    #[account(
        mut,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump = user.bump,
    )]
    pub user: Account<'info, User>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [
            METADATA_SEED,
            metadata_program.key().as_ref(),
            mint.key().as_ref()
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
    )]
    pub metadata: Account<'info, MetadataAccount>,
    #[account(
        seeds = [
            METADATA_SEED,
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            EDITION_SEED,
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mint::token_program = token_program)]
    pub collection_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub mint_ata: InterfaceAccount<'info, TokenAccount>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl AddStake<'_> {
    pub fn add_stake(ctx: Context<AddStake>) -> Result<()> {
        require!(
            ctx.accounts.user.amount_staked < ctx.accounts.config.max_stake,
            StakingError::MaxStakeLimitReached
        );

        ctx.accounts.stake.set_inner(Stake {
            bump: ctx.bumps.stake,
            start_stake: Clock::get()?.unix_timestamp,
            authority: ctx.accounts.authority.key(),
            mint: ctx.accounts.mint.key(),
        });

        let user = &mut ctx.accounts.user;
        user.amount_staked = user.amount_staked.checked_add(1).unwrap();

        approve(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Approve {
                    authority: ctx.accounts.authority.to_account_info(),
                    delegate: ctx.accounts.stake.to_account_info(),
                    to: ctx.accounts.mint_ata.to_account_info(),
                },
            ),
            1,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            STAKE_SEED,
            &ctx.accounts.mint.key().to_bytes(),
            &[ctx.accounts.stake.bump],
        ]];

        FreezeDelegatedAccountCpiBuilder::new(&ctx.accounts.metadata_program.to_account_info())
            .delegate(&ctx.accounts.stake.to_account_info())
            .edition(&ctx.accounts.master_edition.to_account_info())
            .mint(&ctx.accounts.mint.to_account_info())
            .token_account(&ctx.accounts.mint_ata.to_account_info())
            .token_program(&ctx.accounts.token_program.to_account_info())
            .invoke_signed(signer_seeds)?;

        Ok(())
    }
}
```

`programs/nft-staking/src/instructions/remove_stake.rs`:
```rust
use crate::{constants::*, error::StakingError, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        mpl_token_metadata::instructions::ThawDelegatedAccountCpiBuilder, MasterEditionAccount,
        Metadata,
    },
    token_interface::{revoke, Mint, Revoke, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct RemoveStake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority,
        seeds = [STAKE_SEED, mint.key().as_ref()],
        bump = stake.bump,
    )]
    pub stake: Account<'info, Stake>,
    #[account(
        mut,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump = user.bump,
    )]
    pub user: Account<'info, User>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [
            METADATA_SEED,
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            EDITION_SEED,
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub mint_ata: InterfaceAccount<'info, TokenAccount>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl RemoveStake<'_> {
    pub fn remove_stake(ctx: Context<RemoveStake>) -> Result<()> {
        require_gte!(
            Clock::get()?.unix_timestamp - ctx.accounts.stake.start_stake,
            ctx.accounts.config.freeze_period,
            StakingError::FreezePeriodNotOver
        );

        let user = &mut ctx.accounts.user;
        user.amount_staked = user.amount_staked.checked_sub(1).unwrap();
        user.points = user
            .points
            .checked_add(ctx.accounts.config.points_per_stake.into())
            .unwrap();

        let signer_seeds: &[&[&[u8]]] = &[&[
            STAKE_SEED,
            &ctx.accounts.mint.key().to_bytes(),
            &[ctx.accounts.stake.bump],
        ]];

        ThawDelegatedAccountCpiBuilder::new(&ctx.accounts.metadata_program.to_account_info())
            .delegate(&ctx.accounts.stake.to_account_info())
            .edition(&ctx.accounts.master_edition.to_account_info())
            .mint(&ctx.accounts.mint.to_account_info())
            .token_account(&ctx.accounts.mint_ata.to_account_info())
            .token_program(&ctx.accounts.token_program.to_account_info())
            .invoke_signed(signer_seeds)?;

        revoke(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Revoke {
                authority: ctx.accounts.authority.to_account_info(),
                source: ctx.accounts.mint_ata.to_account_info(),
            },
        ))
    }
}
```

## Testing

### 1. Create Test Structure

Create the test directory structure:

```
tests/
├── constants.ts
├── pda.ts
├── accounts.ts
├── setup.ts
├── fixtures/
│   ├── collection.json
│   ├── master_edition.json
│   ├── metadata.json
│   └── mint.json
└── functional/
    ├── initConfig.test.ts
    ├── registerUser.test.ts
    ├── addStake.test.ts
    └── removeStake.test.ts
```

### 2. Implement Test Utilities

`tests/constants.ts`:
```typescript
import { PublicKey } from "@solana/web3.js";

export const [
  mintAddress,
  collectionAddress,
  masterEditionAddress,
  metadataAddress,
  mintAtaAddress,
] = [
  "7y1aPbyek7qALhGuAGMwwe1FLF7swykuadJZqHg5uP3Y",
  "5sDBuHZ7zDzZ2Px1YQS3ELxoFja5J66vpKKcW84ndRk7",
  "Cg5XY9vT8jpdg9tKreAedqiUuoMgVxh1mZY1khidR3mM",
  "8QRPrn6YAGnHXzyyWescAr9CymDghiauRqsL7tCuGbA2",
  "2D15m1PtBVSRoaSbnEBVoMQSvTks2QHk88e8RFVXCUVk",
].map((address) => new PublicKey(address));
```

`tests/pda.ts`:
```typescript
import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/nft_staking.json";

export function getConfigPdaAndBump() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(idl.address)
  );
}

export function getUserPdaAndBump(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user"), authority.toBuffer()],
    new PublicKey(idl.address)
  );
}

export function getStakePdaAndBump(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), mint.toBuffer()],
    new PublicKey(idl.address)
  );
}

export function getRewardsMintPdaAndBump(configPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rewards_mint"), configPda.toBuffer()],
    new PublicKey(idl.address)
  );
}
```

`tests/accounts.ts`:
```typescript
import { PublicKey } from "@solana/web3.js";
import { NftStaking } from "../target/types/nft_staking";
import { Program } from "@coral-xyz/anchor";

export async function getConfigAcc(
  program: Program<NftStaking>,
  configPda: PublicKey
) {
  return await program.account.config.fetchNullable(configPda);
}

export async function getUserAcc(
  program: Program<NftStaking>,
  userPda: PublicKey
) {
  return await program.account.user.fetchNullable(userPda);
}

export async function getStakeAcc(
  program: Program<NftStaking>,
  stakePda: PublicKey
) {
  return await program.account.stake.fetchNullable(stakePda);
}
```

### 3. Implement Tests

Create test files for each instruction. Here's an example for `initConfig.test.ts`:

```typescript
import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { NftStaking } from "../../target/types/nft_staking";
import { BN, Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConfigPdaAndBump, getRewardsMintPdaAndBump } from "../pda";
import { getConfigAcc } from "../accounts";

describe("initConfig", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<NftStaking>;
  };

  const adminKeypair = Keypair.generate();

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup([
      {
        address: adminKeypair.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
      },
    ]));
  });

  test("initializes config", async () => {
    const pointsPerStake = 100;
    const maxStake = 32;
    const freezePeriod = new BN(60 * 60 * 24 * 1); // 1 day

    await program.methods
      .initConfig({
        pointsPerStake,
        maxStake,
        freezePeriod,
      })
      .accounts({
        admin: adminKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([adminKeypair])
      .rpc();

    const [configPda, configBump] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    expect(configAcc.bump).toEqual(configBump);
    expect(configAcc.pointsPerStake).toEqual(pointsPerStake);
    expect(configAcc.maxStake).toEqual(maxStake);
    expect(configAcc.freezePeriod.toNumber()).toEqual(freezePeriod.toNumber());
    expect(configAcc.admin).toStrictEqual(adminKeypair.publicKey);

    const rewardsBump = getRewardsMintPdaAndBump(configPda)[1];

    expect(configAcc.rewardsBump).toEqual(rewardsBump);
  });
});
```

## Deployment

### 1. Build the Program

```bash
anchor build
```

### 2. Deploy to Localnet

```bash
solana config set -ul
anchor deploy
```

### 3. Initialize the Program

Once deployed, you need to initialize the config:

```typescript
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { NftStaking, IDL } from "./target/types/nft_staking";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

// Setup provider
const connection = new Connection("http://localhost:8899", "confirmed");
const wallet = new Keypair(); // Your wallet keypair
const provider = new AnchorProvider(
  connection,
  { publicKey: wallet.publicKey, signTransaction: async (tx) => tx, signAllTransactions: async (txs) => txs },
  {}
);

// Initialize program
const programId = new PublicKey("YOUR_PROGRAM_ID");
const program = new Program<NftStaking>(IDL, programId, provider);

// Initialize config
async function initConfig() {
  const pointsPerStake = 100;
  const maxStake = 32;
  const freezePeriod = new BN(60 * 60 * 24 * 1); // 1 day

  await program.methods
    .initConfig({
      pointsPerStake,
      maxStake,
      freezePeriod,
    })
    .accounts({
      admin: wallet.publicKey,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .signers([wallet])
    .rpc();
}

initConfig();
```

## Conclusion

This guide has walked you through the process of building an NFT staking program from scratch. By following these steps, you should have a working Solana program that allows users to stake their NFTs and earn points. 

The completed project includes:
- A configurable staking program
- User registration and management
- NFT staking and unstaking functionality
- Reward points system
- Security features like NFT freezing during staking

You can extend this program by adding features like:
- A frontend UI for interacting with the program
- Reward token distribution using the rewards mint
- Additional staking strategies or tiers
- Analytics and leaderboards
</rewritten_file> 