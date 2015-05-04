import React from "react";
import {diffLines} from "diff";
import * as API from "./API";
import {getDisplayPath} from "./Changes";
import ReviewSessionDiffNav from "./ReviewSessionDiffNav";

const RangeType = {
    ADDED: 'a',
    REMOVED: 'r',
    UNCHANGED: ''
};

function splitLines(value) {
    var retLines = [],
        lines = value.split(/^/m);
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i],
            lastLine = lines[i - 1],
            lastLineLastChar = lastLine ? lastLine[lastLine.length - 1] : '';

        // Merge lines that may contain windows new lines
        if (line === '\n' && lastLineLastChar === '\r') {
            retLines[retLines.length - 1] = retLines[retLines.length - 1].slice(0,-1) + '\r\n';
        } else if (line) {
            retLines.push(line);
        }
    }
    return retLines;
}

function getBlobWithComments(reviewSessionId, blobId) {
    return Promise.all([
        API.getReviewSessionBlob(reviewSessionId, blobId),
        API.getCommentsOnBlob(reviewSessionId, blobId)
    ]).then(result => {
        return {
            data: result[0],
            comments: result[1]
        };
    });
}

function groupCommentsByLineNumber(comments) {
    const groups = {};
    for (let comment of comments) {
        if (!groups[comment.lineNumber])
            groups[comment.lineNumber] = [];
        groups[comment.lineNumber].push(comment);
    }
    return groups;
}

function appendComment(comments, lineNumber, comment) {
    if (!comments[lineNumber])
        comments[lineNumber] = [];
    comments[lineNumber].push(comment);
    return comments;
}

class ReviewSessionDiff extends React.Component {
    constructor() {
        super();
        this.state = {diff: null};
    }

    componentDidMount() {
        this._load(this.props);
    }

    componentWillReceiveProps(props) {
        this.setState({diff: null});
        this._load(props);
    }

    render() {
        const diff = this.state.diff;
        if (!diff)
            return <div className="Loading">Loading...</div>;
        return <div className="ReviewSessionDiff">
            <div className="ReviewSessionDiff__header">
                {getDisplayPath(this.props.change)}
            </div>
            <div className="ReviewSessionDiff__content">
                <div className="ReviewSessionDiff__diff" ref="scrollArea">
                    <table>
                        <tbody>{diff.rows.map(this._renderDiffLine.bind(this))}</tbody>
                    </table>
                </div>
                <ReviewSessionDiffNav
                    ranges={diff.ranges}
                    onScroll={this._scrollTo.bind(this)} />
            </div>
        </div>;
    }

    _load(props) {
        Promise.all([
            props.change.type != 'DELETE' && props.change.newId,
            props.change.type != 'ADD' && props.change.oldId
        ].map(id => id ? getBlobWithComments(props.reviewSession.id, id) : Promise.resolve({data: '', comments: []}))).then(results => {
            const diff = this._diff(results[1].data, results[0].data);
            let totalLines = diff.rows.length;
            let firstChangePos = 0;
            for (let range of diff.ranges) {
                if (range.type != RangeType.UNCHANGED)
                    break;
                firstChangePos += range.size;
            }
            firstChangePos /= totalLines;
            this.setState({
                diff,
                newComments: groupCommentsByLineNumber(results[0].comments),
                oldComments: groupCommentsByLineNumber(results[1].comments)
            }, () => this._scrollTo(firstChangePos));
        });
    }

    _diff(oldBlob, newBlob) {
        const parts = diffLines(oldBlob, newBlob);
        const rows = [];
        const ranges = [];
        let oldLineNumber = 1, newLineNumber = 1;
        for (let i = 0; i < parts.length; i++) {
            let part = parts[i];
            if (part.value === null)
                continue;
            if (part.added && parts[i + 1] && parts[i + 1].removed)
                [part, parts[i + 1]] = [parts[i + 1], part];
            const lines = splitLines(part.value);
            const type = part.added ? RangeType.ADDED :
                    part.removed ? RangeType.REMOVED :
                    RangeType.UNCHANGED;
            ranges.push({
                type: type,
                size: lines.length
            });
            for (let line of lines) {
                if (!part.added)
                    oldLineNumber++;
                if (!part.removed)
                    newLineNumber++;
                rows.push({
                    type,
                    oldLineNumber: !part.added && oldLineNumber,
                    newLineNumber: !part.removed && newLineNumber,
                    line
                });
            }
        }
        return {ranges, rows};
    }

    _renderDiffLine(lineObj) {
        let comments;
        if (lineObj.oldLineNumber)
            comments = this.state.oldComments[lineObj.oldLineNumber];
        else
            comments = this.state.newComments[lineObj.newLineNumber];
        const key = lineObj.oldLineNumber + ':' + lineObj.newLineNumber;
        const rows = [<tr className={lineObj.type} key={key}>
            <td className="g" onClick={this._addComment.bind(this, lineObj)}>+</td>
            <td className="n">{lineObj.oldLineNumber}</td>
            <td className="n">{lineObj.newLineNumber}</td>
            <td className="l">{lineObj.line}</td>
        </tr>];
        if (comments) {
            for (let comment of comments) {
                rows.push(<tr key={key + ':comment' + comment.id}>
                    <td className="g" />
                    <td className="n" />
                    <td className="n" />
                    <td className="c">
                        <div className="ReviewSessionDiff__comment">
                            <time>{new Date(comment.createdTime).toLocaleString()}</time>
                            <p>{comment.content}</p>
                        </div>
                    </td>
                </tr>);
            }
        }
        return rows;
    }

    _scrollTo(pos) {
        var node = React.findDOMNode(this.refs.scrollArea);
        var rect = React.findDOMNode(this).getBoundingClientRect();
        node.scrollTop = Math.max(0, node.scrollHeight * pos - rect.height / 2);
    }

    _addComment({type, oldLineNumber, newLineNumber}) {
        const content = prompt('Type comment:');
        if (!content)
            return;

        let blobId, lineNumber;
        if (type === RangeType.ADDED) {
            blobId = this.props.change.newId;
            lineNumber = newLineNumber;
        } else {
            blobId = this.props.change.oldId;
            lineNumber = oldLineNumber;
        }
        API.createCommentOnBlob(this.props.reviewSession.id, blobId, lineNumber, content).then(comment => {
            if (type === RangeType.ADDED)
                this.setState({newComments: appendComment(this.state.newComments, newLineNumber, comment)});
            else
                this.setState({oldComments: appendComment(this.state.oldComments, oldLineNumber, comment)});
        });
    }
}

export default ReviewSessionDiff;
