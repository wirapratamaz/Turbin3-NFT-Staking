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