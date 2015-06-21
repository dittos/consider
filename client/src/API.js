import "whatwg-fetch";

const BASE_URL = '/api';

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

export function getBlobStructure(reviewSessionId, blobId) {
    return fetchJSON(BASE_URL + '/review-sessions/' + reviewSessionId + '/blobs/' + blobId + '/structure');
}

export function getCommentsOnBlob(reviewSessionId, blobId) {
    return fetchJSON(BASE_URL + '/review-sessions/' + reviewSessionId + '/blobs/' + blobId + '/comments');
}

export function createCommentOnBlob(reviewSessionId, blobId, lineNumber, content) {
    return postJSON(BASE_URL + '/review-sessions/' + reviewSessionId + '/blobs/' + blobId + '/comments', { lineNumber, content });
}

function fetchJSON(url) {
    return fetch(url).then(r => r.json());
}

function postJSON(url, data) {
    return fetch(url, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(r => r.json());
}
