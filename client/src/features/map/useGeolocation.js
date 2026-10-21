import { useEffect, useState } from 'react';

export default function useGeolocation(showUserLocation, isSearchingNearby) {
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (!showUserLocation && !isSearchingNearby) {
      return;
    }

    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({
          lat: coords.latitude,
          lng: coords.longitude
        });
      },
      (error) => {
        console.error('Unable to retrieve user location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [showUserLocation, isSearchingNearby]);

  const handleLocateUser = (onNearbyStart) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setUserLocation({ lat, lng });
        onNearbyStart?.();
      },
      () => alert('Unable to retrieve your location.')
    );
  };

  return { userLocation, setUserLocation, handleLocateUser };
}
