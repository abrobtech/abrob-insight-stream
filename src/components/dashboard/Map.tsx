import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Layers } from 'lucide-react';
import { Device } from '@/hooks/useGPSData';

interface MapProps {
  devices: Device[];
  selectedDevice?: Device | null;
  onDeviceSelect?: (device: Device) => void;
}

export default function Map({ devices, selectedDevice, onDeviceSelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [googleMapsKey, setGoogleMapsKey] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const markers = useRef<{ [key: string]: google.maps.Marker }>({});

  const initializeMap = async () => {
    if (!mapContainer.current || !googleMapsKey) return;

    try {
      const loader = new Loader({
        apiKey: googleMapsKey,
        version: 'weekly',
      });

      await loader.load();

      map.current = new google.maps.Map(mapContainer.current, {
        center: { lat: 40.7128, lng: -74.0060 },
        zoom: 12,
      });

      setShowTokenInput(false);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const createDeviceMarker = (device: Device) => {
    if (!map.current || !device.latitude || !device.longitude) return null;

    const marker = new google.maps.Marker({
      position: { lat: device.latitude, lng: device.longitude },
      map: map.current,
      title: device.name,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px;">
          <h3 style="margin: 0 0 10px 0;">${device.name}</h3>
          <p><strong>Status:</strong> <span style="color: ${getStatusColor(device)}">${device.status}</span></p>
          <p><strong>Battery:</strong> ${device.batteryPercentage}%</p>
          <p><strong>Speed:</strong> ${device.speed || 0} mph</p>
          ${device.tamperStatus ? '<p style="color: red;"><strong>⚠️ Tamper Alert</strong></p>' : ''}
          ${device.jammingStatus ? '<p style="color: orange;"><strong>📡 Jamming Detected</strong></p>' : ''}
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(map.current, marker);
      onDeviceSelect?.(device);
    });

    return marker;
  };

  const getStatusColor = (device: Device) => {
    if (device.tamperStatus || device.jammingStatus) return '#ef4444'; // red
    switch (device.status) {
      case 'online': return '#10b981'; // green
      case 'offline': return '#6b7280'; // gray
      case 'maintenance': return '#f59e0b'; // yellow
      default: return '#6b7280';
    }
  };

  useEffect(() => {
    if (!map.current || !devices.length) return;

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.setMap(null));
    markers.current = {};

    // Add new markers
    devices.forEach(device => {
      if (device.latitude && device.longitude) {
        const marker = createDeviceMarker(device);
        if (marker) {
          markers.current[device.id] = marker;
        }
      }
    });
  }, [devices, onDeviceSelect]);

  useEffect(() => {
    if (selectedDevice && map.current && selectedDevice.latitude && selectedDevice.longitude) {
      map.current.setCenter({ lat: selectedDevice.latitude, lng: selectedDevice.longitude });
      map.current.setZoom(15);
    }
  }, [selectedDevice]);

  if (showTokenInput) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Setup Google Maps</h3>
            <p className="text-sm text-muted-foreground">
              Enter your Google Maps API key to enable real-time tracking
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="google-maps-key">Google Maps API Key</Label>
            <Input
              id="google-maps-key"
              type="password"
              placeholder="AIza..."
              value={googleMapsKey}
              onChange={(e) => setGoogleMapsKey(e.target.value)}
            />
          </div>
          <Button onClick={initializeMap} disabled={!googleMapsKey} className="w-full">
            Initialize Map
          </Button>
        </div>
      </Card>
    );
  }

  return <div ref={mapContainer} className="w-full h-full" />;
}