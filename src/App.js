import React, {Component} from 'react';
import _ from 'lodash';
import './App.css';

class App extends Component {
    render() {
        const {data} = this.props;
        const bookList = _.reduce(data, (res, data) => {
            _.each(data.bookList, (data) => {
                res.push(data);
            });
            return res;
        }, []);
        const shuffledBookList = _.shuffle(bookList);
        const authorsToString = (authors) => {
            const author = (authors.original_author || authors.story_writer || authors.author || [{name: ''}])
                .map(author => author.name)
                .join(',');
            const illur = authors.illustrator && authors.illustrator
                .map((illur) => illur.name)
                .join(',');
            return illur ? (<p>글 : {author}`<br/>그림 : {illur}</p>) : (<p>글/그림 : {author}</p>);
        };
        const onClick = ({series}) => {
            window.open(`https://ridibooks.com/v2/Detail?id=${series.id}`, '_blank');
        };
        const item = (book) => (<div key={book.id}
                                     className="App-book"
                                     onClick={() => onClick(book)}>
            <div className="App-book-background">
                <img src={book.thumbnail.large}/>
            </div>
            <div className="App-book-info">
                <h1 className="App-book-title">{book.title.main}</h1>
                <div className="App-book-author">
                    {authorsToString(book.authors)}
                </div>
            </div>
        </div>);
        return (
            <div className="App">
                <main className="App-container">
                    {_.map(shuffledBookList, item)}
                </main>
            </div>
        );
    }
}

export default App;
