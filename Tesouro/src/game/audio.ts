// Original procedural ambience, started only by an explicit user interaction.
export class BayouAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private sources: AudioScheduledSourceNode[] = []
  private interval: ReturnType<typeof setInterval> | null = null
  private enabled = false
  async start(volume: number) {
    if (this.enabled) {
      this.volume(volume)
      return
    }
    this.context ??= new AudioContext()
    await this.context.resume()
    if (this.enabled) return
    this.enabled = true
    const ctx = this.context
    this.master = ctx.createGain()
    this.master.gain.value = Math.max(0, Math.min(1, volume)) * 0.22
    this.master.connect(ctx.destination)
    const noise = ctx.createBuffer(1, ctx.sampleRate * 5, ctx.sampleRate)
    const samples = noise.getChannelData(0)
    let previous = 0
    for (let i = 0; i < samples.length; i++) {
      previous = (previous + (Math.random() * 2 - 1) * 0.025) / 1.025
      samples[i] = previous * 2
    }
    const water = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 600
    water.buffer = noise
    water.loop = true
    water.connect(filter)
    filter.connect(this.master)
    water.start()
    this.sources.push(water)
    const chord = () => {
      if (!this.context || !this.master || !this.enabled) return
      const now = ctx.currentTime
      ;[130.81, 196, 261.63].forEach((frequency, i) => {
        const note = ctx.createOscillator(),
          envelope = ctx.createGain()
        note.type = 'sine'
        note.frequency.value = frequency
        envelope.gain.setValueAtTime(0, now)
        envelope.gain.linearRampToValueAtTime(0.035, now + 3 + i)
        envelope.gain.linearRampToValueAtTime(0, now + 12)
        note.connect(envelope)
        envelope.connect(this.master!)
        note.start(now)
        note.stop(now + 12.1)
        note.onended = () => {
          note.disconnect()
          envelope.disconnect()
        }
      })
    }
    chord()
    this.interval = setInterval(chord, 14000)
  }
  volume(value: number) {
    if (this.context && this.master)
      this.master.gain.setTargetAtTime(
        Math.max(0, Math.min(1, value)) * 0.22,
        this.context.currentTime,
        0.2,
      )
  }
  click() {
    if (!this.enabled || !this.context || !this.master) return
    const ctx = this.context,
      note = ctx.createOscillator(),
      envelope = ctx.createGain()
    note.frequency.setValueAtTime(660, ctx.currentTime)
    note.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12)
    envelope.gain.setValueAtTime(0.12, ctx.currentTime)
    envelope.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    note.connect(envelope)
    envelope.connect(this.master)
    note.start()
    note.stop(ctx.currentTime + 0.16)
    note.onended = () => {
      note.disconnect()
      envelope.disconnect()
    }
  }
  stop() {
    this.enabled = false
    if (this.interval) clearInterval(this.interval)
    this.interval = null
    this.sources.forEach((source) => {
      try {
        source.stop()
      } catch {
        /* already stopped */
      }
      source.disconnect()
    })
    this.sources = []
    this.master?.disconnect()
    this.master = null
  }
}
