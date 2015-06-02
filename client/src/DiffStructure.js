import React from "react";
import * as API from "./API";
import Loading from "./Loading";

const ChangeType = {
    ADDED: 'a',
    REMOVED: 'r',
    CHANGED: 'c',
    UNCHANGED: ''
};

function hasOverlap(changeRanges, fromLine, toLine) {
    let newLine = 1;
    for (let range of changeRanges) {
        if (!range.type) {
            newLine += range.size;
        } else if (range.type === 'a') {
            const delta = {
                fromLine: newLine,
                toLine: newLine + range.size
            };
            if (!(delta.toLine < fromLine || toLine < delta.fromLine))
                return true;
            newLine = delta.toLine;
        }
    }
    return false;
}

function makeMethodKey(method) {
    return method.name + '(' + method.params + '):' + method.returnType;
}

function diffTypes(changeRanges, oldType, newType) {
    // TODO: mark added/removed type's subitems as added/removed
    // TODO: subTypes!
    const oldIndex = Object.create(null);
    const newIndex = Object.create(null);
    const delta = diffStructures(changeRanges, [oldType, newType]);
    delta.methods = [];
    for (let oldMethod of oldType.methods) {
        oldIndex[makeMethodKey(oldMethod)] = oldMethod;
    }
    for (let newMethod of newType.methods) {
        newIndex[makeMethodKey(newMethod)] = newMethod;
    }

    let changed = false;
    for (let newMethod of newType.methods) {
        if (!oldIndex[makeMethodKey(newMethod)]) {
            changed = true;
            delta.methods.push({
                type: ChangeType.ADDED,
                newItem: newMethod
            });
            continue;
        }
        const itemDelta = hasOverlap(changeRanges, newMethod.beginLineNumber, newMethod.endLineNumber);
        if (itemDelta)
            changed = true;
        delta.methods.push({
            type: itemDelta ? ChangeType.CHANGED : ChangeType.UNCHANGED,
            newItem: newMethod
        });
    }
    for (let oldMethod of oldType.methods) {
        if (!newIndex[makeMethodKey(oldMethod)]) {
            changed = true;
            delta.methods.push({
                type: ChangeType.REMOVED,
                oldItem: oldMethod
            });
        }
    }
    return changed && delta;
}

function diffStructures(changeRanges, structures) {
    const oldIndex = Object.create(null);
    const newIndex = Object.create(null);
    const delta = {types: []};
    for (let oldType of structures[0].types) {
        oldIndex[oldType.name] = oldType;
    }
    for (let newType of structures[1].types) {
        newIndex[newType.name] = newType;
    }

    for (let newType of structures[1].types) {
        if (!oldIndex[newType.name]) {
            delta.types.push({
                type: ChangeType.ADDED,
                newItem: newType
            });
            continue;
        }
        const itemDelta = diffTypes(changeRanges, oldIndex[newType.name], newType);
        if (!itemDelta)
            delta.types.push({
                type: ChangeType.UNCHANGED,
                newItem: newType
            });
        else
            delta.types.push({
                type: ChangeType.CHANGED,
                newItem: newType,
                delta: itemDelta
            });
    }
    for (let oldType of structures[0].types) {
        if (!newIndex[oldType.name])
            delta.types.push({
                type: ChangeType.REMOVED,
                oldItem: oldType
            });
    }

    return delta;
}

class DiffStructure extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            diff: null,
            hideUnchanged: true
        };
    }

    componentDidMount() {
        this._load(this.props);
    }

    componentWillReceiveProps(props) {
        this.setState({diff: null});
        this._load(props);
    }

    render() {
        if (!this.state.diff)
            return <div className="DiffStructure"><Loading /></div>;

        let types = this.state.diff.types;
        if (this.state.hideUnchanged)
            types = types.filter(t => Boolean(t.type));

        return <div className="DiffStructure">
            <div className="DiffStructure__header">
                <label><input type="checkbox" checked={this.state.hideUnchanged} onChange={() => this.setState({hideUnchanged: !this.state.hideUnchanged})} /> Hide unchanged</label>
            </div>
            <ul className="DiffStructure__types">
                {types.map(this._renderType.bind(this))}
            </ul>
        </div>;
    }

    _renderType(type) {
        let methods;
        if (type.delta) {
            methods = type.delta.methods;
            if (this.state.hideUnchanged)
                methods = methods.filter(t => Boolean(t.type));
        }

        return <li className="DiffStructure__type">
            <span className="typeName">{type.newItem.name}</span>
            {methods &&
                <ul className="DiffStructure__methods">
                    {methods.map(this._renderMethod.bind(this))}
                </ul>}
            {type.delta && type.delta.types.map(this._renderType.bind(this))}
        </li>;
    }

    _renderMethod(method) {
        const item = method.newItem || method.oldItem;
        return <li className={'DiffStructure__method ' + method.type}>
            {method.type === 'r' && <span className="removed">D</span>}
            {method.type === 'a' && <span className="added">A</span>}
            {method.type === 'c' && <span className="changed">C</span>}
            <span className="hljs-title">{item.name}</span>
            ({item.params})
            {item.returnType != 'void' &&
                <span className="returnType">{item.returnType}</span>}
        </li>;
    }

    _load(props) {
        Promise.all([
            props.change.type != 'ADD' && props.change.oldId,
            props.change.type != 'DELETE' && props.change.newId
        ].map(id => id ? API.getBlobStructure(props.reviewSession.id, id) : Promise.resolve({types: []}))).then(results => {
            this.setState({diff: diffStructures(props.ranges, results)});
        });
    }
}

export default DiffStructure;
