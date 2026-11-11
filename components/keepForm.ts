'use client'
import { startTransition, type FormEvent } from 'react'

/**
 * Submit a form to a useActionState action WITHOUT React's automatic form reset, so a customer who
 * gets an error (wrong password, missing phone…) keeps everything they typed.
 */
export function keepForm(dispatch: (fd: FormData) => void) {
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(() => dispatch(fd))
  }
}
