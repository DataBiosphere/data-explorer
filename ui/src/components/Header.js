import './Header.css';

import React from 'react';
import AccountCircle from 'material-ui/svg-icons/action/account-circle.js';
import {white} from 'material-ui/styles/colors';

function Header(props) {
    const count = props.count;

    return (
        <div className="header">
            {/* TODO(alanhwang): Include the logo here */}
            <div className="countBox">
                <AccountCircle color={white} className="icon"/>
                <div className="countBoxText">
                    <div className="count">{count}</div>
                    <div>Participants</div>
                </div>
            </div>
        </div>
    );
}

export default Header;