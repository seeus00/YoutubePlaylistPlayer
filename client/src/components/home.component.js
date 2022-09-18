import React, { Component, useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../css/home.css';

export default function Home(props) {
    const [playlistUrl, setPlaylistUrl] = useState()
    const navigate = useNavigate()

    const handleSubmit = (e) => {
        e.preventDefault();
        
        navigate('/playlist', { state: {playlist: playlistUrl} })
        //props.history.push('/playlist', { state: {playlist: playlistUrl} })
    }

    return (
        <div class="container">
            <h1>Enter a playlist!</h1>
            <form onSubmit={handleSubmit} id="urlForm">
                <label>Enter playlist: </label>
                <input 
                    type="text"
                    required
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                />
            </form>
        </div>
    )
}
