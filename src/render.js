const { desktopCapturer, remote } = require('electron');
const { writeFile, readFileSync } = require("fs");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const openBtn = document.getElementById("openBtn");
const videoSelectBtn = document.getElementById('videoSelectBtn');
const videoElement = document.querySelector("video");


const { Menu } = remote
const { dialog } = remote;

let mediaRecorder;
const recordedChunks = [];

async function getVideoSources(){
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });
  console.log( 'inputSources', inputSources );
  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map( source => ({
      label: source.name,
      click: () => selectSource(source)
    }))
  )
  videoOptionsMenu.popup();
}

// Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();
}

async function selectSource(source) {

  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices
    .getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}


// Saves the video file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9"
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: "Save video",
    defaultPath: `vid-${Date.now()}.webm`
  });

  writeFile(filePath, buffer, () => console.log(`Video saved successfully in ${filePath}!`));
}


// Captures all recorded chunks
function handleDataAvailable(e) {
  console.log("Video has been recorded!");
  recordedChunks.push(e.data);
}

startBtn.onclick = e => {
  startBtn.classList.add("is-danger");
  if ( mediaRecorder ) {
    mediaRecorder.start();
    startBtn.innerText = "Recording";
  } else {
    videoElement.play()
    startBtn.innerText = "Playing";
  }
};

stopBtn.onclick = e => {
  if ( mediaRecorder ) {
    mediaRecorder.stop();
    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Старт";
  } else {
    videoElement.pause()
  }
};

videoSelectBtn.onclick = getVideoSources;

openBtn.onclick = e => {
  dialog.showOpenDialog({ properties: ['openFile']})
  .then(( path )=> {
    mediaRecorder = null;
    const file = readFileSync(path.filePaths[0]);
    const fileURL = URL.createObjectURL(new Blob([file]));
    videoElement.srcObject = null;
    videoElement.src = fileURL;
  } );
}
