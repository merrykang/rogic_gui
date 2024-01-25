/**
 * 아래 코드로 내가 원하는 결과 내려면 웹 서버(express.js 같은)도 켜야함. 
 * 잘 생각해보면 이하 코드에서 potentiallyMaliciousInput 도 별도로 설정해놓지 않았음 
 * 
 */
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            title: ''
        }
    };

    // 컴포넌트가 마운트(화면에 나타남)된 직후에 호출되는 생명 주기 메소드
    componentDidMount() {
        axios.get('/mount')
            .then(response => {
                this.setState({
                    title: response.data.potentiallyMaliciousInput
                })
            })
            .catch(error => {
                console.log(error);
                this.setState({
                    title: 'Error loading data'
                })
            })
    };

    render() {
        return <h1>{this.state.title}</h1>
    };
}

// ReactDOM.render is no longer supported in React 18. Use createRoot instead.
const root = document.getElementById('root');
ReactDOM.createRoot(root).render(<App />);