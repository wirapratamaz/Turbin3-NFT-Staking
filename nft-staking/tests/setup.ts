import { BankrunProvider } from "anchor-bankrun";
import { ProgramTestContext, startAnchor, AddedAccount } from "solana-bankrun";
import { Program } from "@coral-xyz/anchor";
import { beforeEach } from "bun:test";
import idl from "../target/idl/nft_staking.json";

// Skip importing NftStaking type as it causes errors
// import { NftStaking } from "../target/types/nft_staking";

export async function getBankrunSetup(accounts: AddedAccount[] = []) {
  // Start a bankrun context
  const context = await startAnchor(
    ".",
    [],
    accounts
  );
  
  // Create the provider
  const provider = new BankrunProvider(context);
  
  // Create the program
  // Use 'as any' to bypass type checking issues
  const program = new Program(
    idl as any,
    idl.address as any,
    provider as any
  );

  return { context, provider, program };
} 