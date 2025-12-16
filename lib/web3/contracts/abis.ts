// 智能合约 ABI (JSON 格式)
export const CreationManagerABI = [
  {
    type: 'function',
    name: 'authorizationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'paymentManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'registerOriginalWork',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'licenseFee', type: 'uint256' },
      { name: 'derivativeAllowed', type: 'bool' },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [{ name: 'workId', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'registerDerivativeWork',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'parentId', type: 'uint256' },
      { name: 'licenseFee', type: 'uint256' },
      { name: 'derivativeAllowed', type: 'bool' },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [{ name: 'workId', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getWork',
    stateMutability: 'view',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'id', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'parentId', type: 'uint256' },
          { name: 'licenseFee', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
          { name: 'derivativeAllowed', type: 'bool' },
          { name: 'exists', type: 'bool' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'getWorksByCreator',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'uint256[]' }]
  },
  {
    type: 'function',
    name: 'getDerivatives',
    stateMutability: 'view',
    inputs: [{ name: 'parentId', type: 'uint256' }],
    outputs: [{ type: 'uint256[]' }]
  },
  {
    type: 'function',
    name: 'getAncestorChain',
    stateMutability: 'view',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: [{ type: 'address[]' }]
  },
  {
    type: 'function',
    name: 'nextWorkId',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'event',
    name: 'WorkRegistered',
    inputs: [
      { name: 'workId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'licenseFee', type: 'uint256', indexed: false },
      { name: 'derivativeAllowed', type: 'bool', indexed: false },
      { name: 'metadataURI', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
] as const;

export const PaymentManagerABI = [
  {
    type: 'function',
    name: 'processPayment',
    stateMutability: 'payable',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'tipCreator',
    stateMutability: 'payable',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'distributeRevenue',
    stateMutability: 'payable',
    inputs: [
      { name: 'workId', type: 'uint256' },
      { name: 'directCreator', type: 'address' },
      { name: 'ancestors', type: 'address[]' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'withdrawPlatformFees',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    name: 'getBalance',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getCreatorRevenue',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'balances',
    stateMutability: 'view',
    inputs: [{ name: 'creator', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'creationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'authorizationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'platformWallet',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  }
] as const;

export const AuthorizationManagerABI = [
  {
    type: 'function',
    name: 'creationManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'paymentManager',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'requestAuthorization',
    stateMutability: 'payable',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'hasAuthorization',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'workId', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'getAuthorizationTimestamp',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'workId', type: 'uint256' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const;

// NFT Manager ABI
export const NFT_MANAGER_ABI = [
  {
    type: 'function',
    name: 'mintWorkNFT',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'workId', type: 'uint256' },
      { name: 'tokenURI', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getWorkTokenId',
    stateMutability: 'view',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'getTokenWork',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'isWorkNFTMinted',
    stateMutability: 'view',
    inputs: [{ name: 'workId', type: 'uint256' }],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'tokenId', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'setApprovalForAll',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' }
    ],
    outputs: []
  },
  {
    type: 'event',
    name: 'WorkNFTMinted',
    inputs: [
      { name: 'workId', type: 'uint256', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'tokenURI', type: 'string', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
] as const;

// NFT Marketplace ABI
export const NFT_MARKETPLACE_ABI = [
  {
    type: 'function',
    name: 'listToken',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'price', type: 'uint256' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'buyToken',
    stateMutability: 'payable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'cancelListing',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'getListing',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'tokenId', type: 'uint256' },
          { name: 'seller', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'active', type: 'bool' },
          { name: 'timestamp', type: 'uint256' }
        ]
      }
    ]
  },
  {
    type: 'function',
    name: 'getActiveListings',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256[]' }]
  },
  {
    type: 'function',
    name: 'getSellerListings',
    stateMutability: 'view',
    inputs: [{ name: 'seller', type: 'address' }],
    outputs: [{ type: 'uint256[]' }]
  },
  {
    type: 'event',
    name: 'TokenListed',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'TokenSold',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'buyer', type: 'address', indexed: true },
      { name: 'price', type: 'uint256', indexed: false },
      { name: 'platformFee', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  },
  {
    type: 'event',
    name: 'ListingCancelled',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'seller', type: 'address', indexed: true },
      { name: 'timestamp', type: 'uint256', indexed: false }
    ]
  }
] as const;