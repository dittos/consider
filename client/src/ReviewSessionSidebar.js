import React from "react";
import {Link} from "react-router";
import {getDisplayPath} from "./Changes";

function getTreeFileStyle(change) {
    if (change.type == 'DELETE')
        return {textDecoration: 'line-through'};
    return {};
}

class ReviewSessionSidebar extends React.Component {
    render() {
        return <div className="ReviewSessionSidebar">
            {this._renderTree(this._makeTree(this.props.changes), 0)}
        </div>;
    }

    _renderTree(tree, depth) {
        const els = [];
        for (let dir of Object.keys(tree.dirs)) {
            const subtree = tree.dirs[dir];
            els.push(<div className="ReviewSessionSidebar__dir" key={subtree.name}>{subtree.name}/</div>);
            els.push(this._renderTree(subtree, depth + 1));
        }
        if (tree.files) {
            for (let file of tree.files) {
                const path = getDisplayPath(file);
                els.push(<Link
                    className="ReviewSessionSidebar__file"
                    key={path}
                    to="review-session"
                    params={{id: this.props.reviewSession.id}}
                    query={{path: path}}
                    style={getTreeFileStyle(file)}
                >
                    {path.split('/').pop()}
                </Link>);
            }
        }
        if (depth > 0)
            return <div className="ReviewSessionSidebar__subtree">{els}</div>;
        return els;
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

export default ReviewSessionSidebar;
