# NFT Staking - Product Requirements Document (PRD)

## Project Overview

The NFT Staking project allows users to stake their NFTs for a defined period of time to earn points, which can potentially be exchanged for rewards tokens. This document outlines the technical requirements, features, and implementation details.

## Core Functionality

1. **Staking Configuration**
   - Initialize a staking program with configurable parameters
   - Define points earned per stake
   - Set maximum number of NFTs a user can stake
   - Establish minimum staking period (freeze period)

2. **User Management**
   - Register users in the system
   - Track user points and staked NFTs
   - Maintain user account state

3. **NFT Staking**
   - Allow users to stake NFTs that belong to a specific collection
   - Freeze staked NFTs to prevent transfers during staking period
   - Calculate and award points based on staking duration
   - Implement stake and unstake functionality

## Technical Requirements

### Smart Contract Requirements

1. **Program State**
   - Config account to store global parameters
   - User account to track per-user data
   - Stake account to track NFT stake details

2. **Instructions**
   - `init_config`: Initialize program configuration
   - `register_user`: Register a new user in the system
   - `add_stake`: Stake an NFT
   - `remove_stake`: Unstake an NFT and receive points

3. **Validation Rules**
   - NFTs must belong to the specified collection
   - Users cannot exceed maximum stake limit
   - NFTs cannot be unstaked before freeze period ends
   - Only the NFT owner can stake and unstake

### Implementation Details

1. **Program Accounts**
   - **Config**: Stores global configuration parameters
     - Points per stake
     - Maximum stake limit
     - Freeze period duration
     - Admin authority
   
   - **User**: Tracks individual user data
     - Points earned
     - Number of NFTs staked
   
   - **Stake**: Contains information about each staked NFT
     - Start timestamp
     - NFT mint address
     - Owner address

2. **NFT Handling**
   - Use token delegation to gain authority over the NFT
   - Freeze NFT to prevent transfers during staking period
   - Thaw NFT when unstaking

3. **Rewards System**
   - Track points in the user account
   - Award points when NFTs are unstaked based on staking duration
   - Support for future token rewards (mint created during initialization)

## Project Milestones

1. **Setup and Configuration**
   - Create a new Anchor project from scratch
   - Initialize the project structure
   - Build and deploy the program

2. **Core Implementation**
   - Implement the staking contract
   - Develop and test instructions
   - Create test fixtures

3. **Testing and Verification**
   - Create comprehensive test suite
   - Test all instructions and edge cases
   - Verify security measures

4. **Documentation and Deployment**
   - Document the code and API
   - Create usage examples
   - Deploy to testnet or localnet

## Technical Stack

1. **Backend/Smart Contract**
   - Solana blockchain
   - Anchor framework
   - Rust programming language

2. **Testing**
   - Bun test runner
   - Bankrun testing environment
   - TypeScript

3. **Libraries**
   - @coral-xyz/anchor
   - @solana/web3.js
   - @solana/spl-token
   - @metaplex-foundation/mpl-token-metadata

## Implementation Guide

1. **Setup Project From Scratch**
   ```bash
   # Create a new Anchor project
   anchor init nft-staking
   cd nft-staking
   
   # Install dependencies
   npm install @coral-xyz/anchor @solana/web3.js @solana/spl-token @metaplex-foundation/mpl-token-metadata
   # Or with bun
   bun add @coral-xyz/anchor @solana/web3.js @solana/spl-token @metaplex-foundation/mpl-token-metadata
   
   # Setup dev dependencies for testing
   bun add -d solana-bankrun anchor-bankrun typescript bun
   
   # Generate a program ID
   anchor keys generate nft-staking
   
   # Update Anchor.toml with the new program ID
   # Replace the existing program ID in programs/nft-staking/src/lib.rs
   
   # Build the program
   anchor build
   ```

2. **Create Program Structure**
   - Create the following directory structure:
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

3. **Implement Core Functionality**
   - Create account structures in the state files
   - Implement instruction handlers for each operation
   - Define validation rules and errors

4. **Create Test Structure**
   - Setup test directory with fixtures for NFT data
   - Implement test utilities for PDA derivation
   - Create functional tests for each instruction

5. **Run Tests**
   ```bash
   bun test
   ```

6. **Deploy Program**
   ```bash
   solana config set -ul # Use localnet
   anchor deploy
   ```

## Development Tasks

1. **Set up project structure**
   - Create a new Anchor project
   - Configure dependencies and project files
   - Design the module structure

2. **Implement core functionality**
   - Define program accounts and state
   - Implement all required instructions
   - Create validation logic

3. **Test thoroughly**
   - Create unit tests for individual functions
   - Develop integration tests for end-to-end workflows
   - Test edge cases and error conditions

4. **Document your work**
   - Comment your code
   - Create a comprehensive README file
   - Provide usage examples

## Resources

- [ChiefWoods Staking Repository](https://github.com/ChiefWoods/staking)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Documentation](https://docs.solana.com/)
- [Metaplex Documentation](https://docs.metaplex.com/)
- [ChiefWoods Staking Repository](https://github.com/ChiefWoods/staking) (For reference only) 