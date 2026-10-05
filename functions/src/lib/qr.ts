import { randomBytes } from 'node:crypto'
import QRCode from 'qrcode'

/** Unguessable pass token (stored on the guestlist entry, part of the QR URL). */
export const newPassToken = () => randomBytes(18).toString('base64url')

/** QR code as PNG (medium error correction, quiet zone of 1) – scans well from a phone screen. */
export function qrPng(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 440,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
