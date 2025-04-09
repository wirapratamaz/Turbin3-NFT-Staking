import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, BN, web3 } from "@coral-xyz/anchor";
import { NftStaking, IDL } from "../target/types/nft_staking";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// Read keypair from file
const loadKeypair = (filePath) => {
  const keypairData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return Keypair.fromSecretKey(new Uint8Array(keypairData));
};

async function main() {
  // Setup connection
  const connection = new Connection(
    process.env.SOLANA_RPC_URL || "http://localhost:8899",
    "confirmed"
  );

  // Load wallet
  const walletPath = path.resolve(
    process.env.WALLET_PATH || "~/.config/solana/id.json"
  );
  const wallet = loadKeypair(walletPath);

  console.log(`Using wallet: ${wallet.publicKey.toString()}`);

  // Setup provider
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: wallet.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(wallet);
        return tx;
      },
      signAllTransactions: async (txs) => {
        return txs.map((tx) => {
          tx.partialSign(wallet);
          return tx;
        });
      },
    },
    { commitment: "confirmed" }
  );

  // Load program ID from Anchor.toml or environment
  const programIdPath = path.resolve("./target/deploy/nft_staking-keypair.json");
  const programKeypair = loadKeypair(programIdPath);
  const programId = programKeypair.publicKey;

  console.log(`Program ID: ${programId.toString()}`);

  // Initialize program
  const program = new Program(IDL, programId, provider);

  try {
    // Initialize config
    const pointsPerStake = 100;
    const maxStake = 10;
    const freezePeriod = new BN(60 * 60 * 24 * 1); // 1 day

    console.log("Initializing program config...");
    
    const tx = await program.methods
      .initConfig({
        pointsPerStake,
        maxStake,
        freezePeriod,
      })
      .accounts({
        admin: wallet.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([wallet])
      .rpc();

    console.log(`Config initialized successfully! TX: ${tx}`);
    console.log(`Points per stake: ${pointsPerStake}`);
    console.log(`Max stake per user: ${maxStake}`);
    console.log(`Freeze period: ${freezePeriod.toNumber() / (60 * 60 * 24)} days`);
  } catch (err) {
    console.error("Error initializing program:", err);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  }); 