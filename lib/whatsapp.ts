import { BUSINESS } from './config'

export const waLink = (text?: string) =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`
