import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface Garden {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  available_plots: number;
  base_price_per_month: number;
}

interface GardenMapProps {
  gardens: Garden[];
  onGardenClick?: (gardenId: string) => void;
}

const GardenMap = ({ gardens, onGardenClick }: GardenMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    // Center on Debrecen
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [21.6273, 47.5316], // Debrecen coordinates
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add markers for each garden
    gardens.forEach((garden) => {
      if (!map.current) return;

      const el = document.createElement('div');
      el.className = 'cursor-pointer';
      el.innerHTML = `
        <div class="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `;

      el.addEventListener('click', () => {
        if (onGardenClick) {
          onGardenClick(garden.id);
        }
      });

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold mb-1">${garden.name}</h3>
          <p class="text-sm text-muted-foreground mb-1">${garden.address}</p>
          <p class="text-sm"><strong>€${garden.base_price_per_month}/mo</strong></p>
          <p class="text-sm">${garden.available_plots} plots available</p>
        </div>
      `);

      new mapboxgl.Marker(el)
        .setLngLat([garden.longitude, garden.latitude])
        .setPopup(popup)
        .addTo(map.current);
    });
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapboxToken.trim()) {
      toast.error('Please enter a Mapbox token');
      return;
    }
    setIsTokenSet(true);
    initializeMap(mapboxToken);
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (isTokenSet && gardens.length > 0) {
      // Re-initialize map when gardens change
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      initializeMap(mapboxToken);
    }
  }, [gardens, isTokenSet]);

  if (!isTokenSet) {
    return (
      <div className="bg-muted/50 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold mb-4">Map View</h3>
        <p className="text-sm text-muted-foreground mb-4">
          To view gardens on a map, please enter your Mapbox public token.
          <br />
          Get one at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">mapbox.com</a>
        </p>
        <form onSubmit={handleTokenSubmit} className="max-w-md mx-auto space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Mapbox Public Token</Label>
            <Input
              id="mapbox-token"
              type="text"
              placeholder="pk.eyJ1..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Show Map
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default GardenMap;
