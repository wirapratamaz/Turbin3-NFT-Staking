import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { NftStaking } from "../../target/types/nft_staking";
import { Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { getUserPdaAndBump } from "../pda";
import { getUserAcc } from "../accounts";

describe("registerUser", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<NftStaking>;
  };

  const userKeypair = Keypair.generate();

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
    ]));
  });

  test("registers a new user", async () => {
    await program.methods
      .registerUser()
      .accounts({
        authority: userKeypair.publicKey,
      })
      .signers([userKeypair])
      .rpc();

    const [userPda, userBump] = getUserPdaAndBump(userKeypair.publicKey);
    const userAcc = await getUserAcc(program, userPda);

    expect(userAcc.bump).toEqual(userBump);
    expect(userAcc.points).toEqual(0);
    expect(userAcc.amountStaked).toEqual(0);
  });
}); 