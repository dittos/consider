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

class ReviewSessionDiff extends React.Component {
    constructor() {
        super();
        this.state = {diff: null};
    }

    componentDidMount() {
        this._load(this.props);
    }

    componentWillReceiveProps(props) {
        this._load(props);
    }

    render() {
        const diff = this.state.diff;
        if (!diff)
            return null;
        return <div className="ReviewSessionDiff">
            <div className="ReviewSessionDiff__header">
                {getDisplayPath(this.props.change)}
            </div>
            <div className="ReviewSessionDiff__content">
                <div className="ReviewSessionDiff__diff" ref="scrollArea">
                    <table>
                        <tbody>{diff.rows}</tbody>
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
        ].map(id => id ? API.getReviewSessionBlob(props.reviewSession.id, id) : Promise.resolve(''))).then(results => {
            const diff = this._renderDiff(results[1], results[0]);
            let totalLines = 0;
            let firstChangePos = 0, foundFirstChange = false;
            for (let range of diff.ranges) {
                if (range.type != RangeType.UNCHANGED)
                    foundFirstChange = true;
                if (!foundFirstChange)
                    firstChangePos += range.size;
                totalLines += range.size;
            }
            firstChangePos /= totalLines;
            this.setState({diff}, () => this._scrollTo(firstChangePos));
        });
    }

    _renderDiff(oldBlob, newBlob) {
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
            ranges.push({
                type: part.added ? RangeType.ADDED :
                    part.removed ? RangeType.REMOVED :
                    RangeType.UNCHANGED,
                size: lines.length
            });
            for (let line of lines) {
                rows.push(<tr className={part.added ? 'a' : part.removed ? 'r' : ''}>
                    <td className="n">{!part.added && oldLineNumber++}</td>
                    <td className="n">{!part.removed && newLineNumber++}</td>
                    <td className="l">{line}</td>
                </tr>);
            }
        }
        return {ranges, rows};
    }

    _scrollTo(pos) {
        var node = React.findDOMNode(this.refs.scrollArea);
        var rect = React.findDOMNode(this).getBoundingClientRect();
        node.scrollTop = Math.max(0, node.scrollHeight * pos - rect.height / 2);
    }
}

export default ReviewSessionDiff;
