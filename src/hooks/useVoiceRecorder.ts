import { useCallback, useRef, useState } from 'react';

export interface VoiceResult {
  file: File;
  durationMs: number;
  waveform: string;
}

const WAVE_BARS = 40;

const pickMime = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const candidate of candidates) {
    if (MediaRecorder.isTypeSupported(candidate)) return candidate;
  }
  return '';
};

const baseMime = (mime: string): string => {
  const semi = mime.indexOf(';');
  return semi === -1 ? mime : mime.slice(0, semi);
};

const extFor = (mime: string): string => {
  if (mime === 'audio/webm') return 'webm';
  if (mime === 'audio/ogg') return 'ogg';
  if (mime === 'audio/mp4') return 'm4a';
  return 'webm';
};

const downsample = (samples: number[]): string => {
  if (samples.length === 0) {
    return Array.from({ length: WAVE_BARS }, () => 14).join(',');
  }
  const out: number[] = [];
  const bucket = samples.length / WAVE_BARS;
  for (let i = 0; i < WAVE_BARS; i += 1) {
    const start = Math.floor(i * bucket);
    const end = Math.max(start + 1, Math.floor((i + 1) * bucket));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end && j < samples.length; j += 1) {
      sum += samples[j];
      count += 1;
    }
    const avg = count === 0 ? 0 : sum / count;
    out.push(Math.round(Math.min(100, Math.max(8, avg))));
  }
  return out.join(',');
};

export interface VoiceRecorder {
  recording: boolean;
  seconds: number;
  supported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<VoiceResult | null>;
  cancel: () => void;
}

export const useVoiceRecorder = (): VoiceRecorder => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const samplesRef = useRef<number[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const mimeRef = useRef('');
  const cancelledRef = useRef(false);

  const supported =
    pickMime() !== '' &&
    typeof navigator !== 'undefined' &&
    navigator.mediaDevices !== undefined;

  const cleanup = useCallback(() => {
    if (tickRef.current !== null) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const ctx = audioCtxRef.current;
    if (ctx !== null) {
      void ctx.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    const stream = streamRef.current;
    if (stream !== null) {
      for (const track of stream.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (recording) return;
    const mime = pickMime();
    if (mime === '' || navigator.mediaDevices === undefined) {
      throw new Error('Recording is not supported on this device');
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    samplesRef.current = [];
    cancelledRef.current = false;
    mimeRef.current = mime;

    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const loop = () => {
        const node = analyserRef.current;
        if (node === null) return;
        node.getByteTimeDomainData(buffer);
        let peak = 0;
        for (let i = 0; i < buffer.length; i += 1) {
          const deviation = Math.abs(buffer[i] - 128);
          if (deviation > peak) peak = deviation;
        }
        samplesRef.current.push(Math.min(100, (peak / 128) * 150));
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      audioCtxRef.current = null;
      analyserRef.current = null;
    }

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      cleanup();
      recorderRef.current = null;
      setRecording(false);
    };
    recorder.start();
    startedAtRef.current = Date.now();
    setSeconds(0);
    setRecording(true);
    tickRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);
  }, [recording, cleanup]);

  const stop = useCallback((): Promise<VoiceResult | null> => {
    return new Promise<VoiceResult | null>((resolve) => {
      const recorder = recorderRef.current;
      if (recorder === null) {
        resolve(null);
        return;
      }
      const durationMs = Date.now() - startedAtRef.current;
      recorder.onstop = () => {
        const samples = samplesRef.current.slice();
        cleanup();
        recorderRef.current = null;
        setRecording(false);
        if (cancelledRef.current) {
          resolve(null);
          return;
        }
        const type = baseMime(mimeRef.current);
        const blob = new Blob(chunksRef.current, { type });
        const file = new File([blob], `voice.${extFor(type)}`, { type });
        resolve({ file, durationMs, waveform: downsample(samples) });
      };
      if (recorder.state !== 'inactive') recorder.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    const recorder = recorderRef.current;
    if (recorder !== null && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      cleanup();
      recorderRef.current = null;
      setRecording(false);
    }
  }, [cleanup]);

  return { recording, seconds, supported, start, stop, cancel };
};
