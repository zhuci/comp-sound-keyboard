// ADSR and global vars
const globalGainMax = 0.6;
const attackMaxGain = 0.5;
const attackConstant = 0.002;
const attackTime = 0.01;
const decayConstant = 0.002;
const sustainGain = 0.3;
const releaseConstant = 0.01;
const epsilon = 0.001;

document.addEventListener("DOMContentLoaded", function (event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(globalGainMax, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    // for Waveform visualizer
    const globalAnalyser = audioCtx.createAnalyser();
    globalGain.connect(globalAnalyser);
    draw();

    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    var activeOscillators = {}
    var activeGains = {}

    function keyDown(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            playNote(key);
        }
    }

    function keyUp(event) {
        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            // ADSR Release
            activeGains[key].gain.setTargetAtTime(0, audioCtx.currentTime, releaseConstant);

            delete activeOscillators[key];
            delete activeGains[key];
        }
    }

    function playNote(key) {
        const osc = audioCtx.createOscillator();
        var oscType = document.getElementById("osc_Type");
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
        // choose your favorite waveform
        osc.type = document.querySelector('input[name="waveform"]:checked').value;
        // create gain 
        const gainNode = audioCtx.createGain();

        // active oscillators
        var activeOscCount = Object.keys(activeOscillators).length + 1;
        console.log("active count", activeOscCount)

        // adjust for active notes
        Object.values(activeGains).forEach(function (gainNode) {
            gainNode.gain.setTargetAtTime(attackMaxGain / activeOscCount, audioCtx.currentTime, epsilon);
        });

        // ADSR Attack
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
        gainNode.gain.setTargetAtTime(attackMaxGain / activeOscCount, audioCtx.currentTime, attackConstant);

        // ADSR Decay 
        gainNode.gain.setTargetAtTime(sustainGain / activeOscCount, audioCtx.currentTime + attackTime, decayConstant);

        // connect and start
        osc.connect(gainNode).connect(globalGain);
        osc.start();

        activeOscillators[key] = osc
        activeGains[key] = gainNode

        // confetti for fun!
        confettiHelper(key, osc.type);
    }

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function confettiHelper(key, waveform) {

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

        const shapes = ['circle', 'square', 'triangle', 'polygon', 'heart', 'star']
        const randomShapeInd = Math.floor(Math.random() * shapes.length)

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

    // from prof's Waveform visualizer
    function draw() {
        globalAnalyser.fftSize = 2048;
        var bufferLength = globalAnalyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        globalAnalyser.getByteTimeDomainData(dataArray);

        var canvas = document.querySelector("#globalVisualizer");
        var canvasCtx = canvas.getContext("2d");

        requestAnimationFrame(draw);

        globalAnalyser.getByteTimeDomainData(dataArray);

        canvasCtx.fillStyle = "white";
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(31,117,254)";

        canvasCtx.beginPath();

        var sliceWidth = canvas.width * 1.0 / bufferLength;
        var x = 0;

        for (var i = 0; i < bufferLength; i++) {
            var v = dataArray[i] / 128.0;
            var y = v * canvas.height / 2;
            if (i === 0) {
                canvasCtx.moveTo(x, y);
            } else {
                canvasCtx.lineTo(x, y);
            }
            x += sliceWidth;
        }

        canvasCtx.lineTo(canvas.width, canvas.height / 2);
        canvasCtx.stroke();
    }

})
