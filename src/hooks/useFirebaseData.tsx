import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/config/firebase';
import { useAuth } from './useFirebaseAuth';

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
};

export type Location = {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number | null;
};

export type Geofence = {
  id: string;
  name: string;
  enabled: boolean;
  type: string;
  lat: number;
  lon: number;
  radius: number;
  device_id?: string;
};

export function useFirebaseData() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setDevices([]);
      setLocations([]);
      setGeofences([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Listen to geofences data
    const geofencesRef = ref(database, 'geofences');
    
    const unsubscribeGeofences = onValue(
      geofencesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const geofencesList: Geofence[] = [];
          
          // Iterate through device IDs
          Object.keys(data).forEach((deviceId) => {
            const deviceGeofences = data[deviceId];
            
            // Iterate through geofences for each device
            Object.keys(deviceGeofences).forEach((geofenceId) => {
              const geofence = deviceGeofences[geofenceId];
              geofencesList.push({
                id: geofenceId,
                device_id: deviceId,
                name: geofence.name || 'Unnamed',
                enabled: geofence.enabled || false,
                type: geofence.type || 'circle',
                lat: geofence.lat || 0,
                lon: geofence.lon || 0,
                radius: geofence.radius || 1,
              });
            });
          });
          
          setGeofences(geofencesList);
        } else {
          setGeofences([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching geofences:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    // Listen to devices data
    const devicesRef = ref(database, 'devices');
    
    const unsubscribeDevices = onValue(
      devicesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const devicesList: Device[] = [];
          
          Object.keys(data).forEach((deviceId) => {
            const device = data[deviceId];
            devicesList.push({
              id: deviceId,
              name: device.name || device.imei || deviceId,
              imei: device.imei || deviceId,
              owner_id: user.uid,
              latitude: device.latitude || device.lat || null,
              longitude: device.longitude || device.lon || null,
              batteryPercentage: device.battery || device.batteryPercentage || 100,
              speed: device.speed || 0,
              status: device.status || device.online ? 'online' : 'offline',
              tamperStatus: device.tamper || device.tamperStatus || false,
              jammingStatus: device.jamming || device.jammingStatus || false,
              lastSeen: device.lastSeen || device.timestamp || new Date().toISOString(),
            });
          });
          
          setDevices(devicesList);
        } else {
          setDevices([]);
        }
      },
      (err) => {
        console.error('Error fetching devices:', err);
        setError(err as Error);
      }
    );

    // Listen to locations data
    const locationsRef = ref(database, 'locations');
    
    const unsubscribeLocations = onValue(
      locationsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const locationsList: Location[] = [];
          
          Object.keys(data).forEach((deviceId) => {
            const deviceLocations = data[deviceId];
            
            if (Array.isArray(deviceLocations)) {
              deviceLocations.forEach((loc, index) => {
                if (loc && loc.lat !== undefined && loc.lon !== undefined) {
                  locationsList.push({
                    id: `${deviceId}-${index}`,
                    device_id: deviceId,
                    latitude: loc.lat || loc.latitude,
                    longitude: loc.lon || loc.longitude,
                    timestamp: loc.timestamp || new Date().toISOString(),
                    speed: loc.speed || 0,
                  });
                }
              });
            } else if (typeof deviceLocations === 'object') {
              Object.keys(deviceLocations).forEach((locId) => {
                const loc = deviceLocations[locId];
                if (loc && loc.lat !== undefined && loc.lon !== undefined) {
                  locationsList.push({
                    id: locId,
                    device_id: deviceId,
                    latitude: loc.lat || loc.latitude,
                    longitude: loc.lon || loc.longitude,
                    timestamp: loc.timestamp || new Date().toISOString(),
                    speed: loc.speed || 0,
                  });
                }
              });
            }
          });
          
          // Sort by timestamp descending
          locationsList.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          
          setLocations(locationsList);
        } else {
          setLocations([]);
        }
      },
      (err) => {
        console.error('Error fetching locations:', err);
        setError(err as Error);
      }
    );

    // Cleanup subscriptions
    return () => {
      off(geofencesRef);
      off(devicesRef);
      off(locationsRef);
      unsubscribeGeofences();
      unsubscribeDevices();
      unsubscribeLocations();
    };
  }, [user]);

  const refetch = async () => {
    // Firebase real-time listeners will automatically update
    // This is here for API compatibility with the old hook
    return Promise.resolve();
  };

  return {
    devices,
    locations,
    geofences,
    loading,
    error,
    refetch,
  };
}
