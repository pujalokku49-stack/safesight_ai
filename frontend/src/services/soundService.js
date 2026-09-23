/**
 * SafeSight AI - Sound & Text-to-Speech (TTS) Early Warning Service
 * Uses Web Audio API for synthesized acoustic alerts and Web Speech API for voice warnings.
 */

class SoundService {
  constructor() {
    this.audioCtx = null;
    this.soundEnabled = true;
    this.ttsEnabled = true;
    this.lastTtsTime = 0;
    this.ttsThrottleMs = 4500; // Do not repeat TTS warning within 4.5 seconds
    this.lastPlayedSeverity = null;
  }

  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    return this.soundEnabled;
  }

  toggleTts() {
    this.ttsEnabled = !this.ttsEnabled;
    return this.ttsEnabled;
  }

  playRiskSound(severity) {
    if (!this.soundEnabled) return;
    this.initAudio();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;

    if (severity === 'CRITICAL') {
      // Rapid emergency two-tone pulse
      this._playTone(880, now, 0.12, 'sawtooth', 0.25);
      this._playTone(1100, now + 0.14, 0.14, 'sawtooth', 0.3);
      this._playTone(880, now + 0.30, 0.12, 'sawtooth', 0.25);
      this._playTone(1100, now + 0.44, 0.18, 'sawtooth', 0.3);
    } else if (severity === 'HIGH') {
      // Urgent chime (two-tone rising)
      this._playTone(520, now, 0.15, 'sine', 0.2);
      this._playTone(780, now + 0.15, 0.22, 'sine', 0.25);
    } else if (severity === 'MODERATE') {
      // Subtle single caution blip
      this._playTone(440, now, 0.1, 'sine', 0.1);
    }
  }

  _playTone(freq, startTime, duration, type = 'sine', volume = 0.2) {
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  speakWarning(text, severity) {
    if (!this.ttsEnabled || !window.speechSynthesis) return;

    const now = Date.now();
    // Only speak on HIGH or CRITICAL, throttled
    if ((severity === 'HIGH' || severity === 'CRITICAL') && (now - this.lastTtsTime > this.ttsThrottleMs)) {
      this.lastTtsTime = now;
      try {
        window.speechSynthesis.cancel(); // Cancel backlog
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1; // Slightly urgent delivery
        utterance.pitch = severity === 'CRITICAL' ? 1.2 : 1.0;
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('TTS error:', e);
      }
    }
  }
}

export const soundService = new SoundService();
