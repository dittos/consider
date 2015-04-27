import "whatwg-fetch";
import React from "react";
import Router, {Route, DefaultRoute, Redirect, RouteHandler, Link} from "react-router";
import {Block, Flex} from "jsxstyle";
import {diffLines} from "diff";

const BASE_URL = 'http://127.0.0.1:8080';

class App extends React.Component {
    render() {
        return <RouteHandler />;
    }
}

class ReviewSessionsRoute extends React.Component {
    constructor() {
        super();
        this.state = {data: null};
    }

    componentDidMount() {
        fetch(BASE_URL + '/review-sessions')
            .then(r => r.json())
            .then(r => this.setState({data: r.data}));
    }

    render() {
        const data = this.state.data;
        return <div>
            <h1>Review Sessions</h1>
            <ul>
            {data && data.map(item =>
                <li><Link to="review-session" params={{id: item.id}}>#{item.id}</Link></li>
            )}
            </ul>
        </div>;
    }
}

function getDisplayPath(change) {
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

function getTreeFileStyle(change) {
    if (change.type == 'DELETE')
        return {textDecoration: 'line-through'};
    return {};
}

class ReviewSessionSidebar extends React.Component {
    render() {
        return <Block>
            <h2>Changes</h2>
            {this._renderTree(this._makeTree(this.props.changes))}
        </Block>;
    }

    _renderTree(tree) {
        const els = [];
        for (let dir of Object.keys(tree.dirs)) {
            const subtree = tree.dirs[dir];
            els.push(<Block key={subtree.name}><b>{subtree.name}</b>{this._renderTree(subtree)}</Block>);
        }
        if (tree.files) {
            for (let file of tree.files) {
                const path = getDisplayPath(file);
                els.push(<Block key={path}><span onClick={() => this.props.onSelect(file)} style={getTreeFileStyle(file)}>{path.split('/').pop()}</span></Block>);
            }
        }
        return <Block marginLeft="10px">{els}</Block>;
    }

    _makeTree(changes) {
        const tree = {name: '', dirs: {}};
        for (let change of changes) {
            const path = getDisplayPath(change);
            const parts = path.split('/');
            const lastPart = parts.pop();
            var curNode = tree;
            for (let dir of parts) {
                if (!curNode.dirs[dir])
                    curNode.dirs[dir] = {name: dir, dirs: {}};
                curNode = curNode.dirs[dir];
            }
            if (!curNode.files)
                curNode.files = [];
            curNode.files.push(change);
        }
        return this._mergeTreePaths(tree);
    }

    _mergeTreePaths(tree) {
        const dirs = Object.keys(tree.dirs);
        const merged = tree;
        if (dirs.length === 1 && !tree.files) {
            const dir = tree.dirs[dirs[0]];
            tree = this._mergeTreePaths({
                name: tree.name + '/' + dir.name,
                dirs: dir.dirs,
                files: dir.files
            });
        } else {
            for (let dir of dirs) {
                merged.dirs[dir] = this._mergeTreePaths(tree.dirs[dir]);
            }
        }
        return tree;
    }
}

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
        var base = BASE_URL + '/review-sessions/' + props.reviewSession.id + '/blobs/';
        Promise.all([
            fetch(base + props.change.newId).then(r => r.text()),
            fetch(base + props.change.oldId).then(r => r.text())
        ]).then(results => this.setState({
            newBlob: results[0],
            oldBlob: results[1]
        }));
    }
}

class ReviewSessionRoute extends React.Component {
    constructor() {
        super();
        this.state = {
            data: null,
            selectedChange: null
        };
    }

    componentDidMount() {
        const id = this.context.router.getCurrentParams().id;
        fetch(BASE_URL + '/review-sessions/' + id)
            .then(r => r.json())
            .then(r => this.setState({data: r}));
    }

    render() {
        if (!this.state.data)
            return <div>Loading</div>;

        const {reviewSession, changes} = this.state.data;
        return <div>
            <h1>Review Session #{reviewSession.id}</h1>
            <p>{reviewSession.sourceBranch} &rarr; {reviewSession.targetBranch}</p>

            <Flex>
                <ReviewSessionSidebar
                    changes={changes}
                    onSelect={this._onSelect.bind(this)} />

                {this.state.selectedChange &&
                    <ReviewSessionDiff
                        reviewSession={reviewSession}
                        change={this.state.selectedChange} />}
            </Flex>
        </div>;
    }

    _onSelect(change) {
        this.setState({selectedChange: change});
    }
}
ReviewSessionRoute.contextTypes = {
    router: React.PropTypes.func
};

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
