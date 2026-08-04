
const PAINTINGS = [
  ['starry','The Starry Night','Vincent van Gogh','#92c9ff','Dance of the Sugar Plum Fairy — The Nutcracker','https://commons.wikimedia.org/wiki/Special:Redirect/file/Dance_of_the_Sugar_Plum_Fairies_(ISRC_USUAN1100270).mp3'],
  ['water-lilies','Water Lilies','Claude Monet','#a9dfbd','Waltz of the Flowers — The Nutcracker','https://upload.wikimedia.org/wikipedia/commons/e/e4/P.I._Tchaikovsky%27s_Waltz_of_the_Flowers_Performed_by_The_U.S._Army_Band%2C_c._2019.mp3'],
  ['sunflowers','Sunflowers','Vincent van Gogh','#ffe177','Russian Dance (Trepak) — The Nutcracker','https://upload.wikimedia.org/wikipedia/commons/7/7a/Tchaikovsky_-_Nutcracker_Suite_-_Russian_Dance_-_Philip_Milman_-_Lud_and_Schlatts_Musical_Emporium.wav'],
  ['great-wave','The Great Wave','Katsushika Hokusai','#9bdcf2','Waltz — Swan Lake','https://upload.wikimedia.org/wikipedia/commons/b/bb/Tchaikovsky_Swan_Lake_Op.20_No.2.Waltz.ogg'],
  ['two-sisters','Two Sisters','Pierre-Auguste Renoir','#ffa88e','Overture — The Sleeping Beauty','https://upload.wikimedia.org/wikipedia/commons/4/43/Tchaikovsky_-_%D0%A1%D0%BF%D1%8F%D1%89%D0%B0%D1%8F_%D0%BA%D1%80%D0%B0%D1%81%D0%B0%D0%B2%D0%B8%D1%86%D0%B0_-_Sleeping_Beauty_ouverture.ogg'],
  ['ballet-class','The Ballet Class','Edgar Degas','#efbdd5','Giselle, Act I — Giselle','https://commons.wikimedia.org/wiki/Special:Redirect/file/Giselle,_or_The_Wilis_by_Adolphe_Adam_act_1.ogg'],
  ['dancers-pink','Dancers in Pink','Edgar Degas','#f4b3cc','Dance of the Sugar Plum Fairy — The Nutcracker','https://commons.wikimedia.org/wiki/Special:Redirect/file/Dance_of_the_Sugar_Plum_Fairies_(ISRC_USUAN1100270).mp3'],
  ['bougival','Dance at Bougival','Pierre-Auguste Renoir','#c9eacb','Waltz of the Flowers — The Nutcracker','https://upload.wikimedia.org/wikipedia/commons/e/e4/P.I._Tchaikovsky%27s_Waltz_of_the_Flowers_Performed_by_The_U.S._Army_Band%2C_c._2019.mp3'],
  ['el-jaleo','El Jaleo','John Singer Sargent','#f2d36f','Russian Dance (Trepak) — The Nutcracker','https://upload.wikimedia.org/wikipedia/commons/7/7a/Tchaikovsky_-_Nutcracker_Suite_-_Russian_Dance_-_Philip_Milman_-_Lud_and_Schlatts_Musical_Emporium.wav']
].map(x => ({id:x[0],title:x[1],artist:x[2],color:x[3],track:x[4],audio:x[5],image:`paintings/${x[0]}.jpg`}));

const byId = Object.fromEntries(PAINTINGS.map(p => [p.id,p]));
const rail = document.querySelector('#rail');
const video = document.querySelector('video');
const panel = document.querySelector('.camera');
const status = document.querySelector('#status');
const canvas = document.querySelector('canvas');
const show = document.querySelector('#show');
const art = document.querySelector('#art');
let stream = null, scanTimer = null, audio = null, audioContext = null;

PAINTINGS.forEach(p => {
  const button = document.createElement('button');
  button.className = 'tile';
  button.innerHTML = `<img src="${p.image}" alt=""><b>${p.title}</b><small>${p.artist}</small>`;
  button.onclick = () => reveal(p);
  rail.append(button);
});

async function toggleCamera() {
  if (stream) { stopCamera(); return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false});
    video.srcObject = stream;
    await video.play();
    panel.classList.add('live');
    status.textContent = 'Find the small SCAN ME square on a painting page';
    scan();
  } catch (error) {
    status.textContent = 'Camera blocked. In Safari Website Settings, set Camera to Allow.';
  }
}

function scan() {
  if (!stream || !show.hidden) return;
  if (!window.jsQR || !video.videoWidth) { scanTimer = setTimeout(scan,400); return; }
  const width = Math.min(900,video.videoWidth);
  const height = Math.round(width * video.videoHeight / video.videoWidth);
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d',{willReadFrequently:true});
  context.drawImage(video,0,0,width,height);
  const pixels = context.getImageData(0,0,width,height);
  const result = jsQR(pixels.data,width,height,{inversionAttempts:'attemptBoth'});
  if (result && result.data.startsWith('PAINTING:')) {
    const painting = byId[result.data.slice(9)];
    if (painting) { reveal(painting); return; }
  }
  status.textContent = 'Looking for the SCAN ME square… move closer if needed';
  scanTimer = setTimeout(scan,350);
}

function stopCamera() {
  stream?.getTracks().forEach(track => track.stop());
  stream = null;
  clearTimeout(scanTimer);
  panel.classList.remove('live');
  status.textContent = 'Tap the camera screen to begin';
}

function reveal(p) {
  clearTimeout(scanTimer);
  show.hidden = false;
  show.style.setProperty('--a',p.color);
  document.querySelector('#title').textContent = p.title;
  document.querySelector('#artist').textContent = `${p.artist} · ${p.track}`;
  art.innerHTML = `<img class="alive-painting" src="${p.image}" alt="${p.title}"><div class="sparkles">✦ · ✧ · ✦</div>`;
  playMusic(p);
  const replay = document.querySelector('#variation');
  replay.textContent = 'Play from beginning';
  replay.onclick = () => playMusic(p);
}

function playMusic(p) {
  if (audio) { audio.pause(); audio.removeAttribute('src'); }
  audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.src = p.audio;
  audio.loop = true;
  audio.volume = 1;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaElementSource(audio);
    const gain = audioContext.createGain();
    gain.gain.value = 2.2;
    source.connect(gain).connect(audioContext.destination);
    audioContext.resume();
  } catch (error) {}
  audio.play().catch(() => document.querySelector('#variation').textContent = 'Tap to play music');
}

panel.onclick = toggleCamera;
panel.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') toggleCamera(); };
document.querySelector('#close').onclick = () => {
  show.hidden = true;
  audio?.pause();
  if (stream) { status.textContent = 'Camera is still on — scan another marker'; scan(); }
};

