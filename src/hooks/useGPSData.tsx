import { useState, useEffect } from 'react';
import { ref, onValue, push, set } from 'firebase/database';
import { database } from '@/config/firebase';
import { useAuth } from './useFirebaseAuth';

export interface GPSData {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  speed: number;
  batteryPercentage: number;
  timestamp: string;
  status: 'online' | 'offline';
}

export interface Device {
  id: string;
  name: string;
  imei: string;
  owner: string;
  lastSeen: string;
  batteryPercentage: number;
  tamperStatus: boolean;
  jammingStatus: boolean;
  status: 'online' | 'offline' | 'maintenance';
  latitude?: number;
  longitude?: number;
  speed?: number;
}

export function useGPSData() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [gpsData, setGpsData] = useState<GPSData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const devicesRef = ref(database, `users/${user.uid}/devices`);
    const gpsRef = ref(database, `users/${user.uid}/gpsData`);

    const unsubscribeDevices = onValue(devicesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const devicesList = Object.entries(data).map(([id, device]: [string, any]) => ({
          id,
          ...device,
        }));
        setDevices(devicesList);
      } else {
        setDevices([]);
      }
      setLoading(false);
    });

    const unsubscribeGPS = onValue(gpsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const gpsList = Object.entries(data).map(([id, gps]: [string, any]) => ({
          id,
          ...gps,
        }));
        setGpsData(gpsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        setGpsData([]);
      }
    });

    return () => {
      unsubscribeDevices();
      unsubscribeGPS();
    };
  }, [user]);

  const addDevice = async (device: Omit<Device, 'id'>) => {
    if (!user) return;
    
    const devicesRef = ref(database, `users/${user.uid}/devices`);
    const newDeviceRef = push(devicesRef);
    await set(newDeviceRef, device);
  };

  const updateGPSData = async (data: Omit<GPSData, 'id'>) => {
    if (!user) return;
    
    const gpsRef = ref(database, `users/${user.uid}/gpsData`);
    const newGPSRef = push(gpsRef);
    await set(newGPSRef, data);

    // Update device with latest GPS data
    const deviceRef = ref(database, `users/${user.uid}/devices/${data.deviceId}`);
    await set(deviceRef, {
      latitude: data.latitude,
      longitude: data.longitude,
      speed: data.speed,
      batteryPercentage: data.batteryPercentage,
      lastSeen: data.timestamp,
      status: data.status,
    });
  };

  return {
    devices,
    gpsData,
    loading,
    addDevice,
    updateGPSData,
  };
}