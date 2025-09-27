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

    const gpsRef = ref(database, 'gpsData');

    const unsubscribeGPS = onValue(gpsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const devicesList: Device[] = [];
        const gpsList: GPSData[] = [];

        // Process each device in gpsData
        Object.entries(data).forEach(([deviceId, deviceData]: [string, any]) => {
          const device: Device = {
            id: deviceId,
            name: `Device ${deviceId.replace('_', ' ').toUpperCase()}`,
            imei: deviceId,
            owner: user.uid,
            lastSeen: new Date().toISOString(),
            batteryPercentage: deviceData.batteryLevel || 0,
            tamperStatus: false,
            jammingStatus: false,
            status: 'online' as const,
            latitude: deviceData.latitude,
            longitude: deviceData.longitude,
            speed: 0, // Add speed if available in your data
          };

          const gpsEntry: GPSData = {
            id: `${deviceId}_${Date.now()}`,
            deviceId: deviceId,
            latitude: deviceData.latitude,
            longitude: deviceData.longitude,
            speed: 0,
            batteryPercentage: deviceData.batteryLevel || 0,
            timestamp: new Date().toISOString(),
            status: 'online' as const,
          };

          devicesList.push(device);
          gpsList.push(gpsEntry);
        });

        setDevices(devicesList);
        setGpsData(gpsList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } else {
        setDevices([]);
        setGpsData([]);
      }
      setLoading(false);
    });

    return () => {
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