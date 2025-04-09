#!/bin/bash
set -e

echo "=== Building and Testing NFT Staking Program ==="

# Build the program
echo "Building Anchor program..."
anchor build

echo "Generating TypeScript types..."
# Create directory if it doesn't exist
mkdir -p target/types

# Run typescript build to generate types from IDL
echo "Copying IDL to types directory..."
cp target/idl/nft_staking.json target/types/

# If using ts-node or similar, compile the TypeScript tests
echo "Compiling TypeScript tests..."
npx tsc -p tsconfig.json 

# Start test validator in background with Metaplex program
echo "Starting test validator with Metaplex program..."
solana-test-validator \
  --reset \
  --bpf-program metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s metadata.so &

VALIDATOR_PID=$!

# Give validator time to start
sleep 5

# Run tests
echo "Running tests..."
npm test

# Kill the validator
kill $VALIDATOR_PID

echo "=== Testing Complete ===" 