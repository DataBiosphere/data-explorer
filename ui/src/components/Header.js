import './Header.css';

import React, { Component } from 'react';
import {white} from 'material-ui/styles/colors';

class Header extends Component {

    constructor(props) {
        super(props);
        this.state = {
            datasetName: props.datasetName,
            totalCount: props.totalCount
        };
    }

    render() {
        return (
            <div className="header">
                {/* TODO(alanhwang): Include the logo here */}
                <div className="headerBox">
                    <div className="datasetName">{this.state.datasetName}</div>
                    <div className="totalCountBoxText">
                        <div className="totalCount">{this.state.totalCount}</div>
                        <div>Participants</div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Header;
