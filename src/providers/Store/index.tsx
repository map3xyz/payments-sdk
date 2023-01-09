import { BigNumber, ethers } from 'ethers';
import React, { createContext, PropsWithChildren, useReducer } from 'react';

import {
  AssetWithPrice,
  Network,
  PaymentMethod,
} from '../../generated/apollo-gql';
import { PrebuiltTx } from '../../utils/transactions/evm';

export enum Steps {
  'AssetSelection' = 0,
  'NetworkSelection' = 1,
  'PaymentMethod' = 2,
  'SwitchChain' = 3,
  'EnterAmount' = 4,
  'WalletConnect' = 5,
  'QRCode' = 6,
  'Result' = 7,
  __LENGTH,
}

type RemoteType = 'loading' | 'success' | 'error' | 'idle';

export type AlertType = {
  id: number;
  message: string;
  title: string;
  variant?: 'success' | 'danger' | 'warning' | 'info';
};

type State = {
  account: {
    data: string | undefined;
    status: RemoteType;
  };
  asset?: AssetWithPrice;
  colors?: {
    progressBar?: string;
    scrollBar?: string;
  };
  depositAddress: {
    data?: { address: string };
    status: RemoteType;
  };
  fiat?: string;
  method?: PaymentMethod & { description?: string };
  network?: Network;
  prebuiltTx: {
    data?: {
      feeError: boolean;
      gasLimit: number;
      gasPrice: number;
      maxLimitFormatted: string;
      maxLimitRaw: BigNumber;
      tx: PrebuiltTx;
    };
    error?: string;
    status: RemoteType;
  };
  provider?: {
    data?: ethers.providers.Web3Provider;
    error?: string;
    status: RemoteType;
  };
  providerChainId?: number;
  slug?: string;
  step: number;
  steps: (keyof typeof Steps)[];
  theme?: 'dark' | 'light';
  transaction?: {
    error?: string;
    hash?: string;
    status: RemoteType;
  };
};

type Action =
  | { type: 'RESET_STATE' }
  | { payload: AssetWithPrice; type: 'SET_ASSET' }
  | { payload: Network; type: 'SET_NETWORK' }
  | { payload?: PaymentMethod; type: 'SET_PAYMENT_METHOD' }
  | { payload: number; type: 'SET_STEP' }
  | { payload: (keyof typeof Steps)[]; type: 'SET_STEPS' }
  | {
      payload: { address: string; memo?: string };
      type: 'GENERATE_DEPOSIT_ADDRESS_SUCCESS';
    }
  | { type: 'GENERATE_DEPOSIT_ADDRESS_ERROR' }
  | { type: 'GENERATE_DEPOSIT_ADDRESS_LOADING' }
  | { type: 'GENERATE_DEPOSIT_ADDRESS_IDLE' }
  | { type: 'SET_ACCOUNT_IDLE' }
  | { type: 'SET_ACCOUNT_LOADING' }
  | { payload: string; type: 'SET_ACCOUNT_SUCCESS' }
  | { payload: string; type: 'SET_ACCOUNT_ERROR' }
  | { type: 'SET_PROVIDER_IDLE' }
  | { type: 'SET_PROVIDER_LOADING' }
  | { payload: any; type: 'SET_PROVIDER_SUCCESS' }
  | { payload: string; type: 'SET_PROVIDER_ERROR' }
  | { payload: string; type: 'SET_TRANSACTION_SUCCESS' }
  | { payload: string; type: 'SET_TRANSACTION_ERROR' }
  | { type: 'SET_TRANSACTION_LOADING' }
  | { type: 'SET_BALANCE_LOADING' }
  | {
      payload: {
        assetBalance: ethers.BigNumber;
        chainBalance: ethers.BigNumber;
      };
      type: 'SET_BALANCE_SUCCESS';
    }
  | { payload: string; type: 'SET_BALANCE_ERROR' }
  | { type: 'SET_BALANCE_IDLE' }
  | { type: 'SET_PREBUILT_TX_LOADING' }
  | {
      payload: {
        feeError: boolean;
        gasLimit: number;
        gasPrice: number;
        maxLimitFormatted: string;
        maxLimitRaw: BigNumber;
        tx: PrebuiltTx;
      };
      type: 'SET_PREBUILT_TX_SUCCESS';
    }
  | { payload: string; type: 'SET_PREBUILT_TX_ERROR' }
  | { type: 'SET_PREBUILT_TX_IDLE' }
  | { payload?: number; type: 'SET_PROVIDER_CHAIN_ID' };

