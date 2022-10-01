import React, {useEffect, useRef, useState } from "react";
import {useLocation} from 'react-router-dom';
import '../css/playlist.css';
import 'bootstrap/dist/css/bootstrap.css';
import {Container, Row, Col} from 'react-bootstrap';
import {List, Paper} from '@mui/material'
//import {MusicAnalyzer} from '../components/musicAnalyzer.component'


export default function Playlist() {
    const [currPlaylistUrl, setCurrPlaylistUrl] = useState()

    const [videos, setVideos] = useState([])
 
    const [nextPageToken, setNextPageToken] = useState()
    const [prevPageToken, setPrevPageToken] = useState()

    const [currPage, setCurrPage] = useState(0)

    const [error, setError] = useState({})
    const [currVideo, setCurrVideo] = useState(null)
    const [currAudioSrc, setCurrAudioSrc] = useState()
    const [currAudioTime, setCurrAudioTime] = useState(0)
    const [currAudioDuration, setCurrAudioDuration] = useState(0)
    const [currVolumeLevel, setCurrVolumeLevel] = useState(0.2)
    
    const [audioEle, setAudioEle] = useState(null)
    const [audioAnalyser, setAudioAnalyser] = useState(null)

    const colors = useRef([])
    const audioCtx = useRef(new (window.AudioContext || window.webkitAudioContext)())
    const audioSource = useRef(new Audio())
    const location = useLocation();

    useEffect(() => {    
        const playlistUrl = location.state.playlist;
        setCurrPlaylistUrl(playlistUrl)
    }, [])

    const fetchVideos = async (tokenParam) => {
        if (currPlaylistUrl === undefined) return

        const url = new URL(currPlaylistUrl)
        const playlistId = url.searchParams.get("list")

        await fetch(`/playlist?id=${playlistId}${tokenParam}`)
            .then(resp => {
                if (!resp.ok) {
                    setError({msg: "PLAYLIST ERROR"})
                }

                return resp
            })
            .then(resp => resp.json())
            .then(data => {
                if (!data.videos.every(video => videos.includes(video))) {
                    setVideos(videos.concat(data.videos))
                    setNextPageToken(data.nextPageToken)
                    setPrevPageToken(data.prevPageToken)
                }

                //When changing playlists, scroll all the way to the top
                window.scrollTo(0, 0);
            }
            )
            .catch(err => {
                setError(err)
            })
    };

    useEffect(() => {
        setVideos([])
        //fetchVideos("")
    }, [currPlaylistUrl])

    useEffect(() => {
        if (videos.length == 0) {
            fetchVideos("")
        }else {
            if (!currVideo && videos.length > 0 && !audioSource.paused) setCurrVideo(videos[currPage * 50])
        }
    }, [videos])  

    // useEffect(() => {
    //     const fetchVideo = async () => {
    //         const resp = await fetch('/video?id=' + currVideo.id).catch((e) => setError(e))
    //         if (resp.ok) {
    //             const data = await resp.json()
    //             setCurrAudioSrc(data.url)
    //             console.log(data.url)
    //         }else {
    //             //If video is invalid, remove it from the playlist
    //             setVideos(videos.filter(video => video.id !== currVideo.id))
    //         }
    //     }

    //     if (currVideo) {
    //         fetchVideo()
    //         // const video = videos[videos.indexOf(currVideo)]

    //         // const thumbnail = video.thumbnails.standard.url
    //         // document.getElementById('utilityControl').style.backgroundImage=`url(${thumbnail})`;
    //     }
    // }, [currVideo]) 

    useEffect(() => {
        const fetchVideo = async () => {
            setCurrAudioSrc('http://localhost:3000/videoStream?id=' + currVideo.id)
            // const resp = await fetch('/streamVideo?id=' + currVideo.id).catch((e) => setError(e))
            // if (resp.ok) {
            //     const data = await resp.json()
            //     setCurrAudioSrc(data.url)
            //     console.log(data.url)
            // }else {
            //     //If video is invalid, remove it from the playlist
            //     setVideos(videos.filter(video => video.id !== currVideo.id))
            // }
        }

        if (currVideo) {
            fetchVideo()
            // const video = videos[videos.indexOf(currVideo)]

            // const thumbnail = video.thumbnails.standard.url
            // document.getElementById('utilityControl').style.backgroundImage=`url(${thumbnail})`;
        }
    }, [currVideo]) 

    const resetAudio = () => {    
        const pausePromise = audioSource.current.pause()
        if (pausePromise !== undefined) {
            pausePromise.then(() => {
                audioSource.current = null
                setCurrAudioSrc(undefined)
            })
        }
        
    }

    const playNextSong = () => {
        const currSongInd = videos.findIndex((video) => video.id == currVideo.id)
        const nextSongInd = currSongInd + 1 >= videos.length ? videos.length - 1 : currSongInd + 1

        resetAudio()
        setCurrVideo(videos[nextSongInd])
    }

    const playPrevSong = () => {
        const currSongInd = videos.indexOf(currVideo)
        const nextSongInd = (currSongInd - 1 < 0 ? 0 : currSongInd - 1)

        resetAudio()
        setCurrVideo(videos[nextSongInd])
    }

    const updateProgress = () => {
        if (audioSource.current == null) return

        if (audioSource.current.currentTime === audioSource.current.duration) {
            playNextSong()
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
        const startNewAudio = async () => {
            await audioSource.current.pause()
            audioSource.current = new Audio()
            audioSource.current.src = currAudioSrc
            audioSource.current.volume = currVolumeLevel

            audioSource.current.preload = "all"

            let audioEleSrc = audioCtx.current.createMediaElementSource(audioSource.current)
            let analyser = audioCtx.current.createAnalyser()
            audioEleSrc.connect(analyser);
            analyser.connect(audioCtx.current.destination);

            setAudioEle(audioEleSrc)
            setAudioAnalyser(analyser)

            await audioSource.current.play()

            
            setCurrAudioTime(audioSource.current.currentTime)
            setCurrAudioDuration(audioSource.current.duration)
    
            //window.requestAnimationFrame(updateProgress)
        
        }
        if (currAudioSrc !== undefined) {
            startNewAudio()
        }

       
    }, [currAudioSrc])

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
        resetAudio()
        setCurrVideo(video)
    }


    const formatVideos = () => {
        if (videos.length == 0) return (<div></div>)

        return videos.slice(currPage * 50, (currPage + 1) * 50).map(video => 
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

    const handleSubmit = (e) => {
        e.preventDefault();
        setCurrPlaylistUrl(e.target.value)

        document.getElementById("urlForm").reset();
    }

    
    useEffect(() => {
        if (currPage < 0) setCurrPage(0)

        if (currPage * 50 >= videos.length) {
            fetchVideos("&pageToken=" + nextPageToken)   
        }
        
    }, [currPage])

    const setCanvasScalingFactor = () => {
        return window.devicePixelRatio || 1;
     }
     
    const resizeCanvas = () => {
        let aWrapper = document.getElementById("visualizerContainer")
        let canvas = document.getElementById("visualizerCanvas")
        var ctx = canvas.getContext("2d");

         //Gets the devicePixelRatio
         var pixelRatio = setCanvasScalingFactor();
     
         //The viewport is in portrait mode, so var width should be based off viewport WIDTH
         if (window.innerHeight > window.innerWidth) {
             //Makes the canvas 100% of the viewport width
             var width = Math.round(1.0 * window.innerWidth);
         }
       //The viewport is in landscape mode, so var width should be based off viewport HEIGHT
         else {
             //Makes the canvas 100% of the viewport height
             var width = Math.round(1.0 * window.innerHeight);
         }
     
         //This is done in order to maintain the 1:1 aspect ratio, adjust as needed
         var height = width;
     
         //This will be used to downscale the canvas element when devicePixelRatio > 1
         aWrapper.style.width = width + "px";
         aWrapper.style.height = height + "px";
     
         canvas.width = width * pixelRatio;
         canvas.height = height * pixelRatio;
     }

    const animate = () => {          
        let canvas = document.getElementById("visualizerCanvas")
        let canvasCtx = canvas.getContext("2d");

        canvasCtx.sRect = (x,y,w,h) => {
            x=parseInt(x)+0.50;
            y=parseInt(y)+0.50;
            canvasCtx.strokeRect(x,y,w,h);
        }

        canvasCtx.fRect= (x,y,w,h) => {
            x=parseInt(x);
            y=parseInt(y);
            canvasCtx.fillRect(x,y,w,h);
        }

        const bufferLength = audioAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const barWidth = parseInt(canvas.width / bufferLength);

        audioAnalyser.fftSize = 128;
        let x = 0;

        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        audioAnalyser.getByteFrequencyData(dataArray);

        if (colors.current.length == 0) {
            for (let i = 0; i < bufferLength; i++) {
                var randomColor = Math.floor(Math.random()*16777215).toString(16)
                colors.current.push(randomColor)
            }
        }

        for (let i = 0; i < bufferLength; i++) {
            let barHeight = parseInt(dataArray[i] / 2);

            canvasCtx.fillStyle = "#" + colors.current[i];
            canvasCtx.fRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    
        requestAnimationFrame(animate);
    }

    useEffect(() => {
        if (audioAnalyser !== null) {
            resizeCanvas()
            requestAnimationFrame(animate);
        }
    }, [audioAnalyser])


    return (
        (<Container fluid={true}>
            <Row id="utilityControl">
                <Col>
                    <button type="button" id="prevTrackButton" onClick={() => playPrevSong()}>⏮️</button>
                    <button type="button" id="playButton" onClick={() => handlePlay() }>{(audioSource.current !== null && audioSource.current !== undefined && audioSource.current.paused) ? "▶️" : "⏸️"}</button>
                    {/* <button type="button" id="playButton" onClick={() => handlePlay() }>⏸️</button> */}
                    <button type="button" id="nextTrackButton" onClick={() => playNextSong()}>⏭️</button>
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
                            id="volumeSlider"/>
                    </div>
                </Col>
                <Row>
                    <Col>
                        <p>{currVideo === null ? "" : currVideo.title}</p>
                    </Col>

                    <Col>
                        <form onSubmit={handleSubmit} id="urlForm">
                            <label>Enter playlist: </label>
                                    <input 
                                    type="text"
                                    required
                                    onChange={(e) => setCurrPlaylistUrl(e.target.value)}
                                />
                        </form>
                    </Col>

                   
                </Row>
            </Row>
            
            <Row id="videosContainer">
                {formatVideos()}
            </Row>
            <Row>
                {currPage == 0 ? "" : <Col><button onClick={() => setCurrPage(currPage - 1)}>Prev</button></Col>}
                {(currPage + 1) * 50 >= videos.length && nextPageToken === undefined ? "" : <Col><button id="nextButton" onClick={() => setCurrPage(currPage + 1)}>Next</button></Col>}
            </Row>

            <Row id="visualizerContainer">
                <canvas id="visualizerCanvas"></canvas>
            </Row>
        </Container>)
    )
}