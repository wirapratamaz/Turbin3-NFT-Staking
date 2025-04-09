import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { BN, Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  getConfigPdaAndBump,
  getStakePdaAndBump,
  getUserPdaAndBump,
} from "../pda";
import { getStakeAcc, getUserAcc } from "../accounts";
import { mintAddress, collectionAddress } from "../constants";
import { NftStaking } from "../types";

describe("removeStake", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<NftStaking>;
  };

  const userKeypair = Keypair.generate();
  const adminKeypair = Keypair.generate();

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup([
      {
        address: userKeypair.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
      },
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

    // Initialize config with a short freeze period for testing
    await program.methods
      .initConfig({
        pointsPerStake: 100,
        maxStake: 32,
        freezePeriod: new BN(1), // Very short for testing
      })
      .accounts({
        admin: adminKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([adminKeypair])
      .rpc();

    // Register user
    await program.methods
      .registerUser()
      .accounts({
        authority: userKeypair.publicKey,
      })
      .signers([userKeypair])
      .rpc();

    // Add stake
    await program.methods
      .addStake()
      .accounts({
        authority: userKeypair.publicKey,
        mint: mintAddress,
        collectionMint: collectionAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([userKeypair])
      .rpc();
    
    // Advance clock to get past freeze period
    // Instead of setting program account, we'll use BanksClient's warp method
    await context.banksClient.warp(100); // Advance by 100 slots
  });

  test("removes an NFT from stake", async () => {
    await program.methods
      .removeStake()
      .accounts({
        authority: userKeypair.publicKey,
        mint: mintAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([userKeypair])
      .rpc();

    const [stakePda] = getStakePdaAndBump(mintAddress);
    const stakeAcc = await getStakeAcc(program, stakePda);

    // Stake account should be closed
    expect(stakeAcc).toBeNull();
    
    // Check that user's staked count decreased and points increased
    const [userPda] = getUserPdaAndBump(userKeypair.publicKey);
    const userAcc = await getUserAcc(program, userPda);
    expect(userAcc.amountStaked).toEqual(0);
    expect(userAcc.points).toEqual(100); // Based on pointsPerStake
  });
}); 