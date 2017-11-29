const fs = require('fs');
const Rx = require('rx');
const https = require('https');
const querystring = require('querystring');
const Cookie = require('request-cookies').Cookie;
const cheerio = require('cheerio');

// node index.js username password
let username = process.argv[2];
let password = process.argv[3];

class Book {
    constructor(name, cover, link) {
        this.name = name;
        this.cover = cover;
        this.link = link;
    }
}

class BookGroup extends Book {
    constructor(name, cover, link) {
        super(name, cover, link);
    }
}

// Request Set-Cookie를 사용 가능한 Cookie로 변환
function parseCookie(cookies) {
    return cookies.map((string) => {
        let cookie = new Cookie(string);
        if (['PHPSESSID', 'user_device_type', 'X-SERVERID'].includes(cookie.key))
            return `${cookie.key}=${cookie.value}`;
        else
            return '';
    }).join("; ");
}

function parseBookList(body) {
    let $ = cheerio.load(body);
    let $bookList = $('#page_purchased').find('#book_');
    if ($bookList.length > 0) {
        return $bookList.map((i, _book) => {
            let book = $(_book);
            let title = book.find('.title_text').text().trim();
            let link = book.find('.title_link').attr('href');
            let cover = book.find('.thumbnail').attr('data-original-cover');
            let isGroup = book.find('.series_book').length > 0;
            if (isGroup) {
                return new BookGroup(title, cover, link);
            } else {
                return new Book(title, cover, link);
            }
        });
    } else {
        // 페이지 종료
        return null;
    }
};


// 로그인 페이지 접속 -> 기본 쿠키
function requestIndex() {
    let indexRequestOptions = {
        method: 'GET',
        hostname: 'ridibooks.com',
        path: '/account/login',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        let indexRequest = https.request(indexRequestOptions, (res) => {
            // console.log(res.headers);
            let body = "";
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve(parseCookie(res.headers['set-cookie']));
            });
        });
        indexRequest.on('error', (e) => {
            reject(e);
        });
        indexRequest.end();
    });

}

// 로그인 접속 -> Redirect 페이지로 넘거감 -> Session Cookie 전달
function requestLogin(cookies) {
    let loginFormData = {
        cmd: 'login',
        return_url: '/account/myridi',
        return_query_string: null,
        user_id: username,
        passwd: password,
        remember_login: null
    };
    let loginRequestOptions = {
        method: 'POST',
        hostname: 'ridibooks.com',
        path: '/account/login',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        let loginRequest = https.request(loginRequestOptions, (res) => {
            let body = "";
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve(parseCookie(res.headers['set-cookie']));
            });
        });
        loginRequest.on('error', (e) => {
            reject(e);
        });
        let content = querystring.stringify(loginFormData);
        loginRequest.setHeader('Cookie', cookies);
        loginRequest.setHeader('Host', 'ridibooks.com');
        loginRequest.setHeader('Origin', 'https://ridibooks.com');
        loginRequest.setHeader('Referer', 'https://ridibooks.com/account/login');
        loginRequest.setHeader('Content-Type', 'application/x-www-form-urlencoded');
        loginRequest.setHeader('Content-Length', content.length);
        loginRequest.write(content);
        loginRequest.end();
    });
}

function requestLibrary(cookies, page) {
    let libraryRequestOptions = {
        method: 'GET',
        hostname: 'ridibooks.com',
        path: `/library/?page=${page}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        let libraryRequest = https.request(libraryRequestOptions, (res) => {
            let body = "";
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve(body);
            });
        });
        libraryRequest.on('error', (e) => {
            reject(e);
        });
        libraryRequest.setHeader('Cookie', cookies);
        libraryRequest.setHeader('Host', 'ridibooks.com');
        libraryRequest.setHeader('Origin', 'https://ridibooks.com');
        libraryRequest.setHeader('Referer', 'https://ridibooks.com');
        libraryRequest.end();
    });
}

function requestBookGroup(cookies, link, page) {
    let libraryRequestOptions = {
        method: 'GET',
        hostname: 'ridibooks.com',
        path: `${link}&page=${page}`,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
        }
    };
    return new Promise((resolve, reject) => {
        let libraryRequest = https.request(libraryRequestOptions, (res) => {
            let body = "";
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                resolve(body);
            });
        });
        libraryRequest.on('error', (e) => {
            reject(e);
        });
        libraryRequest.setHeader('Cookie', cookies);
        libraryRequest.setHeader('Host', 'ridibooks.com');
        libraryRequest.setHeader('Origin', 'https://ridibooks.com');
        libraryRequest.setHeader('Referer', 'https://ridibooks.com');
        libraryRequest.end();
    });
}

function researchLibrary(authCookies) {
    return Rx.Observable.range(1, 100)
        .concatMap(page => {
            return Rx.Observable.create(observer => {
                requestLibrary(authCookies, page)
                    .then(body => {
                        let bookList = parseBookList(body);
                        if (bookList) {
                            bookList.each((_, book) => {
                                observer.onNext(book);
                            });
                        } else {
                            observer.onNext(null);
                        }
                        observer.onCompleted();
                    })
                    .catch(e => {
                        observer.onError(e);
                    });
            });
        })
        .takeWhile(ob => {
            return ob
        })
        .concatMap(book => {
            if (book instanceof BookGroup) {
                return researchBookGroup(authCookies, book);
            } else {
                return Rx.Observable.just(book);
            }
        });
}

function researchBookGroup(authCookies, book) {
    return Rx.Observable.range(1, 100)
        .concatMap(page => {
            return Rx.Observable.create(observer => {
                requestBookGroup(authCookies, book.link, page)
                    .then(body => {
                        let bookList = parseBookList(body);
                        if (bookList) {
                            bookList.each((_, book) => {
                                observer.onNext(book);
                            });
                        } else {
                            observer.onNext(null);
                        }
                        observer.onCompleted();
                    })
                    .catch(e => {
                        observer.onError(e);
                    });
            });
        })
        .takeWhile(ob => {
            return ob !== null;
        });
}

requestIndex().then(cookies => {
    requestLogin(cookies)
        .then(authCookies => {
            // 로그인 정보 인증 쿠키
            let bookArray = null;
            researchLibrary(authCookies)
                .toArray()
                .subscribe(_bookArray => {
                    bookArray = _bookArray;
                }, error => {
                    console.error(error);
                }, () => {
                    fs.writeFile("public/db.json", JSON.stringify(bookArray, null, 4), 'utf8', function (err) {
                        if (err) {
                            return console.log(err);
                        }
                        console.log('END()')
                    });
                });
        });
}).catch(e => {
    console.error(e);
});

