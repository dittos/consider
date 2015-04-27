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
        return <div>
            <h3>{getDisplayPath(this.props.change)}</h3>
            <pre>
            {diffLines(this.state.oldBlob, this.state.newBlob).map(part =>
                <div style={getDiffPartStyle(part)}>{part.value}</div>
            )}
            </pre>
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
}

export default ReviewSessionDiff;
