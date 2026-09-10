// Google Places — find restaurants near campus. Uses the Places API (Nearby Search + Text Search).
const BASE = 'https://maps.googleapis.com/maps/api/place';

export async function nearbyRestaurants({ lat, lng, radius, keyword }) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY not set');
  const params = new URLSearchParams({ key, location: `${lat},${lng}`, radius: String(radius), type: 'restaurant' });
  if (keyword) params.set('keyword', keyword);
  const res = await fetch(`${BASE}/nearbysearch/json?${params}`);
  const data = await res.json();
  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') throw new Error(`Places ${data.status}: ${data.error_message || ''}`);
  return (data.results || []).map((r) => ({
    place_id: r.place_id, name: r.name, address: r.vicinity,
    lat: r.geometry?.location?.lat, lng: r.geometry?.location?.lng,
    rating: r.rating, open_now: r.opening_hours?.open_now ?? null,
  }));
}

export async function placeDetails(placeId) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const params = new URLSearchParams({ key, place_id: placeId, fields: 'name,website,formatted_address,geometry,editorial_summary,serves_breakfast,serves_lunch,serves_dinner' });
  const res = await fetch(`${BASE}/details/json?${params}`);
  const data = await res.json();
  return data.result || {};
}
