var audioCtxBB;
var audioCtxR2D2;

var globalGain;
var noiseEnv;
var feedbackDelay;
const startButton = document.getElementById("startButton");
const soundType = document.getElementById("soundType");
const babblingText = document.getElementById("babblingText");
const blog = document.getElementById("blog");

// ADSR and global vars
const globalGainMax = 0.6;
const attackMaxGain = 0.5;
const attackConstant = 0.002;
const attackTime = 0.01;
const decayConstant = 0.002;
const sustainGain = 0.3;
const releaseConstant = 0.01;
const epsilon = 0.001;

soundType.addEventListener("change", function () {
	if (document.getElementById("soundType").value == "babblingBrook") {
		startButton.textContent = "start/stop";
	//   blog.style.display = "none";
	  babblingText.style.display = "block";
	} else {
		startButton.textContent = "play";
	//   blog.style.display = "block";
		babblingText.style.display = "none";
	}
  });
  
startButton.addEventListener('click', function () {
	if (document.getElementById("soundType").value == "babblingBrook") {
		if (!audioCtxBB) {
			startButton.value = "Stop"
			initCreekAudio();
			return;
		}
		else if (audioCtxBB.state === 'suspended') {
			audioCtxBB.resume();
			startButton.value = "Stop"
		}
		else if (audioCtxBB.state === 'running') {
			audioCtxBB.suspend();
			startButton.value = "Start"
		}
	}
	else {
		initR2D2Audio()
	}
}, false);

function createBrownNoise(actx) {
	var bufferSize = 10 * actx.sampleRate,
	noiseBuffer = actx.createBuffer(1, bufferSize, actx.sampleRate),
	output = noiseBuffer.getChannelData(0);

	var lastOut = 0;
	for (var i = 0; i < bufferSize; i++) {
		var brown = Math.random() * 2 - 1;
	
		output[i] = (lastOut + (0.02 * brown)) / 1.02;
		lastOut = output[i];
		output[i] *= 3.5;
	}

	var brownNoise = actx.createBufferSource();
	brownNoise.buffer = noiseBuffer;
	brownNoise.loop = true;
	brownNoise.start(0);

	return brownNoise;
}

function initCreekAudio() {
    audioCtxBB = new AudioContext();
	globalGain = audioCtxBB.createGain();
	globalGain.gain.value = 0.1;
	globalGain.connect(audioCtxBB.destination);

	var lpf1 = audioCtxBB.createBiquadFilter();
	lpf1.type = "lowpass";
	lpf1.frequency.value = 400;

	/* 
	from SuperCollider
	{RHPF.ar(
		LPF.ar(BrownNoise.ar(), 400), 
		LPF.ar(BrownNoise.ar(), 14) * 400 + 500, 
		0.03, 
		0.1)
	}.play
	*/

	var lpf2 = audioCtxBB.createBiquadFilter();
	lpf2.type = "lowpass";
	lpf2.frequency.value = 14;

	var rhpf = audioCtxBB.createBiquadFilter();
	rhpf.type = "highpass";
	// rhpf.Q.value = 33.33;
	rhpf.Q.value = 33.33;
	rhpf.frequency.value = 500;

	var gain1 = audioCtxBB.createGain();
	gain1.gain.value = 1500;

	var brownNoise1 = createBrownNoise(audioCtxBB);
	var brownNoise2 = createBrownNoise(audioCtxBB);
	
	brownNoise2.connect(lpf2).connect(gain1).connect(rhpf.frequency);
	brownNoise1.connect(lpf1).connect(rhpf).connect(globalGain);
}

function initR2D2Audio() {
	audioCtxR2D2 = new AudioContext();
	globalGain = audioCtxR2D2.createGain();
	globalGain.gain.value = 0.2;
	globalGain.connect(audioCtxR2D2.destination);

	var i = 0;
	var curTime = audioCtxR2D2.currentTime;
	while (i < 1000) {
		var randPeriod = getRandomFloat(0, 0.25)
		var randCarrierFreq = getRandomFloat(500, 2000.0)
		var randModFreq = getRandomFloat(1, 1000.0)
		var randModIndex =  getRandomFloat(1, 1000.0)
		var randWaveform = getRandomInt(0,3)
		FMPlayNote(curTime, curTime + randPeriod, randCarrierFreq, randModFreq, randModIndex, randWaveform)
		i++;
		curTime += randPeriod;
	}
}
    

function FMPlayNote(startTime, stopTime, carrierFreq, modFreq, modIndex, waveformType) { 
	var gainNode;
	var waveforms = ['sine', 'sawtooth', 'square', 'triangle']

	var carrier = audioCtxR2D2.createOscillator();
	var modulatorFreq = audioCtxR2D2.createOscillator();
	modulatorFreq.type = waveforms[waveformType];
	carrier.type = waveforms[waveformType];
	modulatorFreq.frequency.value = modFreq;
	carrier.frequency.value = carrierFreq;

	var modulationIndex = audioCtxR2D2.createGain();
	modulationIndex.gain.value = modIndex;

	// activeOscillators[key] = carrier
	// activeFMOscs[key] = modulatorFreq

	// create gain, ADSR A and D
	gainNode = gainAttackDecay()

	modulatorFreq.connect(modulationIndex);
	modulationIndex.connect(carrier.frequency)

	carrier.connect(gainNode);
	gainNode.connect(globalGain)

	carrier.start(startTime);
	modulatorFreq.start(startTime);
	carrier.stop(stopTime);
	modulatorFreq.stop(stopTime);
	
	carrier.stop

// activeGains[key] = gainNode
}

function gainAttackDecay() {
	// create gain 
	const gainNode = audioCtxR2D2.createGain();

	// // active Osc
	// var activeOscCount = Object.keys(activeOscillators).length + Object.keys(activeAMOscs).length + Object.keys(activeFMOscs).length;
	// for (let k in activeAdditiveOscs) {
	//     activeOscCount += activeAdditiveOscs[k].length  
	// }

	// // adjust for active notes
	// Object.values(activeGains).forEach(function (gainNode) {
	//     gainNode.gain.setTargetAtTime(attackMaxGain / activeOscCount, audioCtx.currentTime, epsilon);
	// });

	// ADSR Attack
	gainNode.gain.setValueAtTime(0.001, audioCtxR2D2.currentTime);
	gainNode.gain.setTargetAtTime(attackMaxGain, audioCtxR2D2.currentTime, attackConstant);

	// ADSR Decay 
	gainNode.gain.setTargetAtTime(sustainGain, audioCtxR2D2.currentTime + attackTime, decayConstant);

	return gainNode
}

function getRandomFloat(min, max) {
	return Math.random() * (max - min) + min;
  }
  
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}