export function getDisplayPath(change) {
    switch (change.type) {
        case 'ADD':
        case 'MODIFY':
        case 'RENAME':
        case 'COPY':
            return change.newPath;
        case 'DELETE':
            return change.oldPath;
    }
}
