// Supported campuses. Adding one = add a row here (DineOnCampus slug + campus center for restaurant search).
export const CAMPUSES = {
  tamu: { key: 'tamu', name: 'Texas A&M', city: 'College Station, TX', slug: 'tamu', match: /texas a&m university$/i, lat: 30.6152, lng: -96.3405, tz: 'America/Chicago' },
  utd:  { key: 'utd',  name: 'UT Dallas',  city: 'Richardson, TX',      slug: 'utdallasdining', match: /university of texas at dallas|ut dallas/i, lat: 32.9857, lng: -96.7502, tz: 'America/Chicago' },
};
export const DEFAULT_CAMPUS = 'tamu';
export const campus = (key) => CAMPUSES[key] || CAMPUSES[DEFAULT_CAMPUS];
export const publicCampus = (key) => { const { match, ...c } = campus(key); return c; };
