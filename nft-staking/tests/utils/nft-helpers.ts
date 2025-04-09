import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { 
  PROGRAM_ID as METADATA_PROGRAM_ID,
  DataV2,
  createCreateMetadataAccountV3Instruction,
  createCreateMasterEditionV3Instruction,
  createVerifyCollectionInstruction
} from "@metaplex-foundation/mpl-token-metadata";

/**
 * Create a collection NFT
 */
export async function createCollection(
  connection: Connection,
  authority: Keypair,
  name: string,
  symbol: string
): Promise<PublicKey> {
  // Create mint account
  const mint = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  
  // Get associated token account for authority
  const associatedToken = await getAssociatedTokenAddress(
    mint.publicKey,
    authority.publicKey
  );
  
  // Metadata account PDA
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.publicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  
  // Master edition PDA
  const [masterEditionAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.publicKey.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );
  
  // Create metadata
  const data: DataV2 = {
    name,
    symbol,
    uri: "https://arweave.net/collection.json", // Placeholder URI
    sellerFeeBasisPoints: 0,
    creators: [
      {
        address: authority.publicKey,
        verified: true,
        share: 100,
      },
    ],
    collection: null,
    uses: null,
  };
  
  // Create transaction with all instructions
  const tx = new Transaction();
  
  // Create mint account
  tx.add(
    // Create mint account
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: authority.publicKey, isSigner: true, isWritable: true },
        { pubkey: mint.publicKey, isSigner: true, isWritable: true },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data: Buffer.from([]) // This will be filled by the createInitializeMintInstruction
    }
  );
  
  // Initialize mint
  tx.add(
    createInitializeMintInstruction(
      mint.publicKey,
      0, // Decimals
      authority.publicKey,
      authority.publicKey
    )
  );
  
  // Create associated token account
  tx.add(
    createAssociatedTokenAccountInstruction(
      authority.publicKey,
      associatedToken,
      authority.publicKey,
      mint.publicKey
    )
  );
  
  // Mint 1 token
  tx.add(
    createMintToInstruction(
      mint.publicKey,
      associatedToken,
      authority.publicKey,
      1
    )
  );
  
  // Create metadata
  tx.add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint: mint.publicKey,
        mintAuthority: authority.publicKey,
        payer: authority.publicKey,
        updateAuthority: authority.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data,
          isMutable: true,
          collectionDetails: {
            __kind: "V1",
            size: 0,
          },
        },
      }
    )
  );
  
  // Create master edition
  tx.add(
    createCreateMasterEditionV3Instruction(
      {
        edition: masterEditionAccount,
        mint: mint.publicKey,
        updateAuthority: authority.publicKey,
        mintAuthority: authority.publicKey,
        payer: authority.publicKey,
        metadata: metadataAccount,
      },
      {
        createMasterEditionArgs: {
          maxSupply: 0,
        },
      }
    )
  );
  
  // Send and confirm transaction
  await sendAndConfirmTransaction(connection, tx, [authority, mint]);
  
  return mint.publicKey;
}

/**
 * Create an NFT in a collection
 */
export async function createNft(
  connection: Connection,
  owner: Keypair,
  name: string,
  symbol: string,
  uri: string,
  collectionMint: PublicKey,
  collectionAuthority: Keypair
): Promise<{ mint: PublicKey; tokenAccount: PublicKey }> {
  // Create mint account
  const mint = Keypair.generate();
  const lamports = await getMinimumBalanceForRentExemptMint(connection);
  
  // Get associated token account for owner
  const tokenAccount = await getAssociatedTokenAddress(
    mint.publicKey,
    owner.publicKey
  );
  
  // Metadata account PDA
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.publicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  
  // Master edition PDA
  const [masterEditionAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mint.publicKey.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );
  
  // Collection metadata account
  const [collectionMetadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  
  // Collection master edition account
  const [collectionMasterEditionAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      collectionMint.toBuffer(),
      Buffer.from("edition"),
    ],
    METADATA_PROGRAM_ID
  );
  
  // Create metadata
  const data: DataV2 = {
    name,
    symbol,
    uri,
    sellerFeeBasisPoints: 0,
    creators: [
      {
        address: owner.publicKey,
        verified: true,
        share: 100,
      },
    ],
    collection: {
      key: collectionMint,
      verified: false,
    },
    uses: null,
  };
  
  // Create transaction with all instructions
  const tx = new Transaction();
  
  // Create mint account
  tx.add(
    // Create mint account
    {
      programId: TOKEN_PROGRAM_ID,
      keys: [
        { pubkey: owner.publicKey, isSigner: true, isWritable: true },
        { pubkey: mint.publicKey, isSigner: true, isWritable: true },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
      ],
      data: Buffer.from([]) // This will be filled by the createInitializeMintInstruction
    }
  );
  
  // Initialize mint
  tx.add(
    createInitializeMintInstruction(
      mint.publicKey,
      0, // Decimals
      owner.publicKey,
      owner.publicKey
    )
  );
  
  // Create associated token account
  tx.add(
    createAssociatedTokenAccountInstruction(
      owner.publicKey,
      tokenAccount,
      owner.publicKey,
      mint.publicKey
    )
  );
  
  // Mint 1 token
  tx.add(
    createMintToInstruction(
      mint.publicKey,
      tokenAccount,
      owner.publicKey,
      1
    )
  );
  
  // Create metadata
  tx.add(
    createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataAccount,
        mint: mint.publicKey,
        mintAuthority: owner.publicKey,
        payer: owner.publicKey,
        updateAuthority: owner.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data,
          isMutable: true,
          collectionDetails: null,
        },
      }
    )
  );
  
  // Create master edition
  tx.add(
    createCreateMasterEditionV3Instruction(
      {
        edition: masterEditionAccount,
        mint: mint.publicKey,
        updateAuthority: owner.publicKey,
        mintAuthority: owner.publicKey,
        payer: owner.publicKey,
        metadata: metadataAccount,
      },
      {
        createMasterEditionArgs: {
          maxSupply: 0,
        },
      }
    )
  );
  
  // Send first transaction
  await sendAndConfirmTransaction(connection, tx, [owner, mint]);
  
  // Create transaction to verify the collection
  const verifyTx = new Transaction();
  
  // Verify collection
  verifyTx.add(
    createVerifyCollectionInstruction(
      {
        metadata: metadataAccount,
        collectionAuthority: collectionAuthority.publicKey,
        payer: collectionAuthority.publicKey,
        collectionMint: collectionMint,
        collection: collectionMetadataAccount,
        collectionMasterEditionAccount: collectionMasterEditionAccount,
      }
    )
  );
  
  // Send verify collection transaction
  await sendAndConfirmTransaction(connection, verifyTx, [collectionAuthority]);
  
  return { mint: mint.publicKey, tokenAccount };
} 