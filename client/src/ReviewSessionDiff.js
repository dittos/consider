import React from "react";
import {diffLines} from "diff";
import * as API from "./API";
import {getDisplayPath} from "./Changes";

function getDiffPartStyle(part) {
    if (part.added)
        return {backgroundColor: 'lightgreen'};
    if (part.removed)
        return {backgroundColor: 'pink'};
    return {};
}

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

class ReviewSessionDiff extends React.Component {
    constructor() {
        super();
        this.state = {
            oldBlob: null,
            newBlob: null
        };
    }

    componentDidMount() {
        this._load(this.props);
    }

    componentWillReceiveProps(props) {
        this._load(props);
    }

    render() {
        return <div className="ReviewSessionDiff">
            <div className="ReviewSessionDiff__header">
                {getDisplayPath(this.props.change)}
            </div>
            <div className="ReviewSessionDiff__content">
                {this._renderDiff()}
            </div>
        </div>;
    }

    _load(props) {
        Promise.all([props.change.newId, props.change.oldId]
            .map(id => API.getReviewSessionBlob(props.reviewSession.id, id))
        ).then(results => this.setState({
            newBlob: results[0],
            oldBlob: results[1]
        }));
    }

    _renderDiff() {
        const parts = diffLines(this.state.oldBlob, this.state.newBlob);
        const rows = [];
        let oldLineNumber = 1, newLineNumber = 1;
        for (let i = 0; i < parts.length; i++) {
            var part = parts[i];
            if (part.value === null)
                continue;
            if (part.added && parts[i + 1].removed)
                [part, parts[i + 1]] = [parts[i + 1], part];
            const partStyle = getDiffPartStyle(part);
            for (let line of splitLines(part.value)) {
                rows.push(<tr className={part.added ? 'a' : part.removed ? 'r' : ''}>
                    <td className="n">{!part.added && oldLineNumber++}</td>
                    <td className="n">{!part.removed && newLineNumber++}</td>
                    <td>{line}</td>
                </tr>);
            }
        }
        return <table>
            <tbody>{rows}</tbody>
        </table>;
    }
}

export default ReviewSessionDiff;
