import { describe, expect, it, vi } from 'vitest'
import { createEventBus } from '../../src/events/eventBus'

interface TestEventMap {
  'test.foo': { value: number }
  'test.bar': { label: string }
}

describe('createEventBus', () => {
  it('delivers an emitted payload to a subscribed listener', () => {
    const bus = createEventBus<TestEventMap>()
    const listener = vi.fn()

    bus.on('test.foo', listener)
    bus.emit('test.foo', { value: 42 })

    expect(listener).toHaveBeenCalledExactlyOnceWith({ value: 42 })
  })

  it('delivers to every listener subscribed to the same event', () => {
    const bus = createEventBus<TestEventMap>()
    const first = vi.fn()
    const second = vi.fn()

    bus.on('test.foo', first)
    bus.on('test.foo', second)
    bus.emit('test.foo', { value: 1 })

    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
  })

  it('never calls a listener subscribed to a different event', () => {
    const bus = createEventBus<TestEventMap>()
    const fooListener = vi.fn()
    const barListener = vi.fn()

    bus.on('test.foo', fooListener)
    bus.on('test.bar', barListener)
    bus.emit('test.foo', { value: 1 })

    expect(fooListener).toHaveBeenCalledOnce()
    expect(barListener).not.toHaveBeenCalled()
  })

  it('stops delivering to a listener once removed via off', () => {
    const bus = createEventBus<TestEventMap>()
    const listener = vi.fn()

    bus.on('test.foo', listener)
    bus.off('test.foo', listener)
    bus.emit('test.foo', { value: 1 })

    expect(listener).not.toHaveBeenCalled()
  })

  it('is a no-op to emit an event with no subscribers', () => {
    const bus = createEventBus<TestEventMap>()
    expect(() => bus.emit('test.bar', { label: 'nobody listening' })).not.toThrow()
  })
})
