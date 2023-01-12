import { Badge, ReadOnlyText } from '@map3xyz/components';
import { QRCodeSVG } from 'qrcode.react';
import React, { useContext, useEffect } from 'react';

import InnerWrapper from '../../components/InnerWrapper';
import MethodIcon from '../../components/MethodIcon';
import { useAddWatchedAddressMutation } from '../../generated/apollo-gql';
import { useDepositAddress } from '../../hooks/useDepositAddress';
import { useModalSize } from '../../hooks/useModalSize';
import { Context, Steps } from '../../providers/Store';
import { listenToWatchedAddress } from '../../utils/supabase';

const QRCode: React.FC<Props> = () => {
  const [state, dispatch] = useContext(Context);
  const { getDepositAddress } = useDepositAddress();

  const { width } = useModalSize();

  const [addWatchedAddress] = useAddWatchedAddressMutation();

  if (!state.asset || !state.network || !state.method) {
    dispatch({ payload: Steps.AssetSelection, type: 'SET_STEP' });
    return null;
  }

  useEffect(() => {
    const run = async () => {
      try {
        const { address } = await getDepositAddress();

        const { data } = await addWatchedAddress({
          variables: {
            address,
            assetId: state.asset!.id!,
            confirmationsToWatch: 3,
          },
        });

        if (!data?.addWatchedAddress) {
          throw new Error('Unable to watch address.');
        }

        console.log(data.addWatchedAddress);

        listenToWatchedAddress(data.addWatchedAddress, (payload: any) => {
          console.log(payload);
        });
      } catch (e) {
        console.error(e);
      }
    };
    run();

    return () => dispatch({ type: 'GENERATE_DEPOSIT_ADDRESS_IDLE' });
  }, []);

  useEffect(() => {
    if (
      state.depositAddress.status === 'success' &&
      state.depositAddress.data
    ) {
      listenToWatchedAddress(
        state.depositAddress.data.address,
        (payload: any) => console.log(payload)
      );
    }
  }, []);

  return (
    <div className="flex h-full flex-col">
      <InnerWrapper className="!pt-0">
        <h3
          className="text-lg font-semibold dark:text-white"
          data-testid="qrcode-method"
        >
          Scan QR Code
        </h3>
      </InnerWrapper>
      <div className="w-full border-y border-neutral-200 bg-neutral-100 px-4 py-3 font-bold leading-6 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white">
        Send{' '}
        <Badge color="blue" size="large">
          {state.asset?.name || ''}
        </Badge>{' '}
        on the {/* @ts-ignore */}
        <Badge color="blue" size="large">
          {state.network?.symbol || ''} Network
        </Badge>{' '}
        via {/* @ts-ignore */}
        <Badge color="blue" size="large">
          {/* @ts-ignore */}
          <span className="flex items-center gap-1">
            <MethodIcon method={state.method} /> {state.method.name}
          </span>
        </Badge>
      </div>
      <InnerWrapper className="h-full">
        {state.depositAddress.status === 'loading' && (
          <div className="flex h-64 items-center justify-center text-sm">
            <div className="flex flex-col items-center gap-2 font-semibold text-neutral-500">
              <div className="animate-spin ">
                <i className="fa fa-gear"></i>
              </div>
              <span>Generating Address...</span>
            </div>
          </div>
        )}
        {state.depositAddress.status === 'error' && (
          <div className="flex h-64 items-center justify-center text-sm">
            <div className="flex flex-col items-center gap-2 font-semibold">
              <div className="animate-spin font-semibold text-red-600">
                <i className="fa fa-circle-xmark"></i>
              </div>
              <span className="text-red-600">
                Error generating deposit address.
              </span>
            </div>
          </div>
        )}
        {state.depositAddress.status === 'success' &&
          state.depositAddress.data && (
            <div className="flex h-full w-full flex-col items-center justify-between gap-2 text-sm">
              <div className="text-xs text-neutral-400">
                Only send {state.asset.name} on the {state.network?.symbol}{' '}
                Network to this address.
              </div>
              <div className="flex w-full justify-center">
                <QRCodeSVG
                  bgColor={state.theme === 'dark' ? '#262626' : '#FFFFFF'}
                  className="rounded-lg"
                  fgColor={state.theme === 'dark' ? '#FFFFFF' : '#000000'}
                  imageSettings={{
                    excavate: false,
                    height: 40,
                    src: state.asset.logo?.svg || state.asset.logo?.png || '',
                    width: 40,
                  }}
                  includeMargin={true}
                  size={width ? width - 160 : 0}
                  style={{
                    border:
                      state.theme === 'dark'
                        ? '1px solid #404040'
                        : '1px solid #e5e5e5',
                  }}
                  value={state.depositAddress.data.address}
                />
              </div>
              <div className="w-full">
                <label className="text-xs text-neutral-500 dark:text-white">
                  Deposit Address
                </label>
                <ReadOnlyText
                  copyButton
                  value={state.depositAddress.data.address}
                />
              </div>
            </div>
          )}
      </InnerWrapper>
    </div>
  );
};

type Props = {};

export default QRCode;
