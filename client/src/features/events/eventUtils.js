export function getEventCategories(event) {
  return (event.categories || []).map((category) => ({
    id: String(category.id ?? category.title ?? category.name ?? ''),
    title: category.title ?? category.name ?? category.id ?? 'Unknown'
  }));
}

export function getEventDate(event) {
  const dates = (event.geometry || [])
    .map((point) => Date.parse(point.date || ''))
    .filter(Number.isFinite);

  if (dates.length > 0) {
    return Math.max(...dates);
  }

  const fallbackDate = event.closed_at ?? event.closed ?? event.date;

  if (!fallbackDate) return null;

  const timestamp = Date.parse(fallbackDate);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getMagnitudeInfo(event) {
  const hasEventMagnitude =
    event.magnitudeValue !== null &&
    event.magnitudeValue !== undefined &&
    event.magnitudeValue !== '' &&
    Number.isFinite(Number(event.magnitudeValue));

  if (hasEventMagnitude) {
    return {
      value: Number(event.magnitudeValue),
      unit: event.magnitudeUnit || ''
    };
  }

  const magnitudes = (event.geometry || [])
    .filter(
      (point) =>
        point.magnitudeValue !== null &&
        point.magnitudeValue !== undefined &&
        point.magnitudeValue !== '' &&
        Number.isFinite(Number(point.magnitudeValue))
    )
    .map((point) => ({
      value: Number(point.magnitudeValue),
      unit: point.magnitudeUnit || '',
      date: Date.parse(point.date || '')
    }))
    .sort((a, b) => {
      const dateA = Number.isFinite(a.date) ? a.date : -Infinity;
      const dateB = Number.isFinite(b.date) ? b.date : -Infinity;
      return dateB - dateA;
    });

  return magnitudes[0] || null;
}

export function getDistance(event, userLocation) {
  if (
    event.distance_km !== null &&
    event.distance_km !== undefined &&
    event.distance_km !== '' &&
    Number.isFinite(Number(event.distance_km))
  ) {
    return Number(event.distance_km);
  }

  if (
    !userLocation ||
    !Number.isFinite(Number(userLocation.lat)) ||
    !Number.isFinite(Number(userLocation.lng))
  ) {
    return null;
  }

  const coordinates = getEventCoordinates(event);
  if (!coordinates) return null;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const lat1 = toRadians(Number(userLocation.lat));
  const lat2 = toRadians(coordinates.lat);
  const deltaLat = toRadians(coordinates.lat - Number(userLocation.lat));
  const deltaLng = toRadians(coordinates.lng - Number(userLocation.lng));

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getEventCoordinates(event) {
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);

  if (
    event.latitude != null &&
    event.longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return { lat: latitude, lng: longitude };
  }

  const geometry = event.geometry || [];

  for (let i = geometry.length - 1; i >= 0; i -= 1) {
    const coordinates =
      geometry[i]?.coordinates ??
      geometry[i]?.geometry?.coordinates;

    if (
      Array.isArray(coordinates) &&
      coordinates.length >= 2 &&
      Number.isFinite(Number(coordinates[0])) &&
      Number.isFinite(Number(coordinates[1]))
    ) {
      return {
        lat: Number(coordinates[1]),
        lng: Number(coordinates[0])
      };
    }
  }

  return null;
}

export function formatEventDate(timestamp) {
  if (timestamp === null) return 'Date unavailable';

  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
