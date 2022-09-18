import React, { Component, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {useLocation} from 'react-router-dom';
import '../css/playlist.css';

export default function Playlist() {
    const [videos, setVideos] = useState([])
    const [error, setError] = useState({})
    const [currVideo, setCurrVideo] = useState(null)
    const [currAudioSrc, setCurrAudioSrc] = useState()
    const [currVideoIndex, setCurrVideoIndex] = useState(0)

    let audioSource = useRef()

    const location = useLocation();
    const playlistUrl = location.state.playlist;
    const params = new Proxy(new URLSearchParams(playlistUrl), {
        get: (searchParams, prop) => searchParams.get(prop),
    });


    useEffect(() => {
        const fetchVideos = () => {
            fetch('/playlist?id=' + params.list)
                .then(resp => {
                    if (!resp.ok) {
                        throw new Error("PLAYLIST ERROR")
                    }

                    return resp
                })
                .then(resp => resp.json())
                .then(data => setVideos(data))
                .catch(err => {
                    setError(err)
                })
        };

        if (videos.length == 0) {
            fetchVideos()
        }else {
            if (!currVideo && videos.length > 0) setCurrVideo(videos[currVideoIndex])
        }
    }, [videos])  

    useEffect(() => {
        const fetchVideo = async () => {
            const resp = await fetch('/video?id=' + currVideo.id).catch((e) => 
                new Response(JSON.stringify({
                    code: 400,
                    message: 'Video was invalid'
            })))
            if (resp.ok) {
                const data = await resp.json()
                setCurrAudioSrc(data.url)
                console.log(data.url)
            }else {
                //If video is invalid, remove it from the playlist
                setVideos(videos.filter(video => video.id !== currVideo.id))
                setCurrVideoIndex(currVideoIndex)
            }
        }

        if (currVideo) {
            fetchVideo()
        }
    }, [currVideo]) 

    const updateProgress = () => {
        const container = document.getElementById("elapsed-container");
        const elapsed = document.getElementById("elapsed");

        if (container === null || elapsed === null) return

        var rect = container.getBoundingClientRect();
        var percentage = audioSource.current.currentTime / audioSource.current.duration;
        elapsed.style.width = (percentage * rect.width) + "px";
        
        window.requestAnimationFrame(updateProgress);
    }

    //Init audio source
    useEffect(() => {
        audioSource.current = new Audio(currAudioSrc)
        audioSource.current.volume = 0.2
        audioSource.current.play()
        window.requestAnimationFrame(updateProgress)
    }, [currAudioSrc])

    //Play next or prev song
    useEffect(() => {
        if (videos.length !== 0) {
            audioSource.current.pause()
            audioSource.current.src = ""
            setCurrAudioSrc(undefined)
            setCurrVideo(videos[currVideoIndex])
        }
    }, [currVideoIndex])

    useEffect(() => {
        return () => {
            audioSource.current.pause()
            console.log("in cleanup")
        }
    }, [])
    const handleProgressClick = (e) => {
        const container = document.getElementById("elapsed-container");
        const rect = container.getBoundingClientRect();
        const elapsed = document.getElementById("elapsed");

        var x = e.clientX - rect.left; //x position within the element.

        const percentage = x / rect.width;
        const newTime = audioSource.current.duration * percentage
        audioSource.current.currentTime = newTime
        elapsed.style.width = (percentage * rect.width) + "px"
    }

    const handleProgressDragStart = (e) => {
        var rect = e.target.getBoundingClientRect();
        console.log(rect.top, rect.right, rect.bottom, rect.left);
    }

    const handleVolumeSlider = () => {
        const slider = document.getElementById("volumeSlider")
        audioSource.current.volume = slider.value / 100.0
    }

    const handleVolumeWheel = (e) => {
        const slider = document.getElementById("volumeSlider")

        if (e.deltaY < 0){
            slider.valueAsNumber += 1;
        }else{
            slider.value -= 1;
        }

        handleVolumeSlider()
    }


    if (error.message !== undefined) {
        return (
            <div>
                <p>ERROR: {error.message}</p>
            </div>
        )
    }

    return (
        currAudioSrc !== undefined ? 
        (<div>
            <button type="button" id="playButton" onClick={() => audioSource.current.play() }>▶️</button>
            <button type="button" id="pauseButton" onClick={() => audioSource.current.pause()}>⏸️</button>

            <div id="elapsed-container" onClick={handleProgressClick}>
                <div id="elapsed" onDragStart={handleProgressDragStart}></div>
            </div>

            <div class="volumeContainer">
                <input type="range" min="1" max="100" defaultValue="20"
                    onChange={handleVolumeSlider} 
                    onWheel={handleVolumeWheel} 
                    id="volumeSlider"/>
            </div>

            <button type="button" id="nextTrackButton" onClick={() => setCurrVideoIndex(currVideoIndex + 1)}>⏭️</button>
            <button type="button" id="prevTrackButton" onClick={() => setCurrVideoIndex(currVideoIndex - 1)}>⏮️</button>
            
            <p>Now playing: {currVideo.title}</p>
        </div>) : 
        (<p>LOADING!</p>)
    )
}