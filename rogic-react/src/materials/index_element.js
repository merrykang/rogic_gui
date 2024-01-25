import React from "react";
import ReactDOM from 'react-dom';

// 1. DOM에 엘리먼트 렌더링하기 
const root = ReactDOM.createRoot(
    document.getElementById('root')
); 
// const element = <h1>Hello, world!</h1>
// root.render(element); // = ReactDOM.createRoot(root).render(element)

// 2. 렌더링된 엘리먼트 업데이트하기 | 변경된 부분만 업데이트하기
function tick() {
    const element1 = (
        <div>
            <h1>Hello, world!</h1>
            <h2>It is {new Date().toLocaleTimeString()}</h2>
        </div>
    );
    root.render(element1);
}

setInterval(tick, 1000);
