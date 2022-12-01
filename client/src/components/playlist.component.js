import React, {useEffect, useRef, useState } from "react";
import {useLocation} from 'react-router-dom';
import '../css/playlist.css';
import 'bootstrap/dist/css/bootstrap.css';
import {Container, Row, Col} from 'react-bootstrap'; 
import { useSelector, useDispatch } from 'react-redux';
import { setVideos, setCurrVideo } from '../redux/audioSlice'

export default function Playlist({controllerRef}) {
    const [inNextPlaylist, setInNextPlaylist] = useState(false);
    const [currPlaylistUrl, setCurrPlaylistUrl] = useState();
    const [currVideos, setCurrVideos] = useState([]);


    const dispatch = useDispatch();
    const { currVideo, videos } = useSelector((state) => state.audio);

    const [nextPageToken, setNextPageToken] = useState()
    const [error, setError] = useState({})
    const location = useLocation();

    useEffect(() => {    
        const playlistUrl = location.state.playlist;
        setCurrPlaylistUrl(playlistUrl);
    }, []);


    const fetchVideos = async (tokenParam) => {
        if (currPlaylistUrl === undefined) return;

        const url = new URL(currPlaylistUrl);
        const playlistId = url.searchParams.get("list");

        await fetch(`/playlist?id=${playlistId}${tokenParam}`)
            .then(resp => {
                if (!resp.ok) {
                    throw new Error({msg: "PLAYLIST ERROR"});
                }

                return resp
            })
            .then(resp => resp.json())
            .then(data => {
                if (!tokenParam) {
                    setInNextPlaylist(false);
                    setCurrVideos(data.videos);
                }else if (!data.videos.every(video => videos.includes(video))) {
                    setCurrVideos(currVideos.concat(data.videos));
                }

                setNextPageToken(data.nextPageToken);

                //When changing playlists, scroll all the way to the top
                window.scrollTo(0, 0);
            }
            )
            .catch(err => {
                setError(err)
            })
    };

    useEffect(() => {
        //Check if playlist url is valid
        try {
            const url = new URL(currPlaylistUrl);
        }catch (e) {
            //console.log(currPlaylistUrl + " is invalid!")
            return
        }

        setNextPageToken(undefined);
        fetchVideos("")
    }, [currPlaylistUrl])


    // useEffect(() => {
    //     return () => {
    //         //audioSource.pause()
    //         console.log("in cleanup")
    //     }
    // }, [])

    useEffect(() => {
        if (inNextPlaylist) {
            console.log("IN NEXT PLAYLIST");
            dispatch(setVideos(currVideos));
        }
    }, [currVideos]);


    const handleVideoClick = (video) => {
        setInNextPlaylist(true);

        controllerRef.current.abort();
        controllerRef.current = new AbortController();
        
        dispatch(setVideos(currVideos));
        dispatch(setCurrVideo(video));
    }


    const formatVideos = () => {
        if (currVideos.length == 0) return (<img src="/assets/progress.gif" alt="No videos"></img>)

        return currVideos.map((video, ind) => 
            <div key={video.id}>
                <Row className="videoEntry" id={currVideo !== undefined && currVideo !== null && currVideo.id === video.id ? 
                "currPlayingVideo" : ""} onClick={() => handleVideoClick(video)}>
                    <Col md={1} className="align-middle">
                        <p className="entryNumber">{ind + 1}.</p>
                    </Col>
                    <Col md={4}>
                        <img className="thumbnailImg" src={currVideos[currVideos.indexOf(video)].thumbnails.default.url} loading="lazy"></img>
                    </Col>
                    <Col>
                        <div className="videoInPlaylist"><p> {video.title}</p></div>
                    </Col>
                </Row>
            </div>
        )
    }

    const loadMore = () => {
        fetchVideos(`&pageToken=${nextPageToken}`);
        //setCurrPlaylistUrl(`${currPlaylistUrl}&&pageToken=${nextPageToken}`);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        setCurrPlaylistUrl(e.target.value)

        document.getElementById("urlForm").reset();
    }
    

    // const animate = () => {          
    //     let canvas = document.getElementById("visualizerCanvas")
    //     let canvasCtx = canvas.getContext("2d");

    //     // canvas.style.width='100%';
    //     // canvas.style.height='100%';
    //     // canvas.width  = canvas.offsetWidth;
    //     // canvas.height = canvas.offsetHeight;
    //     //canvas.style.display = "block";

    //     canvasCtx.sRect = (x,y,w,h) => {
    //         x=parseInt(x)+0.50;
    //         y=parseInt(y)+0.50;
    //         canvasCtx.strokeRect(x,y,w,h);
    //     }

    //     canvasCtx.fRect= (x,y,w,h) => {
    //         x=parseInt(x);
    //         y=parseInt(y);
    //         canvasCtx.fillRect(x,y,w,h);
    //     }

    //     const bufferLength = audioAnalyser.frequencyBinCount;
    //     const dataArray = new Uint8Array(bufferLength);
    //     const barWidth = parseInt(canvas.width / bufferLength);

    //     audioAnalyser.fftSize = 64;
    //     let x = 0;

    //     canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    //     //Draw thumbnail
    //     const video = videos[videos.indexOf(currVideo)]
    //     const thumbnail = video.thumbnails.maxres.url

    //     //Draw visualizer
    //     audioAnalyser.getByteFrequencyData(dataArray);

    //     if (colors.current.length == 0) {
    //         for (let i = 0; i < bufferLength; i++) {
    //             var randomColor = Math.floor(Math.random()*16777215).toString(16)
    //             colors.current.push(randomColor)
    //         }
    //     }

    //     for (let i = 0; i < bufferLength; i++) {
    //         let barHeight = parseInt(dataArray[i] / 2);
    //         canvasCtx.fillStyle = "#" + colors.current[i];
    //         canvasCtx.fRect(x, canvas.height - barHeight, barWidth, barHeight);
    //         x += barWidth + 1;
    //     }

    //     requestAnimationFrame(animate);
    // }

    // useEffect(() => {
    //     if (audioAnalyser !== null) {
    //         //resizeCanvas()
    //         requestAnimationFrame(animate);
    //     }
    // }, [audioAnalyser])


    return (
        (<Container id="mainContainer" fluid={true}>
            <Row id="content">
                {/* <Col id="visualizerContainer" xs={7}>
                    <canvas id="visualizerCanvas"></canvas>
                    
                </Col> */}
                <Col id="videosContainer">
                    <div>
                        {formatVideos()}  
                    </div>
                </Col>
                
            </Row>
            <Row>
                {/* {currPage == 0 ? "" : <Col><button onClick={() => setCurrPage(currPage - 1)}>Prev</button></Col>} */}
                {nextPageToken === undefined ? "" : <Col><button id="nextButton" onClick={() => loadMore()}>Load More</button></Col>}
            </Row>
        </Container>)
    )
}