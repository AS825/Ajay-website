import { useEffect, useState } from 'react'
import { onIdTokenChanged, type User } from 'firebase/auth'
import {
  collection,
  doc,
  onSnapshot,
  query,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore'
import { adminDb, auth } from './firebase'

export interface AuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

/** Signed-in user and whether their ID token carries the `admin` custom claim. */
export function useAdminAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true })
  useEffect(
    () =>
      onIdTokenChanged(auth, async (user) => {
        if (!user) return setState({ user: null, isAdmin: false, loading: false })
        const token = await user.getIdTokenResult()
        setState({ user, isAdmin: token.claims.admin === true, loading: false })
      }),
    [],
  )
  return state
}

export type WithId<T> = T & { id: string }

/** Realtime document. `undefined` while loading, `null` if missing. */
export function useDocData<T = DocumentData>(path: string | null): WithId<T> | null | undefined {
  const [data, setData] = useState<WithId<T> | null | undefined>(undefined)
  useEffect(() => {
    if (!path) return
    return onSnapshot(
      doc(adminDb, path),
      (s) => setData(s.exists() ? ({ id: s.id, ...(s.data() as T) } as WithId<T>) : null),
      (err) => {
        console.error(`[admin] ${path}:`, err)
        setData(null)
      },
    )
  }, [path])
  return data
}

/** Realtime collection query. `undefined` while loading. Pass a stable `key` for the constraints. */
export function useCollectionData<T = DocumentData>(
  path: string | null,
  constraints: QueryConstraint[] = [],
  key = '',
): WithId<T>[] | undefined {
  const [data, setData] = useState<WithId<T>[] | undefined>(undefined)
  useEffect(() => {
    if (!path) return
    return onSnapshot(
      query(collection(adminDb, path), ...constraints),
      (s) => setData(s.docs.map((d) => ({ id: d.id, ...(d.data() as T) }) as WithId<T>)),
      (err) => {
        console.error(`[admin] ${path}:`, err)
        setData([])
      },
    )
    // constraints are described by `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key])
  return data
}

/** Drops the `id` added by the hooks, e.g. before writing a document back. */
export function omitId<T extends object>(value: T & { id?: string }): T {
  const { id: _id, ...rest } = value
  return rest as T
}

/** Deep equality for plain JSON data, independent of key order (Firestore doesn't keep it). */
export function sameData(a: unknown, b: unknown): boolean {
  const norm = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(norm)
      : v && typeof v === 'object'
        ? Object.fromEntries(
            Object.keys(v as object)
              .sort()
              .map((k) => [k, norm((v as Record<string, unknown>)[k])]),
          )
        : v
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b))
}
