import { BankrunProvider, ProgramTestContext } from "anchor-bankrun";
import { Program } from "@coral-xyz/anchor";
import { NftStaking } from "../target/types/nft_staking";
import { beforeEach } from "bun:test";
import { AccountMeta } from "solana-bankrun";
import idl from "../target/idl/nft_staking.json";

export async function getBankrunSetup(accounts: AccountMeta[] = []) {
  const context = await ProgramTestContext.createFromBinary(
    "./target/deploy/nft_staking.so",
    accounts
  );
  
  const provider = new BankrunProvider(context);
  const program = new Program(
    idl as any,
    idl.address,
    provider
  ) as Program<NftStaking>;

  return { context, provider, program };
} 