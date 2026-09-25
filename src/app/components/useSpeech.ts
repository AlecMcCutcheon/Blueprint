import { useCallback, useEffect, useRef, useState } from 'react';

// Text-to-speech via the browser's built-in Web Speech API — no library, no
// keys, no network calls, consistent with the app's privacy stance.
//
// Chrome-specific quirks this hook defends against:
//  - voices load asynchronously (getVoices() is empty until voiceschanged)
//  - an utterance queued in the same tick as cancel() can be silently dropped
//    → we defer speak() by a tick
//  - some assigned voices fail without onerror → watchdog retries with the
//    platform default voice
//  - the queue can sit "paused" after cancel → we resume() before speaking

/**
 * Strip formatting that reads badly aloud and add pauses where a narrator
 * would take one. Tuned for our question prompts and option labels.
 */
export function speakFriendly(text: string): string {
  let t = text;
  t = t.replace(/---+/g, '.');
  t = t.replace(/—/g, ', ');           // em dash: small pause instead of "dash"
  t = t.replace(/–/g, ' to ');          // ranges
  t = t.replace(/\bA\/B\b/g, 'A or B');
  t = t.replace(/["""„]/g, '');          // quotes read better naked
  t = t.replace(/''/g, '');
  t = t.replace(/\.\.\./g, ',');         // ellipsis → pause
  t = t.replace(/'/g, "'");
  t = t.replace(/e\.g\./gi, 'for example');
  t = t.replace(/\betc\./gi, 'et cetera');
  t = t.replace(/\b([A-E])\.\s+/g, (_m, letter: string) => `${letter.toUpperCase()}. `);
  return t.replace(/\s+/g, ' ').trim();
}

/** Join prompt paragraphs with sentence spacing so the pacing survives. */
export function promptToSpeech(paragraphs: string[]): string {
  return speakFriendly(paragraphs.join('. '));
}

// Voices that tend to sound natural; ordered preference by substring.
const PREFERRED = [
  'samantha', 'ava', 'nicky',   // Apple
  'aria', 'jenny', 'emma', 'guy', // Edge online voices
  'google us english', 'google uk english female', // Chrome
  'zira', 'david',              // Windows
];
const AVOID = ['compact', 'eloquence', 'espeak', 'novelty', 'whisper', 'bells', 'organ', 'cello', 'zarvox', 'albert', 'bad news', 'good news', 'hysterical', 'bubbles', 'boing', 'trinoids', 'wobble', 'jester', 'witch', 'robot'];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (english.length === 0) return null;
  const clean = english.filter(
    (v) => !AVOID.some((bad) => v.name.toLowerCase().includes(bad)),
  );
  const pool = clean.length > 0 ? clean : english;
  for (const pref of PREFERRED) {
    const hit = pool.find((v) => v.name.toLowerCase().includes(pref));
    if (hit) return hit;
  }
  const local = pool.filter((v) => v.localService);
  if (local.length > 0) return local[0];
  return pool[0] ?? null;
}

export function useSpeech() {
  const [supported] = useState<boolean>(
    () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  );
  const [speaking, setSpeaking] = useState(false);
  const [failedReason, setFailedReason] = useState<'no-voices' | 'engine' | null>(null);
  const [voiceCount, setVoiceCount] = useState<number>(0);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timersRef = useRef<number[]>([]);

  const refreshVoices = useCallback((): number => {
    if (!supported) return 0;
    const voices = window.speechSynthesis.getVoices();
    setVoiceCount(voices.length);
    if (voices.length > 0 && voiceRef.current === null) {
      voiceRef.current = pickVoice(voices);
    }
    return voices.length;
  }, [supported]);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  }, []);

  // Voices load async in most browsers
  useEffect(() => {
    if (!supported) return;
    const load = () => {
      refreshVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      clearTimers();
      window.speechSynthesis.cancel();
    };
  }, [supported, clearTimers, refreshVoices]);

  const stop = useCallback(() => {
    if (!supported) return;
    clearTimers();
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported, clearTimers]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      const synth = window.speechSynthesis;
      setFailedReason(null);
      clearTimers();
      synth.cancel();

      const attempt = (useVoice: boolean, retry: boolean) => {
        const u = new SpeechSynthesisUtterance(speakFriendly(text));
        u.lang = 'en-US';
        u.rate = 0.98;
        u.pitch = 1.0;
        u.volume = 1.0;
        if (useVoice && voiceRef.current) u.voice = voiceRef.current;

        let started = false;
        u.onstart = () => {
          started = true;
          setSpeaking(true);
        };
        u.onend = () => setSpeaking(false);
        u.onerror = (e) => {
          setSpeaking(false);
          // 'interrupted'/'canceled' are expected from our own cancel()
          if (e.error && e.error !== 'interrupted' && e.error !== 'canceled') {
            console.warn('[speech] error:', e.error);
          }
        };

        utterRef.current = u; // keep alive — Chrome can GC a queued utterance

        // Defer past the cancel() tick; resume() un-sticks a paused queue.
        timersRef.current.push(
          window.setTimeout(() => {
            synth.resume();
            synth.speak(u);
          }, 50),
        );

        // Watchdog: if it never started, diagnose and optionally retry.
        if (retry) {
          timersRef.current.push(
            window.setTimeout(() => {
              if (!started) {
                synth.cancel();
                attempt(false, false);
              }
            }, 1400),
          );
        } else {
          timersRef.current.push(
            window.setTimeout(() => {
              if (!started) {
                const count = refreshVoices();
                if (count === 0) {
                  setFailedReason('no-voices');
                  console.warn(
                    '[speech] No voices installed. On Linux, install: sudo dnf install speech-dispatcher espeak-ng (then restart the browser).',
                  );
                } else {
                  setFailedReason('engine');
                  console.warn(
                    '[speech] Voices exist but the engine never started. Try another browser or restart this one.',
                    window.speechSynthesis.getVoices().map((v) => v.name),
                  );
                }
                setSpeaking(false);
              }
            }, 1400),
          );
        }
      };

      // Refresh the voice cache if it never loaded
      const count = refreshVoices();
      if (count === 0) {
        // Voices may still be arriving (async load); re-check once shortly.
        timersRef.current.push(window.setTimeout(() => refreshVoices(), 350));
      }
      attempt(true, true);
    },
    [supported, clearTimers, refreshVoices],
  );

  return { supported, speaking, failedReason, voiceCount, speak, stop };
}