const initialState: State = {
  account: {
    data: undefined,
    status: 'idle',
  },
  asset: undefined,
  depositAddress: {
    data: undefined,
    status: 'idle',
  },
  fiat: undefined,
  method: undefined,
  network: undefined,
  prebuiltTx: {
    data: undefined,
    error: undefined,
    status: 'idle',
  },
  provider: {
    data: undefined,
    error: undefined,
    status: 'idle',
  },
  providerChainId: undefined,
  slug: undefined,
  step: Steps.AssetSelection,
  steps: [
    'AssetSelection',
    'NetworkSelection',
    'PaymentMethod',
    'EnterAmount',
    'Result',
  ],
  theme: undefined,
};

export const Store: React.FC<
  PropsWithChildren<{
    asset?: AssetWithPrice;
    authorizeTransaction?: (
      fromAddress: string,
      network: string,
      amount: string
    ) => Promise<Boolean>;
    colors?: {
      progressBar?: string;
      scrollBar?: string;
    };
    fiat?: string;
    generateDepositAddress: (
      asset?: string,
      network?: string
    ) => Promise<{ address: string; memo?: string }>;
    network?: Network;
    onFailure?: (error: string, networkCode: string, address?: string) => void;
    onSuccess?: (txHash: string, networkCode: string, address?: string) => void;
    theme?: 'dark' | 'light';
  }>
