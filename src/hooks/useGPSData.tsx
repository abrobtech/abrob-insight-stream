import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// If you already have a Supabase client exported, import it here.
// Adjust the import path if your client is at a different path.
import { createClient } from '@supabase/supabase-js';
// If you have a generated client you prefer, replace the lines below with:
// import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// NOTE: For production writes you must use a secure server-side key. This client is for read-only queries in the browser.
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Device = {
  id: string;
  name: string;
  imei: string;
  owner_id?: string;
  latitude?: number | null;
  longitude?: number | null;
  batteryPercentage?: number;
  speed?: number;
  status?: string;
  tamperStatus?: boolean;
  jammingStatus?: boolean;
  lastSeen?: string;
  // ... any other fields your DB has
};

export type Location = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number | null;
  // ...
};

const FETCH_OPTIONS = {
  // Poll every 2 minutes (120000ms)
  refetchInterval: 120_000,
  // When the window regains focus refetch
  refetchOnWindowFocus: true,
  // Consider data fresh for 60 seconds (adjust as needed)
  staleTime: 60_000,
};

export function useGPSData() {
  const queryClient = useQueryClient();

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('devices')
        .select('*');
      if (error) throw error;
      return (data ?? []) as Device[];
    },
    ...FETCH_OPTIONS,
  });

  const locationsQuery = useQuery({
    queryKey: ['locations', { limit: 200 }],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Location[];
    },
    ...FETCH_OPTIONS,
  });

  const refetch = useCallback(async () => {
    await Promise.all([devicesQuery.refetch(), locationsQuery.refetch()]);
  }, [devicesQuery, locationsQuery]);

  // Optional helper to subscribe to real-time changes (Supabase Realtime)
  // Uncomment and use if you want push updates in addition to polling.
  /*
  useEffect(() => {
    const deviceSub = supabase
      .from('devices')
      .on('*', payload => {
        queryClient.invalidateQueries(['devices']);
      })
      .subscribe();

    const locSub = supabase
      .from('locations')
      .on('*', payload => {
        queryClient.invalidateQueries(['locations']);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(deviceSub);
      supabase.removeSubscription(locSub);
    };
  }, [queryClient]);
  */

  return {
    devices: devicesQuery.data ?? [],
    locations: locationsQuery.data ?? [],
    loading: devicesQuery.isLoading || locationsQuery.isLoading,
    error: devicesQuery.error || locationsQuery.error,
    refetch,
    // pass other query meta if you need
    devicesQuery,
    locationsQuery,
  };
}
