import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftStaking } from "../target/types/nft_staking";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress 
} from "@solana/spl-token";
import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";
import { BN } from "bn.js";
import { expect } from "chai";

// Import our helper functions
import { createNft, createCollection } from "./utils/nft-helpers";

describe("NFT Staking Test", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftStaking as Program<NftStaking>;
  
  // Generate keypairs for various accounts
  const adminKeypair = Keypair.generate();
  const userKeypair = Keypair.generate();
  
  // PDA for config
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );
  
  // PDA for rewards mint
  const [rewardsMintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("rewards_mint"), configPda.toBuffer()],
    program.programId
  );
  
  // PDA for user
  const [userPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), userKeypair.publicKey.toBuffer()],
    program.programId
  );
  
  // NFT variables
  let collectionMint: PublicKey;
  let nftMint: PublicKey;
  let userNftAta: PublicKey;
  
  // PDA for stake
  let stakePda: PublicKey;
  
  before(async () => {
    // Airdrop SOL to admin and user
    await provider.connection.requestAirdrop(adminKeypair.publicKey, 10 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(userKeypair.publicKey, 10 * LAMPORTS_PER_SOL);
    
    // Wait for confirmation
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: '', // This is technically unnecessary when confirming just by blockhash
    });
    
    // Create collection NFT
    collectionMint = await createCollection(
      provider.connection,
      adminKeypair,
      "Test Collection",
      "TC"
    );
    
    console.log("Collection created with mint:", collectionMint.toString());
    
    // Create user NFT in the collection
    const nftResult = await createNft(
      provider.connection,
      userKeypair,
      "Test NFT",
      "TNFT",
      "https://example.com/nft.json",
      collectionMint,
      adminKeypair // Collection authority
    );
    
    nftMint = nftResult.mint;
    userNftAta = nftResult.tokenAccount;
    
    console.log("NFT created with mint:", nftMint.toString());
    
    // Calculate stake PDA
    [stakePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("stake"), nftMint.toBuffer()],
      program.programId
    );
  });
  
  it("Initializes the staking config", async () => {
    // Program parameters
    const pointsPerStake = 100;
    const maxStake = 10;
    const freezePeriod = new BN(60 * 60); // 1 hour in seconds
    
    // Initialize config
    await program.methods
      .initConfig({
        pointsPerStake,
        maxStake,
        freezePeriod,
      })
      .accounts({
        admin: adminKeypair.publicKey,
        config: configPda,
        rewardsMint: rewardsMintPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([adminKeypair])
      .rpc();
    
    // Fetch and verify config
    const config = await program.account.config.fetch(configPda);
    expect(config.pointsPerStake).to.equal(pointsPerStake);
    expect(config.maxStake).to.equal(maxStake);
    expect(config.freezePeriod.toNumber()).to.equal(freezePeriod.toNumber());
    expect(config.admin.toString()).to.equal(adminKeypair.publicKey.toString());
  });
  
  it("Registers a user", async () => {
    await program.methods
      .registerUser()
      .accounts({
        authority: userKeypair.publicKey,
        user: userPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();
    
    // Fetch and verify user
    const user = await program.account.user.fetch(userPda);
    expect(user.points).to.equal(0);
    expect(user.amountStaked).to.equal(0);
  });
  
  it("Stakes an NFT", async () => {
    // Get metadata PDA
    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    
    // Get master edition PDA
    const [masterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
        Buffer.from("edition"),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    
    // Stake the NFT
    await program.methods
      .addStake()
      .accounts({
        authority: userKeypair.publicKey,
        stake: stakePda,
        user: userPda,
        config: configPda,
        metadata: metadataPda,
        masterEdition: masterEditionPda,
        mint: nftMint,
        collectionMint: collectionMint,
        mintAta: userNftAta,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();
    
    // Fetch and verify stake account
    const stake = await program.account.stake.fetch(stakePda);
    expect(stake.authority.toString()).to.equal(userKeypair.publicKey.toString());
    expect(stake.mint.toString()).to.equal(nftMint.toString());
    
    // Fetch and verify user account
    const user = await program.account.user.fetch(userPda);
    expect(user.amountStaked).to.equal(1);
  });
  
  it("Unstakes an NFT after freeze period", async () => {
    // Get master edition PDA
    const [masterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        nftMint.toBuffer(),
        Buffer.from("edition"),
      ],
      MPL_TOKEN_METADATA_PROGRAM_ID
    );
    
    // In a real test, we'd need to wait for the freeze period to pass
    // For testing, we'll use a short freeze period or modify the blockchain time
    
    // For now, we'll just hope that our 1 second freeze period is short enough
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Unstake the NFT
    await program.methods
      .removeStake()
      .accounts({
        authority: userKeypair.publicKey,
        stake: stakePda,
        user: userPda,
        config: configPda,
        masterEdition: masterEditionPda,
        mint: nftMint,
        mintAta: userNftAta,
        metadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([userKeypair])
      .rpc();
    
    // Verify the stake account is closed
    const stakeAccount = await provider.connection.getAccountInfo(stakePda);
    expect(stakeAccount).to.be.null;
    
    // Fetch and verify user account
    const user = await program.account.user.fetch(userPda);
    expect(user.amountStaked).to.equal(0);
    expect(user.points).to.equal(100); // From the config.pointsPerStake
  });
}); 