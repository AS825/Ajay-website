import logo from '../assets/brand/ajay-logo.png'
import hero from '../assets/brand/hero.webp'
import about from '../assets/brand/about.webp'
import info from '../assets/brand/info.webp'
import venues from '../assets/brand/venues.webp'
import contact from '../assets/brand/contact.webp'
import rider from '../assets/brand/rider.webp'

/**
 * Images cut from the 2027 press kit. They stand in until Ajay uploads originals
 * in the admin (Design → logo/portrait, Content → bio and press kit photos).
 * Imported so they ship inside the build with hashed names (never a stale cache).
 */
export const BRAND = { logo, hero, about, info, venues, contact, rider } as const
