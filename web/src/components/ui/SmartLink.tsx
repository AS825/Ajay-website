import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function isExternal(href: string) {
  return /^(https?:|mailto:|tel:)/.test(href)
}

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }

/** Router link for internal paths, new-tab anchor for external URLs. */
export function SmartLink({ href, children, ...rest }: Props) {
  if (isExternal(href)) {
    const newTab = href.startsWith('http')
    return (
      <a
        href={href}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...rest}
      >
        {children}
      </a>
    )
  }
  return (
    <Link to={href} {...rest}>
      {children}
    </Link>
  )
}
