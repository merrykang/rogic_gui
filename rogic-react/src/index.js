import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';

function formatName(user) {
    return user.firstName + ' ' + user.lastName;
}

const user = {
    firstName: 'Harper',
    lastName: 'Perez',
    avatarUrl: 'asset/Background1.png'
}

// 1. js 표현식을 element로 표현
const element = (
    < h1 >
        Hello, {formatName(user)}!
    </h1>
);

// 2. jsx를 if 구문 및 for loop 문 안에 사용 가능
function getGreeting(user) {
    if (user) {
        return <h1> Hello, {formatName(user)}! </h1>
    }
    return <h1> Hello, stranger! </h1>
}

// 3. jsx로 문자열 리터럴/자식 정의
const element1 = (
    <a href='https://www.reactjs.org'>link</a>  
);

const element2 = (
    <img src={user.avatarUrl}></img>  
)

const element3 = (
    <div>
        <h1>Hello!</h1>
        <h2>Good to see you here</h2>
    </div>
);

// 4. jsx는 주입 공격을 방지: index_state.js 파일에서 실행
// const title = response.potentiallyMaliciousInput;
// const element4 = <h1>{title}</h1>;

// 5. jsx는 객체를 표현 (element5 = element6)
const element5 = (
    <h1 className="greeting">
        Hello, world!
    </h1>
)

const element6 = React.createElement(
    'h1',
    { className: 'greeting' },
    'Hello, world!'
)

// 'root' DOM 노드에 렌더링 
ReactDOM.render(
    element6,
    // getGreeting(user),  // Hello, Harper Perez!
    // getGreeting(),  // Hello, Stranger!
    document.getElementById('root')
);