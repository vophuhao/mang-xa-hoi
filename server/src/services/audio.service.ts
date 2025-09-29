// services/musicService.js
import axios from "axios";
import Audio from "@/models/audio.model";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
ffmpeg.setFfmpegPath(path.resolve(__dirname, "../../bin/ffmpeg.exe"));

export async function fetchAndSaveMusic(query: string ) {
  try {
    // gọi API Deezer search
    const response = await axios.get(`https://api.deezer.com/search?q=${query}`);
    const tracks = response.data.data;

    // Lưu từng track vào MongoDB (tránh trùng)
    for (const track of tracks) {
      await Audio.updateOne(
        { deezerId: track.id },
        {
          deezerId: track.id,
          title: track.title,
          artist: track.artist.name, 
          duration: track.duration,
          cover: track.album.cover_medium
        },
        { upsert: true } // có thì update, chưa có thì insert
      );
    }

    return tracks.length;
  } catch (error) {
    console.error("❌ Lỗi fetch Deezer:");
    throw error;
  }
}

export async function trimVideo(inputPath: string, start: number, end: number): Promise<string> {
  const outputPath = inputPath.replace(/(\.\w+)$/, `-trimmed$1`);
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .setStartTime(start)         // thời gian bắt đầu (giây)
      .setDuration(end - start)    // thời lượng (giây)
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
}

export function extractAudioFromVideo(videoPath: ffmpeg.FfmpegCommandOptions | undefined, outputDir: string) {
  return new Promise((resolve, reject) => {
    const audioFileName = `${Date.now()}_audio.mp3`;
    const audioPath = path.join(outputDir, audioFileName);

    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .save(audioPath)
      .on('end', () => resolve(audioPath))
      .on('error', (err) => reject(err));
  });
}