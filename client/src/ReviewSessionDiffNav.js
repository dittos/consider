import React from "react";

class ReviewSessionDiffNav extends React.Component {
    render() {
        const ranges = this.props.ranges;
        const regions = [];
        let totalLines = 0;
        for (let range of ranges) {
            totalLines += range.size;
        }
        for (let range of ranges) {
            regions.push(<div className={'ReviewSessionDiffNav__region ' + range.type}
                style={{height: (range.size / totalLines * 100) + '%'}} />);
        }
        return <div className="ReviewSessionDiffNav"
            onClick={this._onClick.bind(this)}
            onMouseMove={this._onMouseMove.bind(this)}>
            {regions}
        </div>;
    }

    _onClick(event) {
        var rect = React.findDOMNode(this).getBoundingClientRect();
        this.props.onScroll((event.clientY - rect.y) / rect.height);
    }

    _onMouseMove(event) {
        if (event.buttons !== 1)
            return;
        var rect = React.findDOMNode(this).getBoundingClientRect();
        this.props.onScroll((event.clientY - rect.y) / rect.height);
    }
}

export default ReviewSessionDiffNav;
