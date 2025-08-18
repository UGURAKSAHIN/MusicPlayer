const image = document.getElementById("cover");
const bgImage = document.getElementById("bg-img");
const title = document.getElementById("music-title");
const artist = document.getElementById("music-artist");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const progress = document.getElementById("progress");
const playerProgress = document.getElementById("player-progress");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const playBtn = document.getElementById("play");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

const music = new Audio();

const songs = [
    { displayName: "Sigara", path: "music/Sebnem-Ferah-Sigara.mp3", artist: "Şebnem Ferah", image: "images/Sebnem-Ferah.png" },
    { displayName: "Tutamıyorum Zamanı", path: "music/muslum-gurses-tutamiyorum-zamani.mp3", artist: "Müslüm Gürses", image: "images/MüslümGürses.webp" },
    {displayName: "Shape Of You", path: "music/Ed_Sheeran_-_Shape_of_You.mp3", artist: "Ed Sheeran", image: "images/EdSheeran.jpg"}
];

let musicIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let lastUpdate = 0;


function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60) || 0;
    const secs = Math.floor(seconds % 60) || 0;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function updatePlayButton(isPlaying) {
    const icon = playBtn.querySelector("i");
    if (isPlaying) {
        icon.classList.replace("fa-play", "fa-pause");
        playBtn.setAttribute("title", "Pause");
    } else {
        icon.classList.replace("fa-pause", "fa-play");
        playBtn.setAttribute("title", "Play");
    }
}
function toggleActive(btn, isActive){
    btn.classList.toggle("active", isActive);
}

function togglePlay() {
    isPlaying ? pauseMusic() : playMusic();
}

function playMusic() {
    isPlaying = true;
    updatePlayButton(true);
    music.play();
}

function pauseMusic() {
    isPlaying = false;
    updatePlayButton(false);
    music.pause();
}

async function loadMusic(song) {
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;

    const cover = new Image();
    cover.src = song.image;
    await cover.decode().catch(() => {});
    image.src = cover.src;
    bgImage.src = cover.src;
}

function changeMusic(direction) {
    if(isShuffle){
        musicIndex = Math.floor(Math.random() * songs.length);
    }else{
        musicIndex = (musicIndex + direction + songs.length) % songs.length;
    }
    loadMusic(songs[musicIndex]);
    playMusic(); 
}

function updateProgressBar() {
    if (!music.duration)return;
    const currentTime = Date.now();
    if (currentTime - lastUpdate > 200) {
        const progressPercent = (music.currentTime / music.duration) * 100;
        progress.style.width = `${progressPercent}%`;
        durationEl.textContent = formatTime(music.duration);
        currentTimeEl.textContent = formatTime(music.currentTime);
        lastUpdate = currentTime;
    }
}

function setProgressBar(e) {
    const width = playerProgress.clientWidth;
    const clickX = e.offsetX;
    music.currentTime = (clickX / width) * music.duration;
}

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => changeMusic(-1));
nextBtn.addEventListener("click", () => changeMusic(1));

shuffleBtn.addEventListener("click", ()=>{
    isShuffle = !isShuffle;
    toggleActive(shuffleBtn, isShuffle);
});

repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    toggleActive(repeatBtn, isRepeat);
});
music.addEventListener("ended", () =>{

    if(isRepeat){
        playMusic();
    }else{
        changeMusic(1);
    }
});
playerProgress.addEventListener("click", setProgressBar);
music.addEventListener("timeupdate", updateProgressBar);

loadMusic(songs[musicIndex]);
