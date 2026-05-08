import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'
import { appMeta } from './lib/meta'

describe('App', () => {
  it('renders the studio shell with public support links and build metadata', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Meshtrack Studio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /star on github/i })).toHaveAttribute(
      'href',
      appMeta.repositoryUrl,
    )
    expect(screen.getByRole('link', { name: /support via paypal/i })).toHaveAttribute(
      'href',
      appMeta.paypalUrl,
    )
    expect(screen.getByText(`v${appMeta.version} / ${appMeta.commit}`)).toBeInTheDocument()
    expect(await screen.findByText(/Restored|Ready|storage is unavailable/i)).toBeInTheDocument()
  })
})
