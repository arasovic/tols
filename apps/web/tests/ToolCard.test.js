import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/svelte'
import ToolCard from '$lib/components/ToolCard.svelte'
import { Code } from 'lucide-svelte'
import { templateFor } from '$lib/cli/templates.js'

const tool = {
  path: 'json',
  name: 'JSON Formatter',
  desc: 'Format JSON',
  icon: Code
}

describe('ToolCard favorites', () => {
  it('shows an inactive star by default', () => {
    const { getByLabelText } = render(ToolCard, { props: { tool } })
    expect(getByLabelText('Add JSON Formatter to favorites')).toBeInTheDocument()
  })

  it('shows an active star when favorited', () => {
    const { getByLabelText } = render(ToolCard, { props: { tool, favorite: true } })
    expect(getByLabelText('Remove JSON Formatter from favorites')).toBeInTheDocument()
  })

  it('emits togglefavorite without navigating', async () => {
    const { component, getByLabelText } = render(ToolCard, { props: { tool } })

    const events = []
    component.$on('togglefavorite', () => events.push('toggled'))

    await fireEvent.click(getByLabelText('Add JSON Formatter to favorites'))

    expect(events).toEqual(['toggled'])
    // The click must not trigger the card link
    expect(window.location.pathname).not.toContain('/json')
  })

  it('renders the real CLI invocation derived from templateFor', () => {
    const { container } = render(ToolCard, { props: { tool } })

    const template = templateFor(tool.path)
    const expected = `tols ${template.tool} ${template.defaultAction}`

    const cmd = container.querySelector('.tool-cmd')
    expect(cmd).not.toBeNull()
    expect(cmd?.textContent).toContain(expected)
  })
})
