document.addEventListener("DOMContentLoaded", function (event) {

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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

    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(0.8, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    activeOscillators = {}
    activeGains = {}

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
            activeGains[key].gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            activeGains[key].gain.setTargetAtTime(0, audioCtx.currentTime + 0.25, 0.05);

            // activeOscillators[key].stop();
            delete activeOscillators[key];
        }
    }

    function playNote(key) {
        const osc = audioCtx.createOscillator();
        var oscType = document.getElementById("osc_Type");
        osc.frequency.setValueAtTime(keyboardFrequencyMap[key], audioCtx.currentTime);
        // choose your favorite waveform
        osc.type = oscType.value;
        // create gain 
        const gainNode = audioCtx.createGain();
        gainNode.connect(globalGain);
        osc.connect(gainNode);
        osc.start();

        // ADSR Attack
        gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.799, audioCtx.currentTime + 0.1);
        // gainNode.gain.setTargetAtTime(0.8, audioCtx.currentTime + 0.1, 0.1);

        // ADSR Decay 
        // gainNode.gain.exponentialRampToValueAtTime(0.599, audioCtx.currentTime + 0.2);
        gainNode.gain.setTargetAtTime(0.6, audioCtx.currentTime + 0.1, 0.1);

        activeOscillators[key] = osc
        activeGains[key] = gainNode
    }

    // draw
    // function draw() {
    //     globalAnalyser.fftSize = 2048;
    //     var bufferLength = globalAnalyser.frequencyBinCount;
    //     var dataArray = new Uint8Array(bufferLength);
    //     globalAnalyser.getByteTimeDomainData(dataArray);

    //     var canvas = document.querySelector("#globalVisualizer");
    //     var canvasCtx = canvas.getContext("2d");

    //     requestAnimationFrame(draw);

    //     globalAnalyser.getByteTimeDomainData(dataArray);

    //     canvasCtx.fillStyle = "white";
    //     canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    //     canvasCtx.lineWidth = 2;
    //     canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    //     canvasCtx.beginPath();

    //     var sliceWidth = canvas.width * 1.0 / bufferLength;
    //     var x = 0;

    //     for (var i = 0; i < bufferLength; i++) {
    //         var v = dataArray[i] / 128.0;
    //         var y = v * canvas.height / 2;
    //         if (i === 0) {
    //             canvasCtx.moveTo(x, y);
    //         } else {
    //             canvasCtx.lineTo(x, y);
    //         }
    //         x += sliceWidth;
    //     }

    //     canvasCtx.lineTo(canvas.width, canvas.height / 2);
    //     canvasCtx.stroke();
    // }

})
