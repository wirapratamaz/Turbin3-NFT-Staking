#!/bin/bash
set -e

echo "=== NFT Staking Project Setup ==="
echo "This script will set up all dependencies for the NFT staking project."

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Check Solana version
if ! command -v solana &> /dev/null; then
    echo "Installing Solana..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.17.22/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
else
    echo "Solana is already installed."
fi

# Install Anchor via AVM
if ! command -v avm &> /dev/null; then
    echo "Installing Anchor Version Manager (AVM)..."
    cargo install --git https://github.com/coral-xyz/anchor avm --locked
    avm install latest
    avm use latest
else
    echo "Anchor Version Manager is already installed."
fi

# Install Bun
if ! command -v bun &> /dev/null; then
    echo "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source "$HOME/.bun/bin/bun-profile"
else
    echo "Bun is already installed."
fi

# Install project JavaScript dependencies
echo "Installing project dependencies..."
bun install

# Generating Anchor program keypair
echo "Generating program keypair..."
mkdir -p target/deploy
anchor keys generate nft-staking

# Update program ID in Anchor.toml
PROGRAM_ID=$(solana-keygen pubkey target/deploy/nft_staking-keypair.json)
echo "Program ID: $PROGRAM_ID"

# Build the program to generate IDL and types
echo "Building program..."
anchor build

echo "=== Setup Complete ==="
echo "To run tests: bun test"
echo "To deploy: anchor deploy" 