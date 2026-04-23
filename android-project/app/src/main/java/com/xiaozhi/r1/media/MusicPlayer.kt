package com.xiaozhi.r1.media

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer

class MusicPlayer(context: Context) {
    private val exoPlayer: ExoPlayer = ExoPlayer.Builder(context).build()
    
    private val queue = mutableListOf<TrackInfo>()
    private var currentIndex = -1
    
    var isShuffle = false
        set(value) {
            field = value
            exoPlayer.shuffleModeEnabled = value
        }
        
    var repeatMode: Int = Player.REPEAT_MODE_OFF
        set(value) {
            field = value
            exoPlayer.repeatMode = value
        }

    var onTrackChangedListener: ((TrackInfo?) -> Unit)? = null

    init {
        exoPlayer.addListener(object : Player.Listener {
            override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
                super.onMediaItemTransition(mediaItem, reason)
                if (mediaItem != null && mediaItem.localConfiguration != null) {
                    val trackId = mediaItem.mediaId
                    val track = queue.find { it.id == trackId }
                    if (track != null) {
                        currentIndex = queue.indexOf(track)
                        onTrackChangedListener?.invoke(track)
                    }
                } else {
                    onTrackChangedListener?.invoke(null)
                }
            }
        })
    }

    fun play(track: TrackInfo, streamUrl: String) {
        // Add to queue if not exists
        if (!queue.contains(track)) {
            queue.add(track)
        }
        currentIndex = queue.indexOf(track)

        val mediaItem = MediaItem.Builder()
            .setMediaId(track.id)
            .setUri(Uri.parse(streamUrl))
            .setMediaMetadata(
                MediaMetadata.Builder()
                    .setTitle(track.title)
                    .setArtist(track.uploader)
                    .setArtworkUri(Uri.parse(track.thumbnailUrl))
                    .build()
            )
            .build()

        exoPlayer.setMediaItem(mediaItem)
        exoPlayer.prepare()
        exoPlayer.play()
    }

    fun enqueue(track: TrackInfo, streamUrl: String) {
        queue.add(track)
        
        val mediaItem = MediaItem.Builder()
            .setMediaId(track.id)
            .setUri(Uri.parse(streamUrl))
            .build()
            
        exoPlayer.addMediaItem(mediaItem)
    }

    fun playPause() {
        if (exoPlayer.isPlaying) {
            exoPlayer.pause()
        } else {
            exoPlayer.play()
        }
    }

    fun next() {
        if (exoPlayer.hasNextMediaItem()) {
            exoPlayer.seekToNextMediaItem()
        }
    }

    fun previous() {
        if (exoPlayer.hasPreviousMediaItem()) {
            exoPlayer.seekToPreviousMediaItem()
        }
    }

    fun setVolume(volume: Float) {
        exoPlayer.volume = volume // 0.0f to 1.0f
    }

    fun getQueue(): List<TrackInfo> = queue.toList()
    
    fun clearQueue() {
        queue.clear()
        exoPlayer.clearMediaItems()
        currentIndex = -1
    }

    fun release() {
        exoPlayer.release()
    }
}
