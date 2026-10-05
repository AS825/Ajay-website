import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import { viennaLocalToDate, dateToViennaLocal } from '@ajay/shared'
import { adminDb } from './firebase'
import { toast } from './ui/Toast'

const DAY = 86_400_000

/** Creates a draft event (in 14 days, 22:00–04:00 Vienna) and opens the editor. */
export function useCreateEvent() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)

  const create = async () => {
    setCreating(true)
    try {
      const day = dateToViennaLocal(new Date(Date.now() + 14 * DAY)).slice(0, 10)
      const start = viennaLocalToDate(`${day}T22:00`)
      const ref = await addDoc(collection(adminDb, 'events'), {
        slug: `event-${Date.now().toString(36)}`,
        title: t('admin.events.untitled'),
        startsAt: Timestamp.fromDate(start),
        endsAt: Timestamp.fromDate(new Date(start.getTime() + 6 * 3600_000)),
        venue: { name: '', address: '', mapsUrl: '' },
        flyerUrl: '',
        description: { en: '' },
        lineup: ['AJAY'],
        minAge: 18,
        status: 'draft',
        guestlist: { enabled: true, capacity: 100, deadline: null, maxPlusOnes: 1, count: 0 },
        ticketing: { enabled: false, externalUrl: '' },
        createdAt: serverTimestamp(),
      })
      navigate(`/admin/events/${ref.id}`)
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
      setCreating(false)
    }
  }
  return { create, creating }
}
