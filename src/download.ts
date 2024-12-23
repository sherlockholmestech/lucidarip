import { lucidaClient } from "./lucida.js";
import fs from "node:fs";
import { type FlacTagMap, writeFlacTags } from 'flac-tagger'

export async function downloadTrack(url: string, folder: string) {
  const track = await lucidaClient.getByUrl(url);

  // Get 2 digit track number
  const twoDigitTrackNumber = track.metadata.trackNumber.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});

  // Get array of artist names
  const artistNames = track.metadata.artists.map((artist) => artist.name)

  // Create artist string
  const artistNamesString = artistNames.join(", ");

  // Get Album Artists
  let albumArtists = artistNames;

  // Check if there are album artists
  if (track.metadata.album.artists && track.metadata.album.artists.length > 0) {
    albumArtists = track.metadata.album.artists.map((artist) => artist.name);
  }

  // Get year of release
  let releaseYear = new Date(track.metadata.album.releaseDate).getUTCFullYear();

  // Create album artist string
  let albumArtistsString = albumArtists.join(", ");

  // Check if there is more than one disk in the album
  let albumInfo = await lucidaClient.getByUrl(track.metadata.album.url);

  if (albumInfo.tracks[albumInfo.tracks.length -1].discNumber > 1) {
    // Create folder structure
    await fs.promises.mkdir(`${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/CD${track.metadata.discNumber}`, { recursive: true });
    console.log(`Downloading track: ${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/CD${track.metadata.discNumber}/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac`);
    // Download track
    await fs.promises.writeFile(`${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/CD${track.metadata.discNumber}/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac`, (await track.getStream()).stream);
  } else {
    // Create folder structure
    await fs.promises.mkdir(`${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})`, { recursive: true });
    console.log(`Downloading track: ${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac`);
    // Download track
    await fs.promises.writeFile(`${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac`, (await track.getStream()).stream);
  }
  // Get cover image
  let coverImage = null;
  const coverRequest = await fetch(track.metadata.album.coverArtwork[track.metadata.album.coverArtwork.length - 1].url).then(async (response) => {
    await response.bytes().then((buffer) => {
    coverImage = buffer;
    });
  }).catch((err) => {
      console.error(err);
  });

  // Write FLAC tags, console.log depending on if there is more than one disk in the album
  console.log(`Writing tags to: ${albumInfo.tracks[albumInfo.tracks.length -1].discNumber > 1 ? `${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/CD${track.metadata.discNumber}/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac` : `${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac`}`);

  // write vorbis comments (names are case-insensitive)
  const tagMap: FlacTagMap = {
    // single value
    title: track.metadata.title,
    artist: artistNames,
    album: track.metadata.album.title,
    albumartist: albumArtists,
    copyright: track.metadata.copyright,
    label: track.metadata.album.label,
    upc: track.metadata.album.upc,
    isrc: track.metadata.isrc,
    genre: track.metadata.album.genre,
    releasedate: track.metadata.album.releaseDate,
    tracknumber: track.metadata.trackNumber.toString(),
    discnumber: track.metadata.discNumber.toString(),
    producer: track.metadata.producers,
    composer: track.metadata.composers,
    lyricist: track.metadata.lyricists,
    performer: track.metadata.performers,
    engineer: track.metadata.engineers,
    }
    await writeFlacTags(
    {
      tagMap,
      picture: {
      buffer: coverImage,
      }
    },
    // path to existing flac file, inline if else depending on if there is more than one disk in the album
    albumInfo.tracks[albumInfo.tracks.length -1].discNumber > 1 ? `${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/CD${track.metadata.discNumber}/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac` : `${folder}/${albumArtistsString}/${track.metadata.album.title} (${releaseYear})/${twoDigitTrackNumber}. ${artistNamesString} - ${track.metadata.title}.flac`,
  )
}

export async function downloadAlbum(url: string, folder: string) {
  const album = await lucidaClient.getByUrl(url);
  console.log(`Downloading album: ${album.metadata.title}`);
  for (const track of album.tracks) {
    await downloadTrack(track.url, folder);
  }

  // Get album artists
  const albumArtists = album.metadata.artists.map((artist) => artist.name)

  // Get year of release
  const releaseYear = new Date(album.metadata.releaseDate).getUTCFullYear();

  // Create album artist string
  const albumArtistsString = albumArtists.join(", ");

  // Get cover image
  const coverRequest = await fetch(album.metadata.coverArtwork[album.metadata.coverArtwork.length - 1].url).then(async (response) => {
    await response.bytes().then((buffer) => {
    fs.promises.writeFile(`${folder}/${albumArtistsString}/${album.metadata.title} (${releaseYear})/cover.jpg`, buffer);
    });
  }).catch((err) => {
      console.error(err);
  });
}

export async function downloadPlaylist(url: string, folder: string) {
  const playlist = await lucidaClient.getByUrl(url);
  console.log(`Downloading playlist: ${playlist.metadata.title}`);
  for (const track of playlist.tracks) {
    await downloadTrack(track.url, folder);
  }
}

export async function downloadArtist(url: string, folder: string) {
  const artist = await lucidaClient.getByUrl(url);
  console.log(artist);
  console.log(`Downloading artist: ${artist.metadata.name}`);
  for (const album of artist.metadata.albums) {
    await downloadAlbum(album.url, folder);
  }
}