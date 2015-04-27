import React from "react";
import {Block, Flex} from "jsxstyle";
import * as API from "./API";
import {getDisplayPath} from "./Changes";
import ReviewSessionSidebar from "./ReviewSessionSidebar";
import ReviewSessionDiff from "./ReviewSessionDiff";

class ReviewSessionRoute extends React.Component {
    constructor() {
        super();
        this.state = {data: null};
    }

    componentDidMount() {
        const id = this.context.router.getCurrentParams().id;
        API.getReviewSession(id)
            .then(r => this.setState({data: r}));
    }

    render() {
        if (!this.state.data)
            return <div>Loading</div>;

        const {reviewSession, changes} = this.state.data;
        const selectedChange = this._getSelectedChange();
        return <div>
            <h1>Review Session #{reviewSession.id}</h1>
            <p>{reviewSession.sourceBranch} &rarr; {reviewSession.targetBranch}</p>

            <Flex>
                <ReviewSessionSidebar
                    reviewSession={reviewSession}
                    changes={changes} />

                {selectedChange &&
                    <ReviewSessionDiff
                        reviewSession={reviewSession}
                        change={selectedChange} />}
            </Flex>
        </div>;
    }

    _getSelectedChange() {
        const path = this.context.router.getCurrentQuery().path;
        if (!path)
            return null;
        for (let change of this.state.data.changes) {
            if (getDisplayPath(change) === path)
                return change;
        }
    }
}

ReviewSessionRoute.contextTypes = {
    router: React.PropTypes.func
};

export default ReviewSessionRoute;
