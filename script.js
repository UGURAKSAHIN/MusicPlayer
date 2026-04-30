const coverImage = document.getElementById("cover");
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
const volumeToggleBtn = document.getElementById("volume-toggle");
const volumeSlider = document.getElementById("volume-slider");
const playlist = document.getElementById("playlist");
const playIcon = playBtn.querySelector("i");
const volumeIcon = volumeToggleBtn.querySelector("i");

const STORAGE_KEY = "musicPlayerState";
const DEFAULT_VOLUME = 0.75;

const music = new Audio();
music.preload = "metadata";

const songs = [
    {
        displayName: "Sigara",
        path: "music/Sebnem-Ferah-Sigara.mp3",
        artist: "Şebnem Ferah",
        image: "images/Sebnem-Ferah.png",
    },
    {
        displayName: "Tutamıyorum Zamanı",
        path: "music/muslum-gurses-tutamiyorum-zamani.mp3",
        artist: "Müslüm Gürses",
        image: "images/MüslümGürses.webp",
    },
    {
        displayName: "Shape Of You",
        path: "music/Ed_Sheeran_-_Shape_of_You.mp3",
        artist: "Ed Sheeran",
        image: "images/EdSheeran.jpg",
    },
];

const savedState = loadSavedState();

let musicIndex = getValidSongIndex(savedState.musicIndex);
let isShuffle = Boolean(savedState.isShuffle);
let isRepeat = Boolean(savedState.isRepeat);
let previousVolume = normalizeVolume(savedState.previousVolume, DEFAULT_VOLUME);
let loadToken = 0;
let progressFrame = null;

function loadSavedState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
}

function saveState() {
    const state = {
        musicIndex,
        isShuffle,
        isRepeat,
        volume: music.volume,
        isMuted: music.muted,
        previousVolume,
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Player should keep working even if browser storage is unavailable.
    }
}

function normalizeVolume(value, fallback = DEFAULT_VOLUME) {
    const volume = Number(value);

    if (!Number.isFinite(volume)) {
        return fallback;
    }

    return Math.min(Math.max(volume, 0), 1);
}

function getValidSongIndex(index) {
    const songIndex = Number(index);

    if (!Number.isInteger(songIndex) || songIndex < 0 || songIndex >= songs.length) {
        return 0;
    }

    return songIndex;
}

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
        return "0:00";
    }

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

function updatePlayButton(isPlaying) {
    playIcon.classList.toggle("fa-play", !isPlaying);
    playIcon.classList.toggle("fa-pause", isPlaying);

    const label = isPlaying ? "Pause" : "Play";
    playBtn.title = label;
    playBtn.setAttribute("aria-label", label);
}

function updateToggleButton(button, isActive) {
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
}

function updatePlaylist() {
    const playlistButtons = playlist.querySelectorAll(".playlist-song");

    playlistButtons.forEach((button, index) => {
        const isCurrent = index === musicIndex;
        button.classList.toggle("active", isCurrent);
        button.setAttribute("aria-current", isCurrent ? "true" : "false");
    });
}

function renderPlaylist() {
    playlist.innerHTML = "";

    songs.forEach((song, index) => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        const cover = document.createElement("img");
        const text = document.createElement("span");
        const songName = document.createElement("span");
        const songArtist = document.createElement("span");

        button.type = "button";
        button.className = "playlist-song";
        button.setAttribute("aria-label", `Play ${song.displayName}`);
        button.addEventListener("click", () => selectSong(index));

        cover.src = song.image;
        cover.alt = "";
        cover.loading = "lazy";
        cover.decoding = "async";

        text.className = "playlist-song-text";
        songName.className = "playlist-song-title";
        songArtist.className = "playlist-song-artist";
        songName.textContent = song.displayName;
        songArtist.textContent = song.artist;

        text.append(songName, songArtist);
        button.append(cover, text);
        item.append(button);
        playlist.append(item);
    });

    updatePlaylist();
}

function updateProgressBar() {
    const duration = music.duration;
    const currentTime = music.currentTime;
    const progressPercent = Number.isFinite(duration) && duration > 0
        ? Math.min((currentTime / duration) * 100, 100)
        : 0;

    progress.style.width = `${progressPercent}%`;
    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
}

function requestProgressUpdate() {
    if (progressFrame) {
        return;
    }

    progressFrame = requestAnimationFrame(() => {
        progressFrame = null;
        updateProgressBar();
    });
}

