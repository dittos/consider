import "whatwg-fetch";

const BASE_URL = 'http://127.0.0.1:8080';

export function getReviewSessions() {
    return fetchJSON(BASE_URL + '/review-sessions');
}

export function getReviewSession(id) {
    return fetchJSON(BASE_URL + '/review-sessions/' + id);
}

export function getReviewSessionBlob(reviewSessionId, blobId) {
    return fetch(BASE_URL + '/review-sessions/' + reviewSessionId + '/blobs/' + blobId)
        .then(r => r.text());
}

function fetchJSON(url) {
    return fetch(url).then(r => r.json());
}
