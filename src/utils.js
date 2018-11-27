// 쿠키저장소
const MATCH_OAUTH2_CLIENT_ID = /oauth2_client_id: '([0-9A-z]+)'/g;

const log = (message) => {
    console.log(message);
};

// html에 포함된 clientId를 가져옴
const exportOauth2ClientId = (html) => {
    return MATCH_OAUTH2_CLIENT_ID.exec(html)[1];
};

const delay = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

module.exports = {log, exportOauth2ClientId, delay};
