import type { Timestamp } from 'firebase/firestore'
import type { EventDoc, GuestlistStatus, Booking, Lang } from '@ajay/shared'

export type AdminEvent = EventDoc<Timestamp>

export interface GuestEntry {
  firstName: string
  lastName: string
  email: string
  phone: string
  plusOnes: number
  status: GuestlistStatus
  checkedIn: boolean
  checkedInAt?: Timestamp | null
  newsletter: boolean
  lang?: Lang
  createdAt?: Timestamp
}

export type BookingStatus = 'new' | 'inProgress' | 'confirmed' | 'declined'
export const BOOKING_STATUSES: BookingStatus[] = ['new', 'inProgress', 'confirmed', 'declined']

export type BookingEntry = Omit<Booking, 'privacyAccepted' | 'website'> & {
  status: BookingStatus
  notes: string
  lang?: Lang
  createdAt?: Timestamp
}
