#!/usr/bin/env python3
"""
Generate a simple retro-style background music for the game
Uses basic sine wave synthesis to create a chiptune-style melody
"""

import wave
import struct
import math

# Audio parameters
SAMPLE_RATE = 44100  # Hz
DURATION = 20  # seconds (will loop)
AMPLITUDE = 0.3  # Volume (0.0 to 1.0)

# Note frequencies (in Hz) - using standard equal temperament
NOTES = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
    'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
    'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
    'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
    'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61,
    'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
    'REST': 0
}

# Simple retro game melody (inspired by classic arcade games)
# Format: (note, duration_beats)
MELODY = [
    ('E5', 1), ('E5', 1), ('REST', 1), ('E5', 1),
    ('REST', 1), ('C5', 1), ('E5', 2),
    ('G5', 2), ('REST', 2), ('G4', 2), ('REST', 2),

    ('C5', 1.5), ('REST', 0.5), ('G4', 1), ('REST', 1),
    ('E4', 1.5), ('REST', 0.5), ('A4', 1), ('B4', 1),
    ('A4', 1), ('A4', 1), ('G4', 1.5), ('E5', 1.5), ('G5', 1.5),
    ('A5', 1), ('F5', 1), ('G5', 1),
    ('REST', 1), ('E5', 1), ('C5', 1), ('D5', 1), ('B4', 1.5),
]

# Bass line (plays underneath melody)
BASS = [
    ('C3', 4), ('G3', 4), ('E3', 4), ('A3', 4),
    ('C3', 4), ('G3', 4), ('E3', 4), ('A3', 4),
]

def generate_tone(frequency, duration, sample_rate=SAMPLE_RATE, amplitude=AMPLITUDE):
    """Generate a sine wave tone"""
    num_samples = int(sample_rate * duration)
    samples = []

    for i in range(num_samples):
        if frequency == 0:  # Rest
            samples.append(0)
        else:
            # Simple sine wave with slight envelope
            t = i / sample_rate
            envelope = min(1.0, (num_samples - i) / (sample_rate * 0.05))  # Fade out at end
            sample = amplitude * envelope * math.sin(2 * math.pi * frequency * t)
            samples.append(sample)

    return samples

def generate_music():
    """Generate the complete music track"""
    beat_duration = 0.25  # Quarter note duration in seconds

    # Generate melody
    melody_samples = []
    for note, beats in MELODY:
        freq = NOTES[note]
        duration = beats * beat_duration
        melody_samples.extend(generate_tone(freq, duration, amplitude=AMPLITUDE * 0.8))

    # Generate bass line (repeat to match melody length)
    bass_samples = []
    bass_duration = sum(beats for _, beats in MELODY) * beat_duration

    current_time = 0
    while current_time < bass_duration:
        for note, beats in BASS:
            if current_time >= bass_duration:
                break
            freq = NOTES[note]
            duration = beats * beat_duration
            bass_samples.extend(generate_tone(freq, duration, amplitude=AMPLITUDE * 0.4))
            current_time += duration

    # Mix melody and bass (truncate to shorter length)
    mixed_samples = []
    min_length = min(len(melody_samples), len(bass_samples))

    for i in range(min_length):
        mixed = melody_samples[i] + (bass_samples[i] if i < len(bass_samples) else 0)
        # Clamp to prevent clipping
        mixed = max(-1.0, min(1.0, mixed))
        mixed_samples.append(mixed)

    return mixed_samples

def save_wav(samples, filename, sample_rate=SAMPLE_RATE):
    """Save samples to a WAV file"""
    with wave.open(filename, 'w') as wav_file:
        # Set WAV file parameters (1 channel, 2 bytes per sample, sample rate)
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)

        # Convert float samples (-1.0 to 1.0) to 16-bit integers
        for sample in samples:
            # Scale to 16-bit range
            value = int(sample * 32767)
            # Pack as signed short (2 bytes)
            data = struct.pack('<h', value)
            wav_file.writeframes(data)

if __name__ == '__main__':
    print("Generating retro game background music...")
    samples = generate_music()

    output_file = 'background.wav'
    save_wav(samples, output_file)

    duration = len(samples) / SAMPLE_RATE
    print(f"Generated {output_file}")
    print(f"Duration: {duration:.2f} seconds")
    print(f"Sample rate: {SAMPLE_RATE} Hz")
    print(f"Samples: {len(samples)}")
    print("\nThis music will loop automatically in the game!")
