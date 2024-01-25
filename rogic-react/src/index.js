import React from "react";
import ReactDOM from 'react-dom';

import Profile from "./components/App";
import Gallery from "./materials/App_component";

// 1. Your First Component 
// ReactDOM.render(
//     <React.StrictMode>
//         <Gallery />
//     </React.StrictMode>,
//     document.getElementById('root')
// );

// 2. Passing Props to a Component
ReactDOM.render(
    <React.StrictMode>
        <Profile />
    </React.StrictMode>,
    document.getElementById('root')
);
