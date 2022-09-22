import React, { Component, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {useLocation} from 'react-router-dom';
import '../css/playlist.css';
import 'bootstrap/dist/css/bootstrap.css';
import {Container, Row, Col} from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroller';

export default function Playlist() {
    const [videos, setVideos] = useState([])
    const [error, setError] = useState({})
    const [currVideo, setCurrVideo] = useState(null)
    const [currAudioSrc, setCurrAudioSrc] = useState()
    const [currAudioTime, setCurrAudioTime] = useState(0)
    const [currAudioDuration, setCurrAudioDuration] = useState(0)
    const [currVideoIndex, setCurrVideoIndex] = useState(0)
    const [currVolumeLevel, setCurrVolumeLevel] = useState(0.2)
    
    let audioSource = useRef()

    const location = useLocation();
    const playlistUrl = location.state.playlist;
    const url = new URL(playlistUrl)
    const playlistId = url.searchParams.get("list")

    useEffect(() => {
        const fetchVideos = () => {
            fetch('/playlist?id=' + playlistId)
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
        if (audioSource.current.currentTime === audioSource.current.duration) {
            setCurrVideoIndex(currVideoIndex + 1)
        }

        const container = document.getElementById("elapsed-container");
        const elapsed = document.getElementById("elapsed");

        if (container === null || elapsed === null) return
        
        setCurrAudioTime(audioSource.current.currentTime)
        setCurrAudioDuration(audioSource.current.duration)

        var rect = container.getBoundingClientRect();
        var percentage = audioSource.current.currentTime / audioSource.current.duration;
        elapsed.style.width = (percentage * rect.width) + "px";
        
        window.requestAnimationFrame(updateProgress);
    }

    //Init audio source
    useEffect(() => {
        audioSource.current = new Audio(currAudioSrc)
        audioSource.current.volume = currVolumeLevel
        audioSource.current.play()
        setCurrAudioTime(audioSource.current.currentTime)
        setCurrAudioDuration(audioSource.current.duration)

        window.requestAnimationFrame(updateProgress)
    }, [currAudioSrc])

    //Play next or prev song
    useEffect(() => {
        if (videos.length !== 0) {
            // if (currVideoIndex < 0) {
            //     setCurrVideoIndex(0)
            // }else if (currVideoIndex >= videos.length) {
            //     setCurrVideoIndex(videos.length - 1)
            // }

            console.log(currVideoIndex)

            audioSource.current.pause()
            audioSource.current.src = ""
            setCurrAudioSrc(undefined)
            setCurrVideo(videos[currVideoIndex])
        }
    }, [currVideoIndex])

    useEffect(() => {

    }, [currAudioTime])

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

        setCurrVolumeLevel(audioSource.current.volume)
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

    const handlePlay = () => {
        const playButton = document.getElementById("playButton")
        if (playButton === null) return

        if (audioSource.current.paused) {
            audioSource.current.play()
        }else {
            audioSource.current.pause()
        }

        playButton.innerHTML = (audioSource.current.paused) ? "▶️" : "⏸️"
    }

    const convertTime = (time) => {
        var sec_num = parseInt(time, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);
    
        if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        return hours+':'+minutes+':'+seconds;
    }

    const handleVideoClick = (video) => {
        setCurrVideoIndex(videos.indexOf(video))
    }

    const formatVideos = () => {
        if (videos.length == 0) return (<div></div>)

        return videos.map(video => 
            <div key={video.id}>
                <Row className="videoEntry">
                    <Col>
                        <div className="videoInPlaylist"
                            onClick={() => handleVideoClick(video)}>
                                <p>
                                    {video.title}
                                </p>

                            </div>
                    </Col>
                    <Col>
                        <img src={videos[videos.indexOf(video)].thumbnails.default.url}></img>
                    </Col>
                </Row>
            </div>)
    }

    return (
        (<Container fluid={true}>
            <Row id="utilityControl">
                <Col>
                    <button type="button" id="prevTrackButton" onClick={() => setCurrVideoIndex((currVideoIndex - 1 < 0 ? 0 : currVideoIndex - 1))}>⏮️</button>
                    <button type="button" id="playButton" onClick={() => handlePlay() }>{(audioSource.current !== undefined && audioSource.current.paused) ? "▶️" : "⏸️"}</button>
                    {/* <button type="button" id="playButton" onClick={() => handlePlay() }>⏸️</button> */}
                    <button type="button" id="nextTrackButton" onClick={() => setCurrVideoIndex((currVideoIndex + 1 >= videos.length ? videos.length - 1 : currVideoIndex + 1))}>⏭️</button>
                </Col>
                
                <Col>
                    <p >{convertTime(currAudioTime)}</p>
                </Col>

                <Col xs={4}>
                    <div id="elapsed-container" onClick={handleProgressClick}>
                        <div id="elapsed" onDragStart={handleProgressDragStart}></div>
                    </div>
                </Col>

                <Col>
                    <p>{convertTime(currAudioDuration)}</p>
                </Col>
                
                <Col>
                    <div className="volumeContainer">
                        <input type="range" min="0" max="100" defaultValue={currVolumeLevel * 100}
                            onChange={handleVolumeSlider} 
                            onWheel={handleVolumeWheel} 
                            id="volumeSlider"/>
                    </div>
                </Col>
                <Row>
                    <p>{currVideo === null ? "" : currVideo.title}</p>
                </Row>
            </Row>
            
            <Row>
                {formatVideos()}
            </Row>
            
        </Container>)
    )
}