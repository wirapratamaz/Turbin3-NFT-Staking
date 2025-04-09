import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { NftStaking } from "../../target/types/nft_staking";
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

describe("addStake", () => {
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

    // Initialize config
    await program.methods
      .initConfig({
        pointsPerStake: 100,
        maxStake: 32,
        freezePeriod: new BN(60 * 60 * 24), // 1 day
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
  });

  test("adds an NFT to stake", async () => {
    // Note: In a real test, we would need to create an NFT, but for this example
    // we'll just use the constants and focus on testing the stake functionality
    
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

    const [stakePda, stakeBump] = getStakePdaAndBump(mintAddress);
    const stakeAcc = await getStakeAcc(program, stakePda);

    expect(stakeAcc.bump).toEqual(stakeBump);
    expect(stakeAcc.authority).toStrictEqual(userKeypair.publicKey);
    expect(stakeAcc.mint).toStrictEqual(mintAddress);
    
    // Check that user's staked count increased
    const [userPda] = getUserPdaAndBump(userKeypair.publicKey);
    const userAcc = await getUserAcc(program, userPda);
    expect(userAcc.amountStaked).toEqual(1);
  });
}); 