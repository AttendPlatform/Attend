import { Coordinates } from './types'

export interface NigerianHub {
  name: string
  state: string
  country: string
  coordinates: Coordinates
  popularVenues: string[]
}

export const NIGERIAN_HUBS: NigerianHub[] = [
  {
    name: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    coordinates: { latitude: 6.5244, longitude: 3.3792 },
    popularVenues: [
      'Eko Convention Centre, Victoria Island',
      'Landmark Centre, Victoria Island',
      'Balmoral Convention Center, Federal Palace Hotel',
      'Muson Centre, Onikan',
      'The Zone, Gbagada'
    ]
  },
  {
    name: 'Port Harcourt',
    state: 'Rivers',
    country: 'Nigeria',
    coordinates: { latitude: 4.8156, longitude: 7.0498 },
    popularVenues: [
      'Azny Place, GRA Phase 2',
      'The Dome, Peter Odili Road',
      'Pleasure Park Event Pavilion',
      'Atlantic Hall, Hotel Presidential',
      'Emerald Event Centre'
    ]
  },
  {
    name: 'Abuja',
    state: 'Federal Capital Territory',
    country: 'Nigeria',
    coordinates: { latitude: 9.0765, longitude: 7.3986 },
    popularVenues: [
      'International Conference Centre (ICC)',
      'Transcorp Hilton Congress Hall',
      'NAF Conference Centre, Kado',
      'The Baze University Multi-purpose Hall',
      'Eagles Square'
    ]
  },
  {
    name: 'Ibadan',
    state: 'Oyo',
    country: 'Nigeria',
    coordinates: { latitude: 7.3775, longitude: 3.947 },
    popularVenues: [
      'International Conference Centre, UI',
      'Jogor Centre, Ring Road',
      'Mauve 21, Ring Road',
      'Premier Hotel Banquet Hall'
    ]
  },
  {
    name: 'Enugu',
    state: 'Enugu',
    country: 'Nigeria',
    coordinates: { latitude: 6.4584, longitude: 7.5464 },
    popularVenues: [
      'Michael Okpara Square',
      'Golden Royale Banquet Hall',
      'Kobb Civic Centre, Shoprite Mall'
    ]
  },
  {
    name: 'Benin City',
    state: 'Edo',
    country: 'Nigeria',
    coordinates: { latitude: 6.335, longitude: 5.6037 },
    popularVenues: [
      'Victor Uwaifo Creative Hub',
      'Edo Hotel Conference Hall',
      'Sir Victor Uwaifo Sound Stage'
    ]
  },
  {
    name: 'Kano',
    state: 'Kano',
    country: 'Nigeria',
    coordinates: { latitude: 12.0022, longitude: 8.592 },
    popularVenues: [
      'Ado Bayero Mall Event Pavilion',
      'Tahai Luxury Hotel Hall',
      'Meena Event Centre'
    ]
  },
  {
    name: 'Calabar',
    state: 'Cross River',
    country: 'Nigeria',
    coordinates: { latitude: 4.9757, longitude: 8.3417 },
    popularVenues: [
      'Calabar Cultural Centre',
      'Tinapa Knowledge City',
      'U.J. Esuene Stadium'
    ]
  },
  {
    name: 'Asaba',
    state: 'Delta',
    country: 'Nigeria',
    coordinates: { latitude: 6.1986, longitude: 6.7329 },
    popularVenues: [
      'The Event Centre, Okpanam Road',
      'Grand Hotel Hall',
      'Stephen Keshi Stadium Pavilion'
    ]
  },
  {
    name: 'Owerri',
    state: 'Imo',
    country: 'Nigeria',
    coordinates: { latitude: 5.4832, longitude: 7.0326 },
    popularVenues: [
      'Landmark Event Centre, Owerri',
      'Imo Concorde Hotel Ballroom',
      'Ahiajoku Convention Centre'
    ]
  },
  {
    name: 'Uyo',
    state: 'Akwa Ibom',
    country: 'Nigeria',
    coordinates: { latitude: 5.0377, longitude: 7.9128 },
    popularVenues: [
      'Ibom Hall, IBB Way',
      'Emerald Events Centre',
      'Godswill Akpabio International Stadium Hall'
    ]
  },
  {
    name: 'Warri',
    state: 'Delta',
    country: 'Nigeria',
    coordinates: { latitude: 5.5167, longitude: 5.75 },
    popularVenues: [
      'Peemos Place Hall',
      'KFT Place Event Centre',
      'Wellington Hotel Hall'
    ]
  }
]

export function findNigerianHub(query: string): NigerianHub | null {
  if (!query || !query.trim()) return null
  const normalized = query.trim().toLowerCase()

  for (const hub of NIGERIAN_HUBS) {
    if (
      hub.name.toLowerCase() === normalized ||
      hub.state.toLowerCase() === normalized ||
      normalized.includes(hub.name.toLowerCase()) ||
      hub.name.toLowerCase().includes(normalized)
    ) {
      return hub
    }
  }

  return null
}

export function isNigerianCoordinates(coords: Coordinates): boolean {
  return (
    coords.latitude >= 4.0 &&
    coords.latitude <= 14.0 &&
    coords.longitude >= 2.5 &&
    coords.longitude <= 15.0
  )
}