> = ({
  asset,
  authorizeTransaction,
  children,
  colors,
  fiat,
  generateDepositAddress,
  network,
  onFailure,
  onSuccess,
  theme,
}) => {
  let step = 0;

  if (asset) {
    step = Steps.NetworkSelection;
  }

  if (asset && network) {
    step = Steps.PaymentMethod;
  }

  const [state, dispatch] = useReducer(
    (state: State, action: Action): State => {
      switch (action.type) {
        case 'SET_ASSET':
          return { ...state, asset: action.payload };
        case 'SET_NETWORK':
          return { ...state, network: action.payload };
        case 'SET_STEP':
          return {
            ...state,
            step: state.steps.indexOf(
              Steps[action.payload] as keyof typeof Steps
            ),
          };
        case 'SET_STEPS': {
          return { ...state, steps: action.payload };
        }
        case 'SET_PAYMENT_METHOD':
          return { ...state, method: action.payload };
        case 'GENERATE_DEPOSIT_ADDRESS_SUCCESS':
          return {
            ...state,
            depositAddress: {
              data: action.payload,
              status: 'success',
            },
          };
        case 'GENERATE_DEPOSIT_ADDRESS_ERROR':
          return {
            ...state,
            depositAddress: {
              data: undefined,
              status: 'error',
            },
          };
        case 'GENERATE_DEPOSIT_ADDRESS_LOADING':
          return {
            ...state,
            depositAddress: {
              data: undefined,
              status: 'loading',
            },
          };
        case 'GENERATE_DEPOSIT_ADDRESS_IDLE':
          return {
            ...state,
            depositAddress: {
              data: undefined,
              status: 'idle',
            },
          };
        case 'SET_ACCOUNT_SUCCESS':
          return {
            ...state,
            account: {
              data: action.payload,
              status: 'success',
            },
          };
        case 'SET_ACCOUNT_ERROR':
          return {
            ...state,
            account: {
              data: action.payload,
              status: 'error',
            },
          };
        case 'SET_ACCOUNT_LOADING':
          return {
            ...state,
            account: {
              data: undefined,
              status: 'loading',
            },
          };
        case 'SET_ACCOUNT_IDLE':
          return {
            ...state,
            account: {
              data: undefined,
              status: 'idle',
            },
          };
        case 'SET_PREBUILT_TX_SUCCESS':
          return {
            ...state,
            prebuiltTx: {
              data: action.payload,
              error: undefined,
              status: 'success',
            },
          };
        case 'SET_PREBUILT_TX_ERROR':
          return {
            ...state,
            prebuiltTx: {
              data: undefined,
              error: action.payload,
              status: 'error',
            },
          };
        case 'SET_PREBUILT_TX_LOADING':
          return {
            ...state,
            prebuiltTx: {
              data: undefined,
              error: undefined,
              status: 'loading',
            },
          };
        case 'SET_PREBUILT_TX_IDLE':
          return {
            ...state,
            prebuiltTx: {
              data: undefined,
              error: undefined,
              status: 'idle',
            },
          };
        case 'SET_PROVIDER_SUCCESS':
          return {
            ...state,
            provider: {
              data: action.payload,
              error: undefined,
              status: 'success',
            },
          };
        case 'SET_PROVIDER_ERROR':
          return {
            ...state,
            provider: {
              data: undefined,
              error: action.payload,
              status: 'error',
            },
          };
        case 'SET_PROVIDER_LOADING':
          return {
            ...state,
            provider: {
              data: undefined,
              error: undefined,
              status: 'loading',
            },
          };
        case 'SET_PROVIDER_IDLE':
          return {
            ...state,
            provider: {
              data: undefined,
              error: undefined,
              status: 'idle',
            },
          };
        case 'SET_PROVIDER_CHAIN_ID':
          return {
            ...state,
            providerChainId: action.payload,
          };
        case 'SET_TRANSACTION_SUCCESS':
          return {
            ...state,
            transaction: {
              error: undefined,
              hash: action.payload,
              status: 'success',
            },
          };
        case 'SET_TRANSACTION_ERROR':
          return {
            ...state,
            transaction: {
              error: action.payload,
              hash: undefined,
              status: 'error',
            },
          };
        case 'SET_TRANSACTION_LOADING':
          return {
            ...state,
            transaction: {
              error: undefined,
              hash: undefined,
              status: 'loading',
            },
          };
        case 'RESET_STATE': {
          return { ...initialState, asset, fiat, network, step, theme };
        }
        /* istanbul ignore next */
        default:
          /* istanbul ignore next */
          return state;
      }
    },
    { ...initialState, asset, colors, fiat, network, step, theme }
  );

  return (
    <Context.Provider
      value={[
        state,
        dispatch,
        { authorizeTransaction, generateDepositAddress, onFailure, onSuccess },
      ]}
    >
      {children}
    </Context.Provider>
  );
};

export const Context = createContext<
  [
    State,
    React.Dispatch<Action>,
    {
      authorizeTransaction?: (
        fromAddress: string,
        network: string,
        amount: string
      ) => Promise<Boolean>;
      generateDepositAddress: (
        asset?: string,
        network?: string
      ) => Promise<{ address: string }>;
      onFailure?: (
        error: string,
        networkCode: string,
        address?: string
      ) => void;
      onSuccess?: (
        txHash: string,
        networkCode: string,
        address?: string
      ) => void;
    }
  ]
>([
  initialState,
  () => null,
  {
    authorizeTransaction: /* istanbul ignore next */ () =>
      new Promise((resolve) => resolve(true)),
    generateDepositAddress: /* istanbul ignore next */ () =>
      new Promise((resolve) => resolve({ address: '' })),
    onFailure: /* istanbul ignore next */ () => {},
    onSuccess: /* istanbul ignore next */ () => {},
  },
]);
