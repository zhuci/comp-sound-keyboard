// functions for confetti

function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function confettiHelper(key, waveform) {

    const keyToNoteLetter = {
        '90': 'C',  //Z - C
        '83': 'C', //S - C#
        '88': 'D',  //X - D
        '68': 'D', //D - D#
        '67': 'E',  //C - E
        '86': 'F',  //V - F
        '71': 'F', //G - F#
        '66': 'G',  //B - G
        '72': 'G', //H - G#
        '78': 'A',  //N - A
        '74': 'A', //J - A#
        '77': 'B',  //M - B
        '81': 'C',  //Q - C
        '50': 'C', //2 - C#
        '87': 'D',  //W - D
        '51': 'D', //3 - D#
        '69': 'E',  //E - E
        '82': 'F',  //R - F
        '53': 'F', //5 - F#
        '84': 'G',  //T - G
        '54': 'G', //6 - G#
        '89': 'A',  //Y - A
        '55': 'A', //7 - A#
        '85': 'B',  //U - B
    }

    const NoteLetterToColors = {
        'A': ['FFC0CB', 'FF69B4', 'FF1493', 'C71585', 'FF00FF'], // Pink
        'B': ['660000', '800020', 'FF0800', 'C51E3A', '960018'], // Red
        'C': ['FF4F00', 'FF7F50', 'F04A00', 'E25822', 'FF5800'],  // Orange
        'D': ['FFEF00', 'FFD700', 'FADA5E', 'ffd800', 'FFCC33'], // Yellow
        'E': ['007FFF', '3457D5', '246BCE', '6495ED', 'B9D9EB'], // Blue
        'F': ['ACE1AF', '177245', '50C878', '00693E', '00A86B'], // Green
        'G': ['B284BE', '8A2BE2', '9400D3', '8F00FF', '8806CE'] // Violet
    }
    const noteLetter = keyToNoteLetter[key]
    const curColorScheme = NoteLetterToColors[noteLetter]


    const WaveformToShape = {
        'sine': ['star'],
        'sawtooth': ['polygon'],
        'square': ['square'],
        'triangle': ['triangle']
    }

    const defaults = {
        spread: 360,
        ticks: 50,
        gravity: 0,
        decay: 0.94,
        startVelocity: randomInRange(10, 40),
    };


    confetti({
        ...defaults,
        shapes: WaveformToShape[waveform],
        colors: curColorScheme,
        particleCount: randomInRange(25, 75),
        origin: { x: randomInRange(0, 1), y: randomInRange(0, 1) },

    });
}
