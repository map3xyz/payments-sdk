import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || '',
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

interface WatchChannelCallbackFn {
  (payload: any): void;
}

export function listenToWatchedAddress(
  watchedAddressId: string,
  callback: WatchChannelCallbackFn
): RealtimeChannel {
  return supabase
    .channel('watched_address_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        filter: `id=eq.${watchedAddressId}`,
        schema: 'public',
        table: 'watched_address',
      },
      callback
    )
    .subscribe();
}
