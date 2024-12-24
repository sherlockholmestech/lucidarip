import { lucidaClient } from "./lucida.js";
import lucidaripConfig from "./lucida.js";
import { downloadAlbum, downloadArtist, downloadPlaylist, downloadTrack } from "./download.js";

console.log(`Downloading to: ${lucidaripConfig.music_dir}`);

const url = process.argv[2];

if (!url) {
	console.error("No URL provided.  Accepted URLs are album, playlist, and artist URLs.  Currently support Qobuz, Tidal, and Deezer.");
	process.exit(1);
}

// Check if URL is an album, playlist, or artist
const urlInfo = await lucidaClient.getByUrl(url);

if (urlInfo.type === "album") {
	await downloadAlbum(url, lucidaripConfig.music_dir);
} else if (urlInfo.type === "playlist") {
	await downloadPlaylist(url, lucidaripConfig.music_dir);
} else if (urlInfo.type === "artist") {
	await downloadArtist(url, lucidaripConfig.music_dir);
} else if (urlInfo.type === "track") {
	await downloadTrack(url, lucidaripConfig.music_dir);
} else {
	console.error("Invalid URL.  Accepted URLs are album, playlist, and artist URLs.  Currently support Qobuz, Tidal, and Deezer.");
	process.exit(1);
}