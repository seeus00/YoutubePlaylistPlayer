import logo from './logo.svg';
import './css/App.css';
import {
    BrowserRouter,
    Routes,
    Route,
    Link
} from "react-router-dom";
import { Component, useState, useEffect } from 'react';

import Home from "../src/components/home.component";
import Playlist from './components/playlist.component';


class App extends Component {
    render() {
        return (
            <div>
                <BrowserRouter>
                    <Routes>
                        <Route exact path="/home" element={<Home/>} />
                        <Route exact path="/" element={<Home/>} />
                        <Route exact path="/playlist" element={<Playlist/>} />
                    </Routes>
                </BrowserRouter>
              
            </div>
        )
    }  
}


export default App;
