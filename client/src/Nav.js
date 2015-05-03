import React from "react";
import {Link} from "react-router";

class Nav extends React.Component {
    render() {
        return <div className="Nav">
            <Link to="/" className="Nav__logo">Consider</Link>
            {this.props.children}
        </div>;
    }
}

export default Nav;
