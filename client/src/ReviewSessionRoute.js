import React from "react";
import * as API from "./API";
import {getDisplayPath} from "./Changes";
import Nav from "./Nav";
import ReviewSessionSidebar from "./ReviewSessionSidebar";
import ReviewSessionDiff from "./ReviewSessionDiff";

class ReviewSessionRoute extends React.Component {
    constructor() {
        super();
        this.state = {data: null};
    }

    componentDidMount() {
        API.getReviewSession(this.props.params.id)
            .then(r => this.setState({data: r}));
    }

    render() {
        if (!this.state.data)
            return <div>Loading</div>;

        const {reviewSession, changes} = this.state.data;
        const selectedChange = this._getSelectedChange();
        return <div className="ReviewSessionRoute">
            <Nav>
                {reviewSession.sourceBranch} &rarr; {reviewSession.targetBranch}
            </Nav>

            <div className="ReviewSessionRoute__content">
                <ReviewSessionSidebar
                    reviewSession={reviewSession}
                    changes={changes} />

                {selectedChange &&
                    <ReviewSessionDiff
                        reviewSession={reviewSession}
                        change={selectedChange} />}
            </div>
        </div>;
    }

    _getSelectedChange() {
        const path = this.props.query.path;
        if (!path)
            return null;
        for (let change of this.state.data.changes) {
            if (getDisplayPath(change) === path)
                return change;
        }
    }
}

export default ReviewSessionRoute;
