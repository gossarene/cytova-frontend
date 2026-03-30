import { jwtDecode } from 'jwt-decode'
import type { DecodedToken } from './types'

export function decodeAccessToken(token: string): DecodedToken {
  return jwtDecode<DecodedToken>(token)
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = decodeAccessToken(token)
    return decoded.exp * 1000 < Date.now()
  } catch {
    return true
  }
}
