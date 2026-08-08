import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export interface LocationData {
  lat: number;
  lng: number;
  country: string;
  state: string;
  district: string;
  taluk: string;
  city: string;
  villageArea: string;
  pinCode: string;
  fullAddress: string;
}

interface LocationPinMapProps {
  initialLat?: number;
  initialLng?: number;
  onLocationSelect: (data: LocationData) => void;
  className?: string;
}

// Custom Leaflet SVG DivIcon for accurate pin rendering
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        width: 38px;
        height: 38px;
        display: flex;
        items-center: center;
        justify-content: center;
        background: #4f46e5;
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4), 0 4px 6px -4px rgba(0,0,0,0.2);
        cursor: pointer;
      ">
        <div style="
          width: 12px;
          height: 12px;
          background: #ffffff;
          border-radius: 50%;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
  });
};

export const LocationPinMap: React.FC<LocationPinMapProps> = ({
  initialLat = 20.5937, // Default India center or global
  initialLng = 78.9629,
  onLocationSelect,
  className = '',
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [recognizedAddress, setRecognizedAddress] = useState<LocationData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double init

    const map = L.map(mapContainerRef.current, {
      center: [coords.lat, coords.lng],
      zoom: 5,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const icon = createPinIcon();
    const marker = L.marker([coords.lat, coords.lng], {
      draggable: true,
      icon,
    }).addTo(map);

    markerRef.current = marker;
    mapInstanceRef.current = map;

    // Handle Marker Drag End
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      handleLocationChange(position.lat, position.lng);
    });

    // Handle Map Click
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      handleLocationChange(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size after render
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    setSearchError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch address details');
      const data = await response.json();
      const addr = data.address || {};

      const country = addr.country || '';
      const state = addr.state || addr.region || addr.state_district || '';
      const district = addr.state_district || addr.county || addr.district || addr.city_district || addr.city || '';
      const taluk = addr.suburb || addr.county || addr.taluk || addr.tehsil || addr.municipality || '';
      const city = addr.city || addr.town || addr.municipality || addr.village || addr.suburb || '';
      const villageArea = addr.village || addr.suburb || addr.neighbourhood || addr.residential || addr.hamlet || addr.town || '';
      const pinCode = addr.postcode || '';
      const fullAddress = data.display_name || `${villageArea}, ${city}, ${state}, ${country}`;

      const locData: LocationData = {
        lat,
        lng,
        country,
        state,
        district,
        taluk,
        city,
        villageArea,
        pinCode,
        fullAddress,
      };

      setRecognizedAddress(locData);
      onLocationSelect(locData);
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setSearchError('Could not auto-fetch address for this pin. You can fill details manually.');
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setCoords({ lat, lng });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([lat, lng]);
    }
    reverseGeocode(lat, lng);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsReverseGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 15);
        }
        handleLocationChange(latitude, longitude);
      },
      (err) => {
        console.error(err);
        setIsReverseGeocoding(false);
        alert('Unable to retrieve your location. Please allow location permissions or click directly on the map.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 14);
        }
        handleLocationChange(lat, lng);
      } else {
        setSearchError(`No map result found for "${searchQuery}". Please try another place or click directly on map.`);
      }
    } catch (err) {
      console.error(err);
      setSearchError('Search failed. Please check connection.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Top Map Controls Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 text-white p-3.5 rounded-2xl">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/80 text-white shadow-sm">
            <MapPin className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold flex items-center gap-1.5">
              Interactive Map Pin Point
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-400/30">
                GPS Recognized
              </span>
            </h4>
            <p className="text-xs text-slate-300">
              Click anywhere on the map or drag the pin to auto-fill address details.
            </p>
          </div>
        </div>

        {/* Detect GPS Button */}
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={isReverseGeocoding}
          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition shrink-0 active:scale-95"
        >
          {isReverseGeocoding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          Detect Current GPS Location
        </button>
      </div>

      {/* Search Input Bar above Map */}
      <form onSubmit={handleSearchLocation} className="relative flex items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search place, town, landmark, or PIN code on map..."
          className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs outline-none focus:border-indigo-500 transition shadow-sm"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
        <button
          type="submit"
          disabled={isSearching}
          className="absolute right-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 transition"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Find on Map'}
        </button>
      </form>

      {searchError && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {searchError}
        </div>
      )}

      {/* Map Canvas Container */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-inner h-64 sm:h-72 w-full z-0">
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Live Loading Overlay */}
        {isReverseGeocoding && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[1000]">
            <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-200 dark:border-slate-800">
              <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Recognizing pinned coordinates...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Recognition Results Badge */}
      {recognizedAddress ? (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-200 flex flex-col gap-2">
          <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Pin Point Recognized Successfully!
            </span>
            <span className="font-mono text-[11px] bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
              📍 {coords.lat.toFixed(5)}°, {coords.lng.toFixed(5)}°
            </span>
          </div>
          <p className="line-clamp-2 text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
            {recognizedAddress.fullAddress}
          </p>
          <div className="flex flex-wrap gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-slate-600 dark:text-slate-400">
            {recognizedAddress.country && <span><b>Country:</b> {recognizedAddress.country}</span>}
            {recognizedAddress.state && <span>• <b>State:</b> {recognizedAddress.state}</span>}
            {recognizedAddress.district && <span>• <b>District:</b> {recognizedAddress.district}</span>}
            {recognizedAddress.villageArea && <span>• <b>Village/Area:</b> {recognizedAddress.villageArea}</span>}
            {recognizedAddress.pinCode && (
              <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">
                • <b>PIN Code:</b> {recognizedAddress.pinCode}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />
            Move the pin marker or click on map to pinpoint exact school campus.
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};
