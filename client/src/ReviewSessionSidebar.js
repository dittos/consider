import React from "react";
import {Link} from "react-router";
import {Block} from "jsxstyle";
import {getDisplayPath} from "./Changes";

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
                els.push(<Block key={path}><Link to="review-session" params={{id: this.props.reviewSession.id}} query={{path: path}} style={getTreeFileStyle(file)}>{path.split('/').pop()}</Link></Block>);
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

export default ReviewSessionSidebar;
