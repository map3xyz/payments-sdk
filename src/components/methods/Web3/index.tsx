import { Button } from '@map3xyz/components';
import { ethers } from 'ethers';
import React, { useContext, useEffect } from 'react';

import { Context } from '../../../providers/Store';
import MethodIcon from '../../MethodIcon';

const Web3: React.FC<Props> = ({ amount, disabled, setFormError }) => {
  const [state, dispatch] = useContext(Context);

  if (!state.method || !state.method.value) return null;

  const connect = async () => {
    const providers = window.ethereum?.providers;
    const selectedProvider = providers?.find(
      (x: any) => x[state.method!.value!]
    );

    if (
      (!window.ethereum || !window.ethereum[state.method!.value!]) &&
      !selectedProvider
    ) {
      dispatch({ payload: 'No provider found.', type: 'SET_ACCOUNT_ERROR' });
      setFormError(`Please download the ${state.method!.name} extension.`);

      return;
    }

    const eth = new ethers.providers.Web3Provider(
      selectedProvider || window.ethereum
    );

    if (eth.provider) {
      // @ts-ignore
      eth.provider.on('accountsChanged', async (accounts: string[]) => {
        if (accounts && accounts[0]) {
          dispatch({ payload: accounts[0], type: 'SET_ACCOUNT_SUCCESS' });
        } else {
          dispatch({ type: 'SET_ACCOUNT_IDLE' });
        }
      });

      dispatch({ type: 'SET_ACCOUNT_LOADING' });
      const accounts = await eth.send('eth_accounts', []);

      if (accounts && accounts[0]) {
        dispatch({ payload: accounts[0], type: 'SET_ACCOUNT_SUCCESS' });
      } else {
        try {
          const requestedAccounts = await eth.send('eth_requestAccounts', []);
          if (requestedAccounts && requestedAccounts[0]) {
            dispatch({
              payload: requestedAccounts[0],
              type: 'SET_ACCOUNT_SUCCESS',
            });
          }
        } catch (e: any) {
          if (
            e.message === 'User rejected the request.' ||
            e.message === 'User denied account authorization'
          ) {
            dispatch({ payload: e.message, type: 'SET_ACCOUNT_ERROR' });
            setFormError(e.message);
          } else {
            console.log(e);
          }
        }
      }
    }
  };

  useEffect(() => {
    connect();

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'web3_connect') {
        connect();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  let cta = 'Confirm Payment';

  switch (state.account.status) {
    case 'loading':
      cta = 'Connecting...';
      break;
    case 'error':
    case 'idle':
      cta = 'Connect Wallet';
      break;
  }

  return (
    <Button
      block
      disabled={
        disabled ||
        (state.account.status === 'error' &&
          state.account.data === 'No provider found.') ||
        (state.account.status === 'success' && Number(amount) === 0) ||
        state.account.status === 'loading'
      }
      htmlType="submit"
      loading={
        state.account.status === 'loading' ||
        state.depositAddress.status === 'loading'
      }
      size="medium"
      type={'default'}
    >
      <span className="flex items-center gap-2">
        <MethodIcon method={state.method} />
        {cta}
      </span>
    </Button>
  );
};

type Props = {
  amount: number;
  disabled: boolean;
  setFormError: React.Dispatch<React.SetStateAction<string | undefined>>;
};

export default Web3;
