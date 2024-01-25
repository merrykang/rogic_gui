import { getImageUrl } from "../utils/util"

// 1. props가 무엇인지 알려주기
// function Avatar() {
//     return (
//         <img
//             className="avatar"
//             src="https://i.imgur.com/1bX5QH6.jpg"
//             alt="Lin Lanying"
//             width={100}
//             height={100}
//         />
//     )
// };

// export default function Profile() {
//     return (
//         <Avatar />
//     )
// };

// 2. 반복되는 props는 별도의 파일로 분리(util.js)
function Avartar({ person, size }) {
    return (
        <img
            className="avatar"
            src={getImageUrl(person)}
            alt={person.name}
            width={size}
            height={size}
        />
    )
};

export default function Profile() {
    return (
        <div>
            <Avartar 
                size={100}
                person={{
                    name: 'Saruhashi',
                    imageId: 'YfeOqp2'
                }}
            />
            <Avartar
                size={80}
                person={{
                    name: 'Aklilu Lemma', 
                    imageId: 'OKS67lh'
                }}
            />
        </div>
    )
}