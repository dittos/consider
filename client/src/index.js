import "./common.less";
import React from "react";
import Router, {Route, DefaultRoute, Redirect, RouteHandler, Link} from "react-router";
import * as API from "./API";
import ReviewSessionRoute from "./ReviewSessionRoute";

class App extends React.Component {
    render() {
        return <div className="App">
            <RouteHandler />
        </div>;
    }
}

class ReviewSessionsRoute extends React.Component {
    constructor() {
        super();
        this.state = {data: null};
    }

    componentDidMount() {
        API.getReviewSessions()
            .then(r => this.setState({data: r.data}));
    }

    render() {
        const data = this.state.data;
        return <div className="ReviewSessionsRoute">
            <h1>Review Sessions</h1>
            <ul>
            {data && data.map(item =>
                <li><Link to="review-session" params={{id: item.id}}>{item.sourceBranch}</Link></li>
            )}
            </ul>
        </div>;
    }
}

const routes = (
    <Route name="app" path="/" handler={App}>
        <Route name="review-sessions" path="/review-sessions" handler={ReviewSessionsRoute} />
        <Route name="review-session" path="/review-sessions/:id" handler={ReviewSessionRoute} />
        <Redirect from="" to="review-sessions" />
    </Route>
);

Router.run(routes, Handler => {
    React.render(<Handler />, document.getElementById('app'));
});
