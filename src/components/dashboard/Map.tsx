import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Layers } from 'lucide-react';

interface Device {
  id: string;
  imei: string;
  name: string;
  owner_id: string;
  last_seen: string;
  battery_percentage: number;
  tamper_status: boolean;
  jamming_status: boolean;
  status: 'online' | 'offline' | 'maintenance';
  latitude?: number;
  longitude?: number;
  speed?: number;
}

interface MapProps {
  devices: Device[];
  selectedDevice?: Device | null;
  onDeviceSelect?: (device: Device) => void;
}

export default function Map({ devices, selectedDevice, onDeviceSelect }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const markers = useRef<{ [key: string]: mapboxgl.Marker }>({});

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-74.006, 40.7128],
      zoom: 12,
      projection: 'globe' as any,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(255, 255, 255)',
        'high-color': 'rgb(200, 200, 225)',
        'horizon-blend': 0.2,
      });
    });

    setShowTokenInput(false);
  };

  const createDeviceMarker = (device: Device) => {
    const el = document.createElement('div');
    el.className = 'device-marker';
    el.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: ${getStatusColor(device)};
      border: 3px solid white;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    `;

    if (device.status === 'online') {
      el.style.animation = 'pulse-glow 2s ease-in-out infinite';
    }

    el.innerHTML = `<div style="color: white; font-size: 12px; font-weight: bold;">${Math.round(device.battery_percentage)}%</div>`;

    const marker = new mapboxgl.Marker(el)
      .setLngLat([device.longitude, device.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="p-3 min-w-[200px]">
            <h3 class="font-bold text-lg mb-2">${device.name}</h3>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between">
                <span>Status:</span>
                <span class="font-semibold" style="color: ${getStatusColor(device)}">${device.status}</span>
              </div>
              <div class="flex justify-between">
                <span>Battery:</span>
                <span class="font-semibold">${device.battery_percentage}%</span>
              </div>
              <div class="flex justify-between">
                <span>Speed:</span>
                <span class="font-semibold">${device.speed} mph</span>
              </div>
              ${device.tamper_status ? '<div class="text-red-600 font-bold">⚠️ Tamper Alert</div>' : ''}
              ${device.jamming_status ? '<div class="text-orange-600 font-bold">📡 Jamming Detected</div>' : ''}
            </div>
          </div>
        `)
      );

    el.onclick = () => onDeviceSelect?.(device);

    return marker;
  };

  const getStatusColor = (device: Device) => {
    if (device.tamper_status || device.jamming_status) return '#ef4444'; // red
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
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add new markers
    devices.forEach(device => {
      const marker = createDeviceMarker(device);
      marker.addTo(map.current!);
      markers.current[device.id] = marker;
    });

    // Fit map to show all devices
    if (devices.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      devices.forEach(device => {
        bounds.extend([device.longitude, device.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [devices, onDeviceSelect]);

  useEffect(() => {
    if (selectedDevice && map.current) {
      map.current.flyTo({
        center: [selectedDevice.longitude, selectedDevice.latitude],
        zoom: 15,
        duration: 1000,
      });
    }
  }, [selectedDevice]);

  if (showTokenInput) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="max-w-md w-full space-y-4">
          <div className="text-center space-y-2">
            <MapPin className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-lg font-semibold">Setup Map Integration</h3>
            <p className="text-sm text-muted-foreground">
              Enter your Mapbox public token to enable real-time tracking
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="password"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Get your token from{' '}
              <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                mapbox.com
              </a>
            </p>
          </div>
          <Button onClick={initializeMap} disabled={!mapboxToken} className="w-full">
            Initialize Map
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 flex space-x-2">
        <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
          <Layers className="w-4 h-4 mr-2" />
          Satellite
        </Button>
        <Button size="sm" variant="secondary" className="bg-white/90 backdrop-blur-sm">
          <Navigation className="w-4 h-4 mr-2" />
          Traffic
        </Button>
      </div>
    </div>
  );
}