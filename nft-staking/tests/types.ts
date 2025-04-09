import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// Temporary type definitions until anchor build generates them
export type NftStaking = {
  account: {
    config: {
      fetchNullable: (address: PublicKey) => Promise<{
        bump: number;
        rewardsBump: number;
        pointsPerStake: number;
        maxStake: number;
        freezePeriod: BN;
        admin: PublicKey;
      } | null>;
    };
    user: {
      fetchNullable: (address: PublicKey) => Promise<{
        bump: number;
        points: number;
        amountStaked: number;
      } | null>;
    };
    stake: {
      fetchNullable: (address: PublicKey) => Promise<{
        bump: number;
        startStake: BN;
        authority: PublicKey;
        mint: PublicKey;
      } | null>;
    };
  };
  methods: {
    initConfig: (args: {
      pointsPerStake: number;
      maxStake: number;
      freezePeriod: BN;
    }) => any;
    registerUser: () => any;
    addStake: () => any;
    removeStake: () => any;
  };
}; 