function updateVolumeUI() {
    const effectiveVolume = music.muted ? 0 : music.volume;
    const iconClass = effectiveVolume === 0
        ? "fa-volume-xmark"
        : effectiveVolume < 0.5
            ? "fa-volume-low"
            : "fa-volume-high";
    const label = effectiveVolume === 0 ? "Unmute" : "Mute";

    volumeIcon.className = `fa-solid ${iconClass}`;
    volumeSlider.value = String(effectiveVolume);
    volumeSlider.style.setProperty("--volume-progress", `${effectiveVolume * 100}%`);
    volumeToggleBtn.title = label;
    volumeToggleBtn.setAttribute("aria-label", label);
    volumeToggleBtn.setAttribute("aria-pressed", String(effectiveVolume === 0));
}

function setVolume(volume, options = {}) {
    const nextVolume = normalizeVolume(volume);

    music.volume = nextVolume;
    music.muted = options.muted ?? nextVolume === 0;

    if (nextVolume > 0) {
        previousVolume = nextVolume;
    }

    updateVolumeUI();
    saveState();
}

function toggleMute() {
    if (music.muted || music.volume === 0) {
        setVolume(previousVolume || DEFAULT_VOLUME, { muted: false });
        return;
    }

    previousVolume = music.volume;
    music.muted = true;
    updateVolumeUI();
    saveState();
}

async function setPlaying(shouldPlay) {
    if (shouldPlay) {
        updatePlayButton(true);

        try {
            await music.play();
        } catch (error) {
            updatePlayButton(false);
            console.warn("Playback could not start:", error);
        }

        return;
    }

    music.pause();
    updatePlayButton(false);
}

function togglePlay() {
    setPlaying(music.paused);
}

async function loadMusic(song) {
    const token = ++loadToken;

    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    updateProgressBar();
    updatePlaylist();
    saveState();

    const nextCover = new Image();
    nextCover.src = song.image;
    await nextCover.decode().catch(() => {});

    if (token !== loadToken) {
        return;
    }

    coverImage.src = nextCover.src;
    bgImage.src = nextCover.src;
}

function getNextIndex(direction) {
    if (!isShuffle || songs.length < 2) {
        return (musicIndex + direction + songs.length) % songs.length;
    }

    let nextIndex = musicIndex;

    while (nextIndex === musicIndex) {
        nextIndex = Math.floor(Math.random() * songs.length);
    }

    return nextIndex;
}

function changeMusic(direction) {
    musicIndex = getNextIndex(direction);
    loadMusic(songs[musicIndex]);
    setPlaying(true);
}

function selectSong(index) {
    if (index === musicIndex) {
        setPlaying(true);
        return;
    }

    musicIndex = index;
    loadMusic(songs[musicIndex]);
    setPlaying(true);
}

function setProgressBar(event) {
    const duration = music.duration;

    if (!Number.isFinite(duration) || duration <= 0) {
        return;
    }

    const { left, width } = playerProgress.getBoundingClientRect();
    const clickPosition = Math.min(Math.max(event.clientX - left, 0), width);

    music.currentTime = (clickPosition / width) * duration;
    updateProgressBar();
}

function initializePlayer() {
    const savedVolume = normalizeVolume(savedState.volume);

    music.volume = savedVolume;
    music.muted = Boolean(savedState.isMuted) && savedVolume > 0;

    renderPlaylist();
    updateToggleButton(shuffleBtn, isShuffle);
    updateToggleButton(repeatBtn, isRepeat);
    updateVolumeUI();
    loadMusic(songs[musicIndex]);
}

playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => changeMusic(-1));
nextBtn.addEventListener("click", () => changeMusic(1));

shuffleBtn.addEventListener("click", () => {
    isShuffle = !isShuffle;
    updateToggleButton(shuffleBtn, isShuffle);
    saveState();
});

repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    updateToggleButton(repeatBtn, isRepeat);
    saveState();
});

volumeToggleBtn.addEventListener("click", toggleMute);
volumeSlider.addEventListener("input", (event) => {
    setVolume(event.target.value, { muted: false });
});

music.addEventListener("play", () => updatePlayButton(true));
music.addEventListener("pause", () => updatePlayButton(false));
music.addEventListener("loadedmetadata", updateProgressBar);
music.addEventListener("timeupdate", requestProgressUpdate);
music.addEventListener("volumechange", updateVolumeUI);
music.addEventListener("ended", () => {
    if (isRepeat) {
        music.currentTime = 0;
        setPlaying(true);
        return;
    }

    changeMusic(1);
});

playerProgress.addEventListener("click", setProgressBar);

initializePlayer();
