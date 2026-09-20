import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let player: AudioPlayer | null = null;

function getPlayer() {
  if (!player) {
    setAudioModeAsync({ shouldPlayInBackground: true, playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    player = createAudioPlayer(require('../../assets/sounds/rain.wav'));
    player.loop = true;
    player.volume = 0.6;
  }
  return player;
}

export function setRain(playing: boolean) {
  const p = getPlayer();
  if (playing && !p.playing) p.play();
  if (!playing && p.playing) p.pause();
}
