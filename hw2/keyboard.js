import { confettiHelper } from "./confetti.js";


// ADSR and global vars
const globalGainMax = 0.6;
const attackMaxGain = 0.5;
const attackConstant = 0.002;
const attackTime = 0.01;
const decayConstant = 0.002;
const sustainGain = 0.3;
const releaseConstant = 0.01;
const epsilon = 0.001;

export const keyboardFrequencyMap = {
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

sliders()


document.addEventListener("DOMContentLoaded", function (event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const globalGain = audioCtx.createGain(); //this will control the volume of all notes
    globalGain.gain.setValueAtTime(globalGainMax, audioCtx.currentTime)
    globalGain.connect(audioCtx.destination);

    // for Waveform visualizer
    const globalAnalyser = audioCtx.createAnalyser();
    globalGain.connect(globalAnalyser);
    draw();

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);

    var activeOscillators = {}
    var activeAdditiveOscs = {}
    var activeAMOscs = {}
    var activeFMOscs = {}
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
            delete activeAdditiveOscs[key];
            delete activeGains[key];
        }
    }

    function playNote(key) {
        var waveformType = document.querySelector('input[name="waveform"]:checked').value
        var synthType =  document.querySelector('input[name="synthesis"]:checked').value
        
        console.log("synth", document.querySelector('input[name="synthesis"]:checked').value);

        console.log("partials", document.getElementById("additivePartials").value);


        var gainNode;
        var curFreq = keyboardFrequencyMap[key]

        if (synthType == "additive") {
            const osc = audioCtx.createOscillator();
           
            // default osc
            osc.frequency.setValueAtTime(curFreq, audioCtx.currentTime);
            osc.type = waveformType;
            activeOscillators[key] = osc;

            var maxPartial = parseInt(additivePartialsSlider.value) + 1;
            var newOscs = [];

            // partial osc
            for (let i = 2; i < maxPartial; i++) {
                var curOsc = audioCtx.createOscillator();
                var randSign = Math.random() < 0.5 ? -1 : 1;
                var additiveRandRange = curFreq * parseInt(additiveRandSlider.value) / 100
                console.log("aas", additiveRandRange, curFreq, parseInt(additiveRandSlider.value))
                curOsc.frequency.value = (i * curFreq) + randSign * Math.random() * additiveRandRange;
                curOsc.type = waveformType;
                newOscs.push(curOsc)
            } 
            activeAdditiveOscs[key] = newOscs;

            // create gain, ADSR A and D
            gainNode = gainAttackDecay()
            // // connect and start
            osc.connect(gainNode).connect(globalGain);
            osc.start();

            for (let i in newOscs) {
                newOscs[i].connect(gainNode)
                newOscs[i].start();
            }

        } else { // no synthesis, normal from hw 1
            const osc = audioCtx.createOscillator();
            osc.frequency.setValueAtTime(curFreq, audioCtx.currentTime);
            // choose your favorite waveform
            osc.type = waveformType;
            activeOscillators[key] = osc

            // create gain, ADSR A and D
            gainNode = gainAttackDecay()
            // // connect and start
            osc.connect(gainNode).connect(globalGain);
            osc.start();
        }
        
        activeGains[key] = gainNode

        // confetti for fun!
        confettiHelper(key, waveformType);
    }

    function gainAttackDecay() {
        // create gain 
        const gainNode = audioCtx.createGain();

        // active Osc
        var activeOscCount = Object.keys(activeOscillators).length;
        for (let k in activeAdditiveOscs) {
            activeOscCount += activeAdditiveOscs[k].length  
        }
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
        
        return gainNode
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

// sliders and values
function sliders() {
    var additivePartialsSlider = document.getElementById("additivePartials");
    var additivePartialOutput = document.getElementById("additivePartialsValue");
    additivePartialOutput.innerHTML = additivePartialsSlider.value;

    additivePartialsSlider.oninput = function() {
        additivePartialOutput.innerHTML = this.value;
    }

    var additiveRandSlider = document.getElementById("additiveRand");
    var additiveRandOutput = document.getElementById("additiveRandValue");
    additiveRandOutput.innerHTML = additiveRandSlider.value;

    additiveRandSlider.oninput = function() {
        additiveRandOutput.innerHTML = this.value + '%';
    }
}