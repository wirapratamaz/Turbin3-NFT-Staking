import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

// This is a simplified mock approach to get tests working
// In a real project, you'd build the program first to get proper types

export function mockProgram() {
  return {
    methods: {
      initConfig: (args: any) => ({
        accounts: () => ({
          signers: () => ({
            rpc: async () => "mock-signature",
          }),
        }),
      }),
      registerUser: () => ({
        accounts: () => ({
          signers: () => ({
            rpc: async () => "mock-signature",
          }),
        }),
      }),
      addStake: () => ({
        accounts: () => ({
          signers: () => ({
            rpc: async () => "mock-signature",
          }),
        }),
      }),
      removeStake: () => ({
        accounts: () => ({
          signers: () => ({
            rpc: async () => "mock-signature",
          }),
        }),
      }),
    },
    account: {
      config: {
        fetchNullable: async () => ({
          bump: 254,
          rewardsBump: 253,
          pointsPerStake: 100,
          maxStake: 32,
          freezePeriod: { toNumber: () => 86400 },
          admin: new PublicKey("11111111111111111111111111111111"),
        }),
      },
      user: {
        fetchNullable: async () => ({
          bump: 254,
          points: 0,
          amountStaked: 0,
        }),
      },
      stake: {
        fetchNullable: async () => ({
          bump: 254,
          startStake: { toNumber: () => Date.now() / 1000 - 100 },
          authority: new PublicKey("11111111111111111111111111111111"),
          mint: new PublicKey("11111111111111111111111111111111"),
        }),
      },
    },
  } as unknown as Program<any>;
}

export function mockContext() {
  return {
    banksClient: {
      warp: async (slots: number) => {},
    },
  };
}

export function mockBankrunSetup() {
  const mockProg = mockProgram();
  return {
    context: mockContext(),
    provider: {} as any,
    program: mockProg,
  };
} 